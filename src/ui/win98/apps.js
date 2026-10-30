import { computer, docs, bin } from "./apps/folders.js";
import { ie } from "./apps/ie.js";
import { notepad } from "./apps/notepad.js";
import { minesweeper } from "./apps/minesweeper.js";
import { miner } from "./apps/miner.js";
import { claudinho } from "./apps/claudinho.js";

// desktop: shown as icons; menu: listed under Start > Programs. New app = one file in apps/ plus one entry here.
export const APPS = [computer, docs, ie, claudinho, bin, miner, minesweeper, notepad];
