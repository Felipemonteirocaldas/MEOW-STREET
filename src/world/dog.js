// ---------- the black dog (rare visitor) ----------
export let dogUntil = 0;
export const setDogUntil = t => { dogUntil = t; };
export const dogVisible = () => Date.now() < dogUntil;

