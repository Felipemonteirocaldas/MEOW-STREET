import { S } from "./state.js";

// The weather outside the window is the player's real weather: the browser asks for their location once, the coordinates are
// rounded to ~10 km and kept only in this browser, and Open-Meteo is queried straight from here. Denied or offline: the server's NYC weather stays.
const KEY = "bd-geo";
const read = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } };
const denied = () => { try { return localStorage.getItem(KEY) === "no"; } catch (e) { return false; } };
const shape = d => { // same fields the server builds in fetch_weather()
  const code = d.weather_code, snow = (code >= 71 && code <= 77) || code === 85 || code === 86;
  return { temp: d.temperature_2m, code, is_day: d.is_day, snow, rain: !snow && ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95 || d.precipitation > 0), storm: code >= 95, fog: code === 45 || code === 48 };
};
async function refresh(pos) {
  try {
    const r = await (await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${pos.lat}&longitude=${pos.lon}&current=temperature_2m,precipitation,weather_code,is_day&timezone=auto`)).json();
    S.weather = shape(r.current); S.weatherSrc = "geo";
  } catch (e) { /* keep whatever we had */ }
}
function start(pos) { refresh(pos); setInterval(() => refresh(pos), 600000); }
const saved = read();
if (saved) start(saved);
else if (!denied() && navigator.geolocation) navigator.geolocation.getCurrentPosition(p => {
  const pos = { lat: +p.coords.latitude.toFixed(1), lon: +p.coords.longitude.toFixed(1) };
  try { localStorage.setItem(KEY, JSON.stringify(pos)); } catch (e) {}
  start(pos);
}, () => { try { localStorage.setItem(KEY, "no"); } catch (e) {} }, { timeout: 15000, maximumAge: 86400000 });
