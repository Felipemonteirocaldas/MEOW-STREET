import { icon } from "../icons.js";
import { flag } from "../../../game/state.js";
import { chirp } from "../../../audio/droid.js";
import { openNotepad } from "./notepad.js";

// My Computer, My Documents (a few files that open in Notepad) and the Recycle Bin: small folder windows
const folder = (shell, id, title, ico, files, x, y) => shell.openWindow({ id, title, ico, w: 340, h: 220, x, y,
  render(body) {
    body.innerHTML = `<div class="menubar"><span><u>F</u>ile</span><span><u>E</u>dit</span><span><u>V</u>iew</span><span><u>H</u>elp</span></div><div class="grow sunken"><div class="files"></div></div><div class="status"><div style="flex:1">${files.length} object(s)</div></div>`;
    files.forEach(f => { const el = document.createElement("div"); el.className = "file"; el.innerHTML = `${icon(f.icon)}<span>${f.name}</span>`; el.ondblclick = f.open; body.querySelector(".files").append(el); });
  } });

const LENA = `Dex,

if you're reading this I'm already gone. Don't look for me on Fulton Street.
The computer isn't what it looks like. Ask yourself who is paying for the electricity... and who is paying for the headlines.

Don't trust R2-DEBT.

- L.`;
const HOLO = `[ HOLOGRAM - 3 SECONDS, MUCH STATIC ]

Help me, Dex-Kenobi. You're my only hope.

...Okay, that's what the file says. The rest is bip-bop.
R2-DEBT insists it was recorded in a galaxy far, far away. The metadata says "Fulton Street, 4B".`;
const DRAFT = `Rent: $400. Light: $60. Cat food: $3 a can (Sombra judges every one).
Plan: R2-DEBT mines. I sell. Breathe.`;

export const computer = { id: "computer", name: "My Computer", icon: "computer", desktop: true,
  open: shell => folder(shell, "computer", "My Computer", "computer", [
    { name: "3½ Floppy (A:)", icon: "folder", open: () => shell.msgBox("A:\\", "A:\\ is not accessible. The device is not ready.", "warn") },
    { name: "R2-DEBT (C:)", icon: "folder", open: () => shell.open("docs") },
    { name: "CD-ROM (D:)", icon: "folder", open: () => shell.msgBox("D:\\", "D:\\ is not accessible. Please insert a disk.", "warn") },
  ], 30, 20) };
export const docs = { id: "docs", name: "My Documents", icon: "folder", desktop: true,
  open: shell => folder(shell, "docs", "My Documents", "folder", [
    { name: "lena.txt", icon: "notepad", open: () => openNotepad(shell, "lena.txt", LENA) },
    { name: "plan.txt", icon: "notepad", open: () => openNotepad(shell, "plan.txt", DRAFT) },
    { name: "ajuda.holo", icon: "info", open: () => { chirp(5, "sad"); flag("holo"); openNotepad(shell, "ajuda.holo", HOLO); } },
  ], 70, 40) };
export const bin = { id: "bin", name: "Recycle Bin", icon: "bin", desktop: true,
  open: shell => folder(shell, "bin", "Recycle Bin", "bin", [], 90, 60) };
