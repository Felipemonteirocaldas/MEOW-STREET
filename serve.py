"""Dev server + central world feed.

Serves the game files and builds /worldstate.json from real sources:
- tech headlines (RSS) -> keyword matrix -> buffs/debuffs per production line
- BTC/USD (Binance, CoinGecko fallback) -> BDC price (BTC / 100k)
- current NYC weather (Open-Meteo)
Clients only download one small JSON; no AI or scraping runs on the phone.
"""
import hashlib, html, http.server, ipaddress, json, os, re, socket, socketserver, ssl, threading, time, urllib.error, urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime
from email.utils import parsedate_to_datetime
from urllib.parse import parse_qs, urlparse

ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(ROOT)
UA = {"User-Agent": "Mozilla/5.0 (BlackDogGame dev server)"}
BDC_DIVISOR = 100_000
# Real news per game language: native-language portals instead of machine translation.
FEEDS = {
    "en": [
        ("Hacker News", "https://hnrss.org/frontpage"),
        ("The Verge", "https://www.theverge.com/rss/index.xml"),
        ("Ars Technica", "https://feeds.arstechnica.com/arstechnica/index"),
        ("TechCrunch", "https://techcrunch.com/feed/"),
    ],
    "pt": [
        ("Tecnoblog", "https://tecnoblog.net/feed/"),
        ("Olhar Digital", "https://olhardigital.com.br/feed/"),
        ("Canaltech", "https://canaltech.com.br/rss/"),
        ("TecMundo", "https://rss.tecmundo.com.br/feed"),
    ],
}
# keyword matrix: (pattern, production line, +1 boost / -1 hit, faction). First match decides.
RULES_EN = [
    (r"\b(breach\w*|hack(ed|ers?)?|ransomware|leak\w*|vulnerabilit\w+|exploit\w*|zero-day|malware|cve|use-after-free|stol(en|e)|spy\w*)\b", "dados", -1, "sentinelas"),
    (r"\b(shortage|tariffs?|export ban|recall\w*)\b", "hardware", -1, "conselho"),
    (r"\b(regulat\w*|antitrust|lawsuit|sued|fined?|ftc|doj|court)\b", "dados", -1, "conselho"),
    (r"\b(layoffs?|lays off|shut(s|ting)? down|bankrupt\w*)\b", "software", -1, "conselho"),
    (r"\b(nvidia|gpus?|chips?|semiconductors?|tsmc|intel|amd|qualcomm|arm|processor)\b", "hardware", +1, "aurora"),
    (r"\b(ai|openai|llms?|gpt\w*|anthropic|claude|gemini|models?|agents?)\b", "software", +1, "aurora"),
    (r"\b(open.?source|linux|github|rust|python|release[sd]?)\b", "software", +1, "rede-livre"),
    (r"\b(data|database|cloud|storage|privacy|encryption)\b", "dados", +1, "sentinelas"),
]
RULES_PT = [
    (r"\b(vazament\w+|vaza\w*|hacker\w*|ataque\w*|ransomware|golpe\w*|falha\w*|vulnerabilidade\w*|malware|invas\w+|roub\w+)\b", "dados", -1, "sentinelas"),
    (r"\b(escassez|tarifa\w*|taxa\w* de importação|recall)\b", "hardware", -1, "conselho"),
    (r"\b(regula\w+|multa\w*|process\w+|anatel|anpd|stf|justiça|proib\w+|lei|investigação)\b", "dados", -1, "conselho"),
    (r"\b(demiss\w+|demite|layoffs?|falência|encerra\w*|fecha\w*)\b", "software", -1, "conselho"),
    (r"\b(nvidia|gpus?|chips?|semicondutor\w*|tsmc|intel|amd|qualcomm|processador\w*|placa de vídeo)\b", "hardware", +1, "aurora"),
    (r"\b(ia|inteligência artificial|openai|chatgpt|gpt\w*|anthropic|claude|gemini|copilot|modelo\w*|agente\w*|robô\w*)\b", "software", +1, "aurora"),
    (r"\b(código aberto|open source|linux|github|lança\w*|lançamento|atualização)\b", "software", +1, "rede-livre"),
    (r"\b(dados|nuvem|armazenamento|privacidade|criptografia)\b", "dados", +1, "sentinelas"),
]
RULES = {"en": RULES_EN, "pt": RULES_PT}
# never turn tragedies into game buffs
BLOCK = re.compile(r"\b(kill(ed|s)?|dies|died|death|dead|war|shooting|murder\w*|suicide|abuse"
                   r"|mort[eo]s?|morre\w*|guerra|tiroteio|assassin\w*|suicídio|abuso|estupro)\b", re.I)
# paid placements (mock until the advertiser panel exists); always labelled as sponsored in the UI
SPONSORED = {
    "pt": [{"id": "s1", "line": "software", "mult": 1.3, "dur_min": 180, "faction": "patrocinado", "sponsored": True,
            "advertiser": "NovaCloud", "headline": "NovaCloud lança hospedagem 40% mais barata para devs",
            "slogan": "Seu código nas nuvens. Literalmente.", "reward": {"mult": 2, "dur_min": 10}}],
    "en": [{"id": "s1en", "line": "software", "mult": 1.3, "dur_min": 180, "faction": "sponsored", "sponsored": True,
            "advertiser": "NovaCloud", "headline": "NovaCloud launches hosting 40% cheaper for developers",
            "slogan": "Your code in the clouds. Literally.", "reward": {"mult": 2, "dur_min": 10}}],
}


