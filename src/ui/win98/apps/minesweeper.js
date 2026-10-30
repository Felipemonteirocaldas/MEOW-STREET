import { flag } from "../../../game/state.js";
const N = 9, MINES = 10;
const pad = n => String(Math.max(0, Math.min(999, n))).padStart(3, "0");

export const minesweeper = {
  id: "mines", name: "Minesweeper", icon: "mine", desktop: true, menu: true,
  open(shell) {
    shell.openWindow({ id: "mines", title: "Minesweeper", ico: "mine", w: 190, h: 262, x: 220, y: 40, fixed: true,
      render(body, win) {
        body.innerHTML = `<div class="menubar"><span><u>G</u>ame</span><span><u>H</u>elp</span></div><div class="ms"><div class="ms-top sunken-lite"><div class="led left"></div><button class="btn face"></button><div class="led time"></div></div><div class="ms-grid"></div></div>`;
        const grid = body.querySelector(".ms-grid"), face = body.querySelector(".face"), left = body.querySelector(".left"), time = body.querySelector(".time");
        let cells, over, started, flags, t0, timer;
        const nbrs = i => { const x = i % N, y = (i / N) | 0, out = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if ((dx || dy) && nx >= 0 && ny >= 0 && nx < N && ny < N) out.push(ny * N + nx); } return out; };
        const draw = () => {
          grid.innerHTML = "";
          cells.forEach((c, i) => {
            const el = document.createElement("div"); el.className = "cell"; el.dataset.i = i;
            if (c.open) { el.classList.add("open"); if (c.mine) { el.textContent = "✹"; if (c.hit) el.classList.add("boom"); } else if (c.n) { el.textContent = c.n; el.classList.add("n" + c.n); } }
            else if (c.flag) el.textContent = "⚑";
            else if (over && c.mine) { el.classList.add("open"); el.textContent = "✹"; }
            grid.append(el);
          });
          left.textContent = pad(MINES - flags); face.textContent = over === "lost" ? "☹" : over === "won" ? "☺" : "🙂";
        };
        const reset = () => { clearInterval(timer); cells = Array.from({ length: N * N }, () => ({ mine: false, open: false, flag: false, n: 0 })); over = false; started = false; flags = 0; time.textContent = "000"; draw(); };
        const plant = safe => { // mines go down on the first click, never on it
          let m = 0; while (m < MINES) { const i = (Math.random() * N * N) | 0; if (i !== safe && !cells[i].mine) { cells[i].mine = true; m++; } }
          cells.forEach((c, i) => { c.n = nbrs(i).filter(j => cells[j].mine).length; });
        };
        const reveal = i => {
          const stack = [i];
          while (stack.length) { const c = cells[stack.pop()]; if (c.open || c.flag) continue; c.open = true; if (!c.n && !c.mine) nbrs(cells.indexOf(c)).forEach(j => stack.push(j)); }
        };
        const check = () => { if (cells.every(c => c.mine || c.open)) { over = "won"; flag("mines"); clearInterval(timer); cells.forEach(c => { if (c.mine) c.flag = true; }); flags = MINES; } };
        const press = (i, flag) => {
          const c = cells[i]; if (over) return;
          if (flag) { if (!c.open) { c.flag = !c.flag; flags += c.flag ? 1 : -1; } }
          else if (!c.flag && !c.open) {
            if (!started) { started = true; plant(i); t0 = Date.now(); timer = setInterval(() => { time.textContent = pad(((Date.now() - t0) / 1000) | 0); }, 500); }
            if (c.mine) { over = "lost"; c.open = true; c.hit = true; clearInterval(timer); } else { reveal(i); check(); }
          }
          draw();
        };
        grid.addEventListener("contextmenu", e => e.preventDefault());
        let hold = null; // touch has no right button: a quick tap digs, a long press plants a flag
        grid.addEventListener("pointerdown", e => {
          const el = e.target.closest(".cell"); if (!el) return; const i = +el.dataset.i;
          if (e.pointerType === "mouse") return press(i, e.button === 2);
          hold = setTimeout(() => { hold = null; press(i, true); }, 450); grid._i = i;
        });
        grid.addEventListener("pointerup", () => { if (hold) { clearTimeout(hold); hold = null; press(grid._i, false); } });
        grid.addEventListener("pointerleave", () => { clearTimeout(hold); hold = null; });
        face.onclick = reset;
        const old = win.close; win.close = () => { clearInterval(timer); old(); };
        reset();
      } });
  },
};
