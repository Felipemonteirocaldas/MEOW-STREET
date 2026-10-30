import { OPTS } from "../menu.js";

// a short buzz on touch devices for the moments that matter (purchase, achievement, bill paid); off in Options
export const buzz = (ms = 15) => { try { if (OPTS.haptics !== false && navigator.vibrate) navigator.vibrate(ms); } catch (e) {} };
