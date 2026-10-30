export const nyc = () => new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
export function dayPhase() {
  const o = new URLSearchParams(location.search).get("t"); if (o) return o;
  const d = nyc(), h = d.getHours() + d.getMinutes() / 60;
  return h >= 7 && h < 17 ? "day" : (h >= 17 && h < 19.5) || (h >= 5.5 && h < 7) ? "dusk" : "night";
}