# ---------- /proxy: the in-game Windows 98 browser ----------
# Fetches a page for the game's Internet Explorer and strips what stops it from loading inside an iframe (X-Frame-Options, CSP).
# Safety: loopback clients only (the server binds to every interface), http/https only, and never to private/loopback addresses (SSRF).
MAX_PROXY_BYTES = 12 * 1024 * 1024


def public_url(url):
    u = urlparse(url)
    if u.scheme not in ("http", "https") or not u.hostname:
        return False
    try:
        infos = socket.getaddrinfo(u.hostname, u.port or (443 if u.scheme == "https" else 80), proto=socket.IPPROTO_TCP)
    except socket.gaierror:
        return False
    return all(ipaddress.ip_address(i[4][0]).is_global for i in infos)


class SafeRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if not public_url(newurl):
            raise urllib.error.URLError("redirect to a non-public address")
        return super().redirect_request(req, fp, code, msg, headers, newurl)


try:  # python.org builds on Windows often lack the system CA roots; certifi (pip install certifi) fixes HTTPS
    import certifi
    _ctx = ssl.create_default_context(cafile=certifi.where())
except ImportError:
    _ctx = ssl.create_default_context()
PROXY_OPENER = urllib.request.build_opener(SafeRedirect, urllib.request.HTTPSHandler(context=_ctx))
INJECT = """<base href="%(base)s"><script>(function(){var P=%(proxy)s,U=%(url)s;
function go(u){location.href=P+encodeURIComponent(u)}
function abs(h){try{return new URL(h,document.baseURI).href}catch(e){return null}}
document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href]');if(!a||e.defaultPrevented)return;var h=a.getAttribute('href');
if(!h||/^(javascript|mailto|tel|data):/i.test(h))return;if(h.charAt(0)==='#'){e.preventDefault();var t=document.getElementById(h.slice(1));t&&t.scrollIntoView();return}
var u=abs(h);if(u){e.preventDefault();go(u)}},true);
document.addEventListener('submit',function(e){var f=e.target;if((f.method||'get').toLowerCase()!=='get')return;e.preventDefault();
var u=new URL(f.getAttribute('action')||U,document.baseURI);new FormData(f).forEach(function(v,k){if(typeof v==='string')u.searchParams.set(k,v)});go(u.href)},true);
function tell(){parent.postMessage({win98:1,url:U,title:document.title},'*')}tell();addEventListener('load',tell);
})();</script>"""


def proxy_page(handler, target):
    client = handler.client_address[0]  # the game talks to this port directly (not through Vite), so the address can't be spoofed with a header
    if client not in ("127.0.0.1", "::1", "::ffff:127.0.0.1"):
        return handler.reply(b"proxy is local only", "text/plain", 403)
    if not public_url(target):
        return handler.reply(b"blocked address", "text/plain", 403)
    try:
        req = urllib.request.Request(target, headers={"User-Agent": "Mozilla/5.0 (Windows 98; Win98) Gecko/20010101", "Accept-Encoding": "identity",
                                                      "Accept": "text/html,*/*;q=0.8", "Accept-Language": handler.headers.get("Accept-Language", "en")})
        with PROXY_OPENER.open(req, timeout=15) as r:
            body, ctype, final = r.read(MAX_PROXY_BYTES + 1), r.headers.get("Content-Type", "application/octet-stream"), r.geturl()
    except Exception as e:
        msg = "<body style='font:12px Tahoma,sans-serif'><h3>The page cannot be displayed</h3><p>%s</p></body>" % html.escape(str(e))
        return handler.reply(msg.encode(), "text/html; charset=utf-8", 502)
    if len(body) > MAX_PROXY_BYTES:
        return handler.reply(b"too large", "text/plain", 413)
    if "html" in ctype.lower():
        body = re.sub(rb"<meta[^>]+http-equiv=[\"']?content-security-policy[^>]*>", b"", body, flags=re.I)
        host = handler.headers.get("Host", "localhost:8090")
        inj = (INJECT % {"base": html.escape(final, quote=True), "proxy": json.dumps("http://%s/proxy?url=" % host), "url": json.dumps(final)}).encode()
        m = re.search(rb"<head[^>]*>", body, re.I)
        body = body[:m.end()] + inj + body[m.end():] if m else inj + body
    handler.reply(body, ctype)


STATE = {"mods": {"en": [], "pt": []}, "market": None, "weather": None, "updated": 0}


def get(url, timeout=15):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r:
        return r.read()


def when(s):
    for parse in (lambda v: parsedate_to_datetime(v), lambda v: datetime.fromisoformat(v.replace("Z", "+00:00"))):
        try:
            return parse(s).timestamp()
        except Exception:
            pass
    return 0


