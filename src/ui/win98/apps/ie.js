import { icon } from "../icons.js";
import { flag } from "../../../game/state.js";

// Meow Explorer: a real browser. Pages come through serve.py's /proxy (it strips the frame-blocking headers); about:home is a local page.
const HOME = "about:home";
// the proxy lives on serve.py's own port: a different origin from the game, so pages loaded through it can't read the game's save (dev server only)
const PROXY = import.meta.env.DEV ? `${location.protocol}//${location.hostname}:8091` : null;
const SEARCH = "https://html.duckduckgo.com/html/?q=";
const homeDoc = `<body style="margin:0;font:13px Tahoma,Arial,sans-serif;background:#fff"><div style="background:linear-gradient(90deg,#000080,#1084d0);color:#fff;padding:14px 18px">
<div style="font:italic bold 26px Arial">Welcome to the Internet</div><div>The whole world, one dial tone at a time.</div></div><div style="padding:14px 18px;line-height:22px">
<p>Type an address above, or search the Web. Some places to start:</p><ul>
<li><a data-u="https://en.wikipedia.org/wiki/Main_Page">Wikipedia, the free encyclopedia</a></li>
<li><a data-u="https://web.archive.org/web/1998/http://www.yahoo.com/">Travel to 1998 (Internet Archive)</a></li>
<li><a data-u="https://news.ycombinator.com/">Hacker News</a></li>
<li><a data-u="https://html.duckduckgo.com/html/">DuckDuckGo</a></li>
<li><a data-u="https://old.reddit.com/">Reddit (old)</a></li></ul></div>
<script>document.querySelectorAll('a[data-u]').forEach(function(a){a.style.cssText='color:#00e;text-decoration:underline;cursor:pointer';a.onclick=function(){parent.postMessage({win98nav:a.dataset.u},'*')}});</script></body>`;

// what to load for whatever was typed in the address bar
export function toUrl(text) {
  text = text.trim(); if (!text) return null;
  if (text === HOME || /^https?:\/\//i.test(text)) return text;
  if (!/\s/.test(text) && /^[\w-]+(\.[\w-]+)+(:\d+)?([/?#].*)?$/.test(text)) return "https://" + text;
  return SEARCH + encodeURIComponent(text);
}

export const ie = {
  id: "ie", name: "Meow Explorer", icon: "ie", desktop: true, menu: true,
  open(shell) {
    flag("web");
    shell.openWindow({ id: "ie", title: "Welcome to the Internet - Meow Explorer", ico: "ie", w: 620, h: 424, x: 10, y: 4,
      render(body, win) {
        const tool = (ico, label, id) => `<div class="tool" data-t="${id}">${icon(ico)}<span>${label}</span></div>`;
        body.innerHTML = `<div class="menubar"><span><u>F</u>ile</span><span><u>E</u>dit</span><span><u>V</u>iew</span><span>F<u>a</u>vorites</span><span><u>T</u>ools</span><span><u>H</u>elp</span></div>
          <div class="tools">${tool("back", "Back", "back")}${tool("forward", "Forward", "fwd")}${tool("stop", "Stop", "stop")}${tool("refresh", "Refresh", "ref")}${tool("home", "Home", "home")}${tool("search", "Search", "search")}${tool("star", "Favorites", "fav")}</div>
          <div class="addr"><span>A<u>d</u>dress</span><input class="sunken" spellcheck="false"><button class="btn go" style="min-width:44px;padding:0 6px">Go</button></div>
          <div class="view sunken"><iframe sandbox="allow-scripts allow-same-origin allow-forms allow-popups" title="page"></iframe></div>
          <div class="status"><div class="st" style="flex:1">Done</div><div style="width:120px">Internet zone</div></div>`;
        const fr = body.querySelector("iframe"), input = body.querySelector("input"), st = body.querySelector(".st");
        const back = body.querySelector('[data-t="back"]'), fwd = body.querySelector('[data-t="fwd"]');
        let hist = [HOME], idx = 0;
        const paint = () => { back.classList.toggle("dis", idx === 0); fwd.classList.toggle("dis", idx >= hist.length - 1); input.value = hist[idx] === HOME ? "about:home" : hist[idx]; };
        const load = u => {
          st.textContent = u === HOME ? "Done" : "Opening page " + u + "...";
          if (u === HOME) { fr.removeAttribute("src"); fr.srcdoc = homeDoc; win.setTitle("Welcome to the Internet - Meow Explorer"); }
          else if (!PROXY) fr.srcdoc = "<body style=\"font:12px Tahoma,sans-serif\"><h3>The page cannot be displayed</h3><p>The Internet needs the game's dev server (npm run dev).</p></body>";
          else { fr.removeAttribute("srcdoc"); fr.src = PROXY + "/proxy?url=" + encodeURIComponent(u); }
          paint();
        };
        const go = u => { if (!u) return; hist = hist.slice(0, idx + 1); hist.push(u); idx++; load(u); };
        const onMsg = e => {
          if (e.source !== fr.contentWindow || !e.data || (e.origin !== PROXY && e.origin !== location.origin)) return; // proxied pages post from the proxy origin, about:home from the game's own
          if (e.data.win98nav) return go(e.data.win98nav);
          if (e.data.win98) { // the proxied page reports where it really is, after redirects and link clicks
            if (e.data.url !== hist[idx]) { hist = hist.slice(0, idx + 1); hist.push(e.data.url); idx++; }
            win.setTitle((e.data.title || e.data.url) + " - Meow Explorer"); st.textContent = "Done"; paint();
          }
        };
        addEventListener("message", onMsg);
        const old = win.close; win.close = () => { removeEventListener("message", onMsg); old(); }; // closing also unhooks the listener
        body.querySelector(".go").onclick = () => go(toUrl(input.value));
        input.addEventListener("keydown", e => { e.stopPropagation(); if (e.key === "Enter") go(toUrl(input.value)); });
        input.addEventListener("focus", () => input.select());
        body.querySelector(".tools").onclick = e => {
          const t = e.target.closest(".tool")?.dataset.t;
          if (t === "back" && idx > 0) { idx--; load(hist[idx]); }
          else if (t === "fwd" && idx < hist.length - 1) { idx++; load(hist[idx]); }
          else if (t === "ref") load(hist[idx]);
          else if (t === "stop") { fr.removeAttribute("src"); st.textContent = "Done"; }
          else if (t === "home") go(HOME);
          else if (t === "search") go(SEARCH.replace("?q=", ""));
          else if (t === "fav") go("https://en.wikipedia.org/wiki/Main_Page");
        };
        load(HOME);
      } });
  },
};
