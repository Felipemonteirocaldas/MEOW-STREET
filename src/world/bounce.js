// leaf module: game/catalog.js needs it, and importing world/rooms.js there would make a cycle through the whole scene
export const bounces = {};
export function bounce(k) { bounces[k] = performance.now(); }
