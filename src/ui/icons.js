// HUD / dashboard icons: 24x24 line icons drawn here (stroke = currentColor, so CSS colours them)
const s = body => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const IC = {
  produce: s('<rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3"/><rect x="10" y="10" width="4" height="4" rx=".6"/>'),
  news: s('<path d="M4 5h13a1 1 0 0 1 1 1v13H6a2 2 0 0 1-2-2z"/><path d="M18 9h2v8a2 2 0 0 1-2 2"/><path d="M7 9h8M7 12h8M7 15h5"/>'),
  exchange: s('<path d="M3 17l5-5 4 3 8-9"/><path d="M15 6h5v5"/><path d="M3 21h18"/>'),
  shop: s('<path d="M5 11V8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3"/><path d="M3 12a2 2 0 0 1 4 0v3h10v-3a2 2 0 0 1 4 0v6H3z"/><path d="M6 18v2M18 18v2"/>'),
  food: s('<path d="M7 3v8a2 2 0 0 0 2 2v8"/><path d="M5 3v5M9 3v5"/><path d="M17 3c-2 2-3 5-3 8h3v10"/>'),
  energy: s('<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>'),
  mood: s('<circle cx="12" cy="12" r="9"/><path d="M8.5 14a4.5 4.5 0 0 0 7 0"/><path d="M9 9.5h.01M15 9.5h.01"/>'),
  hygiene: s('<path d="M12 3c3.5 4.5 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 2.5-6.5 6-11z"/><path d="M9.5 14.5a2.7 2.7 0 0 0 2.5 2.5"/>'),
  cat: s('<path d="M4 4l4.5 3.2h7L20 4v9.5a8 8 0 0 1-16 0z"/><path d="M9 12.5h.01M15 12.5h.01" stroke-width="2.6"/><path d="M12 14.5v1.2M10 17.2c1.2.9 2.8.9 4 0"/>'),
  clue: s('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/>'),
  mail: s('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>'),
  trash: s('<path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
  power: s('<path d="M12 3v9"/><path d="M6.5 6.5a8 8 0 1 0 11 0"/>'),
  radio: s('<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M7 8l10-5"/><circle cx="9" cy="14" r="2.5"/><path d="M15 12h3M15 15h3"/>'),
  play: s('<path d="M7 4l13 8-13 8z" fill="currentColor"/>'),
  pause: s('<path d="M8 4v16M16 4v16" stroke-width="3.2"/>'),
  volume: s('<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>'),
  full: s('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
  unfull: s('<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>'),
  panel: s('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11"/>'),
  scene: s('<path d="M3 17l9-5 9 5-9 5z"/><path d="M3 12l9-5 9 5"/><path d="M3 7l9-5 9 5"/>'),
  menu: s('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  trophy: s('<path d="M8 4h8v6a4 4 0 0 1-8 0z"/><path d="M8 6H5a2 2 0 0 0 0 4h3M16 6h3a2 2 0 0 1 0 4h-3"/><path d="M12 14v4M8 21h8M10 18h4"/>'),
  dex: s('<path d="M3 13h18"/><path d="M6 13c0-5 2-8 6-8s6 3 6 8"/><path d="M5 18c0-2.5 3-4 7-4s7 1.500 7 4"/><circle cx="12" cy="10.500" r="0"/>'),
  up: s('<path d="M6 15l6-6 6 6"/>'), down: s('<path d="M6 9l6 6 6-6"/>'),
};
export const ico = (name, cls = "") => `<span class="ic ${cls}">${IC[name] || ""}</span>`;
