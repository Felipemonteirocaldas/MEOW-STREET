// Original pixel-ish icons (32x32 viewBox), drawn here rather than copied; scaled by CSS to 16 or 32.
const svg = body => `<svg viewBox="0 0 32 32" shape-rendering="crispEdges">${body}</svg>`;
const r = (x, y, w, h, f, s) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"${s ? ` stroke="${s}" stroke-width="1"` : ""}/>`;

export const ICONS = {
  computer: svg(r(4, 3, 24, 18, "#c0c0c0", "#000") + r(6, 5, 20, 14, "#008080", "#000") + r(7, 6, 8, 4, "#9ff") + r(10, 21, 12, 3, "#c0c0c0", "#000") + r(3, 24, 26, 6, "#c0c0c0", "#000") + r(6, 26, 8, 2, "#808080") + r(24, 26, 2, 2, "#0f0")),
  bin: svg(r(7, 8, 18, 21, "#c0c0c0", "#000") + r(5, 5, 22, 3, "#808080", "#000") + [10, 14, 18, 22].map(x => r(x, 11, 2, 15, "#808080")).join("") + r(12, 3, 8, 2, "#808080")),
  ie: svg(`<circle cx="16" cy="16" r="11" fill="#1a6fd6" stroke="#003a9a"/><circle cx="16" cy="16" r="6" fill="#fff"/>` + r(10, 14, 12, 3, "#1a6fd6") + `<path d="M3 21C10 30 26 27 29 8C24 14 12 18 3 21Z" fill="#ffd400" stroke="#a67c00"/>`),
  notepad: svg(r(6, 3, 20, 26, "#fff", "#000") + r(6, 3, 20, 4, "#000080") + [10, 14, 18, 22].map(y => r(9, y, 14, 1, "#00f")).join("") + r(9, 26, 8, 1, "#00f")),
  mine: svg(`<circle cx="16" cy="16" r="8" fill="#000"/>` + r(15, 4, 2, 24, "#000") + r(4, 15, 24, 2, "#000") + `<path d="M7 7L25 25M25 7L7 25" stroke="#000" stroke-width="2"/>` + r(12, 12, 3, 3, "#fff")),
  miner: svg(r(3, 4, 22, 16, "#d8cfb0", "#000") + r(5, 6, 18, 11, "#06140a", "#000") + r(7, 8, 8, 1, "#39d98a") + r(7, 11, 12, 1, "#39d98a") + r(7, 14, 6, 1, "#39d98a") + r(8, 20, 10, 3, "#d8cfb0", "#000") + r(4, 23, 24, 6, "#d8cfb0", "#000") + r(22, 25, 4, 2, "#808080") + r(24, 14, 6, 8, "#8a6a3a", "#000")),
  folder: svg(`<path d="M3 8h10l3 3h13v16H3z" fill="#ffd54a" stroke="#8a6a00"/>` + r(3, 13, 26, 14, "#ffe27a", "#8a6a00")),
  flag: svg(`<path d="M5 14L5 3L12 9Q16 8 20 9L27 3L27 14Q29 18 27 23Q23 30 16 30Q9 30 5 23Q3 18 5 14Z" fill="#141416" stroke="#000"/><path d="M7 6L11 10L7 12Z M25 6L21 10L25 12Z" fill="#c97b8a"/><ellipse cx="11.5" cy="17" rx="3" ry="3.4" fill="#d6e63a"/><ellipse cx="20.5" cy="17" rx="3" ry="3.4" fill="#d6e63a"/><rect x="10.7" y="14.6" width="1.6" height="5" fill="#000"/><rect x="19.7" y="14.6" width="1.6" height="5" fill="#000"/><path d="M14.5 21.5h3l-1.5 2z" fill="#e58aa0"/><path d="M16 23.5V25M16 25Q13.5 27 11.5 25.5M16 25Q18.5 27 20.5 25.5" stroke="#555" fill="none"/>`),
  ai: svg(`<path d="M5 6h22a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H15l-6 5v-5H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" fill="#ffb347" stroke="#7a3d00"/><circle cx="11.500" cy="13" r="2.700" fill="#fff" stroke="#000"/><circle cx="20.500" cy="13" r="1.800" fill="#fff" stroke="#000"/><rect x="11" y="12.300" width="1.600" height="1.600" fill="#000"/><rect x="21" y="12.600" width="1.200" height="1.200" fill="#000"/><path d="M11 18.500Q16 22 21 18" fill="none" stroke="#7a3d00" stroke-width="1.600"/>`),
  info: svg(`<circle cx="16" cy="16" r="13" fill="#fff" stroke="#000080" stroke-width="2"/>` + r(14, 14, 4, 11, "#000080") + r(14, 8, 4, 4, "#000080")),
  warn: svg(`<path d="M16 3L30 28H2Z" fill="#ffe000" stroke="#000"/>` + r(15, 11, 3, 9, "#000") + r(15, 22, 3, 3, "#000")),
  speaker: svg(`<path d="M5 12h6l7-6v20l-7-6H5z" fill="#808080" stroke="#000"/><path d="M22 11Q26 16 22 21M25 8Q31 16 25 24" fill="none" stroke="#000"/>`),
  // toolbar glyphs
  back: svg(`<circle cx="16" cy="16" r="12" fill="#3a9a3a" stroke="#0a4a0a"/><path d="M18 8L9 16L18 24V19H24V13H18Z" fill="#fff"/>`),
  forward: svg(`<circle cx="16" cy="16" r="12" fill="#3a9a3a" stroke="#0a4a0a"/><path d="M14 8L23 16L14 24V19H8V13H14Z" fill="#fff"/>`),
  stop: svg(`<circle cx="16" cy="16" r="12" fill="#d02020" stroke="#600"/><path d="M10 10L22 22M22 10L10 22" stroke="#fff" stroke-width="3"/>`),
  refresh: svg(`<rect x="5" y="4" width="22" height="24" fill="#fff" stroke="#000"/><path d="M10 16a6 6 0 1 1 3 5" fill="none" stroke="#2a8a2a" stroke-width="3"/><path d="M8 13L13 13L10 18Z" fill="#2a8a2a"/>`),
  home: svg(`<path d="M16 4L3 16H7V28H25V16H29Z" fill="#c8a060" stroke="#000"/>` + r(13, 18, 6, 10, "#6a3a1a", "#000") + r(22, 6, 3, 6, "#a02020", "#000")),
  search: svg(`<circle cx="13" cy="13" r="8" fill="#cfe8ff" stroke="#000" stroke-width="2"/><path d="M19 19L28 28" stroke="#000" stroke-width="4"/>`),
  star: svg(`<path d="M16 3L20 12L30 13L22 20L25 30L16 24L7 30L10 20L2 13L12 12Z" fill="#ffd400" stroke="#8a6a00"/>`),
};
export const icon = name => ICONS[name] || ICONS.info;