def parse_feed(raw, source):
    out = []
    for el in ET.fromstring(raw).iter():
        if el.tag.split("}")[-1] not in ("item", "entry"):
            continue
        f = {c.tag.split("}")[-1]: c for c in el}
        title = html.unescape(f["title"].text or "").strip() if "title" in f else ""
        link = f.get("link")
        href = ((link.get("href") or link.text or "") if link is not None else "").strip()
        date = next((f[k].text for k in ("pubDate", "updated", "published") if k in f and f[k].text), "")
        if title:
            out.append({"title": title, "link": href, "t": when(date), "source": source})
    return out


def build_mods(items, rules):
    mods, per_line = [], {}
    for it in sorted(items, key=lambda i: -i["t"]):
        if BLOCK.search(it["title"]):
            continue
        hits = [r for r in rules if re.search(r[0], it["title"], re.I)]
        if not hits:
            continue
        _, line, sign, faction = hits[0]
        if per_line.get(line, 0) >= 2:
            continue
        per_line[line] = per_line.get(line, 0) + 1
        strength = min(len(hits), 3)
        mult = round(1 + 0.1 * strength, 2) if sign > 0 else round(1 - 0.08 * strength, 2)
        key = (it["link"] or it["title"]).encode()
        mods.append({"id": "n" + hashlib.md5(key).hexdigest()[:10], "line": line, "mult": mult, "dur_min": 240,
                     "faction": faction, "headline": it["title"], "source": it["source"], "link": it["link"]})
        if len(mods) >= 6:
            break
    return mods


def fetch_market():
    try:
        k = json.loads(get("https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=120"))
        closes, src = [float(c[4]) for c in k], "Binance"
    except Exception:
        d = json.loads(get("https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1"))
        closes, src = [p[1] for p in d["prices"]][-120:], "CoinGecko"
    btc = closes[-1]
    # shortcut: assumes 1-minute candles; with the CoinGecko fallback (5-min points) this spans ~5h, fine for a fallback
    change1h = (btc / closes[-61] - 1) * 100 if len(closes) > 61 else 0
    return {"pair": "BTC/USD", "source": src, "btc": round(btc, 2), "bdc": round(btc / BDC_DIVISOR, 4),
            "hist": [round(c / BDC_DIVISOR, 4) for c in closes], "change1h": round(change1h, 2)}


def fetch_weather():
    d = json.loads(get("https://api.open-meteo.com/v1/forecast?latitude=40.7128&longitude=-74.006"
                       "&current=temperature_2m,precipitation,weather_code,is_day&timezone=America%2FNew_York"))["current"]
    code = d["weather_code"]
    snow = 71 <= code <= 77 or code in (85, 86)
    rain = not snow and (51 <= code <= 67 or 80 <= code <= 82 or code >= 95 or d["precipitation"] > 0)
    return {"temp": d["temperature_2m"], "code": code, "is_day": d["is_day"], "rain": rain, "snow": snow,
            "storm": code >= 95, "fog": code in (45, 48)}


def refresher():
    last_news = last_weather = 0
    while True:
        try:
            STATE["market"] = fetch_market()
        except Exception as e:
            print("market:", e, flush=True)
        if time.time() - last_weather > 600:
            try:
                STATE["weather"], last_weather = fetch_weather(), time.time()
            except Exception as e:
                print("weather:", e, flush=True)
        if time.time() - last_news > 900:
            ok = False
            for lang, feeds in FEEDS.items():
                items = []
                for name, url in feeds:
                    try:
                        items += parse_feed(get(url), name)
                    except Exception as e:
                        print("feed", name, e, flush=True)
                if items:
                    STATE["mods"][lang], ok = build_mods(items, RULES[lang]), True
                    print(f"news[{lang}]: {len(items)} items -> {len(STATE['mods'][lang])} mods", flush=True)
            if ok:
                last_news = time.time()
        STATE["updated"] = time.time()
        time.sleep(60)


def newest():
    return max(os.path.getmtime(os.path.join(r, f)) for r, _, fs in os.walk(".") for f in fs if f.endswith((".html", ".js", ".css")))


class H(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith("/__v"):  # dev-only: client reloads when files change
            return self.reply(str(newest()).encode(), "text/plain")
        if self.path.startswith("/proxy"):
            return proxy_page(self, parse_qs(urlparse(self.path).query).get("url", [""])[0])
        if self.path.startswith("/worldstate.json"):
            lang = parse_qs(urlparse(self.path).query).get("lang", ["pt"])[0]
            lang = lang if lang in FEEDS else "en"
            body = {"epoch": int(STATE["updated"]), "lang": lang, "mods": STATE["mods"][lang] + SPONSORED[lang],
                    "market": STATE["market"], "weather": STATE["weather"]}
            return self.reply(json.dumps(body).encode(), "application/json")
        super().do_GET()

    def reply(self, data, ctype, status=200):
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.end_headers()
        self.wfile.write(data)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, *a):  # keep the console for feed logs
        pass


if __name__ == "__main__":
    threading.Thread(target=refresher, daemon=True).start()
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(("0.0.0.0", int(os.environ.get("PORT", 8090))), H) as s:
        s.serve_forever()
