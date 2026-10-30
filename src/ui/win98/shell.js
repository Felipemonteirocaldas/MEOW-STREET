import { icon } from "./icons.js";
import { chirp } from "../../audio/droid.js";
import { nyc } from "../../game/clock.js";
import "./win98.css";

// The desktop: icons, windows (drag / minimise / maximise / close), taskbar, Start menu, clock, boot screen.
// Apps are plain objects { id, name, icon, open(shell) }; they build their window with shell.openWindow().
const BAR = 28;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const clock = () => { const d = nyc(), h = d.getHours(), m = String(d.getMinutes()).padStart(2, "0"); return `${(h % 12) || 12}:${m} ${h < 12 ? "AM" : "PM"}`; };

export function createShell(root, apps, { shutdown }) {
  root.classList.add("w98");
  root.innerHTML = `<div class="desk"></div><div class="bar"><button class="start raised">${icon("flag")}<span>Start</span></button><div class="vsep"></div><div class="tasks"></div>
    <div class="tray">${icon("speaker")}<span class="clk"></span></div></div>`;
  const desk = root.querySelector(".desk"), tasks = root.querySelector(".tasks"), startBtn = root.querySelector(".start"), clk = root.querySelector(".clk");
  const wins = []; let z = 10, menu = null, sel = null;
  const W = () => root.clientWidth, H = () => root.clientHeight, phone = () => W() < 520; // phone: windows open maximised, the desktop is as big as the screen
  const scale = () => root.getBoundingClientRect().width / W() || 1; // the monitor is CSS-scaled; pointer deltas have to be divided by it

  // ----- windows -----
  const shell = {
    desk, apps,
    openWindow({ id, title, ico = "folder", w = 320, h = 220, x, y, render, onClose, fixed }) {
      const old = id && wins.find(o => o.id === id); if (old) { old.show(); return old; }
      const el = document.createElement("div"); el.className = "win";
      el.innerHTML = `<div class="title">${icon(ico)}<span class="t"></span><button class="tb min" title="Minimize"><i></i></button>${fixed ? "" : '<button class="tb max" title="Maximize"><i></i></button>'}<button class="tb x" title="Close">×</button></div><div class="body"></div>`;
      const n = wins.length % 6; Object.assign(el.style, { width: w + "px", height: h + "px", left: (x ?? 40 + n * 22) + "px", top: (y ?? 24 + n * 22) + "px" });
      const small = phone(), snap = small && !fixed; // on a phone big windows fill the screen; dialogs stay centred
      if (snap) Object.assign(el.style, { left: "0px", top: "0px", width: W() + "px", height: H() - BAR + "px" });
      else if (small) Object.assign(el.style, { width: Math.min(w, W() - 16) + "px", left: Math.max(8, (W() - Math.min(w, W() - 16)) / 2) + "px", top: "60px" });
      desk.append(el);
      const task = document.createElement("button"); task.className = "task"; task.innerHTML = `${icon(ico)}<span></span>`; tasks.append(task);
      const win = { id, el, task, body: el.querySelector(".body"), min: false, max: snap, rect: null,
        setTitle(t) { el.querySelector(".t").textContent = t; task.querySelector("span").textContent = t; },
        focus() { wins.forEach(o => o.el.classList.toggle("off", o !== win)); el.style.zIndex = ++z; el.hidden = false; win.min = false; shell.active = win; paintTasks(); },
        show() { win.focus(); },
        minimize() { win.min = true; el.hidden = true; if (shell.active === win) shell.active = null; paintTasks(); },
        toggleMax() {
          if (!win.max) { win.rect = [el.style.left, el.style.top, el.style.width, el.style.height]; Object.assign(el.style, { left: "0px", top: "0px", width: W() + "px", height: H() - BAR + "px" }); }
          else [el.style.left, el.style.top, el.style.width, el.style.height] = win.rect;
          win.max = !win.max;
        },
        close() { if (onClose && onClose() === false) return; wins.splice(wins.indexOf(win), 1); el.remove(); task.remove(); if (shell.active === win) shell.active = null; paintTasks(); } };
      win.setTitle(title); wins.push(win);
      el.addEventListener("pointerdown", () => { if (shell.active !== win) win.focus(); closeMenu(); });
      el.querySelector(".min").onclick = () => win.minimize();
      el.querySelector(".max") && (el.querySelector(".max").onclick = () => win.toggleMax());
      el.querySelector(".x").onclick = () => win.close();
      el.querySelector(".title").addEventListener("dblclick", e => { if (!fixed && !e.target.closest(".tb")) win.toggleMax(); });
      el.querySelector(".title").addEventListener("pointerdown", e => { // drag by the title bar
        if (e.target.closest(".tb") || win.max) return;
        const s = scale(), ox = e.clientX, oy = e.clientY, l = el.offsetLeft, t = el.offsetTop; e.target.setPointerCapture(e.pointerId);
        const move = ev => { el.style.left = Math.max(-el.offsetWidth + 60, Math.min(W() - 40, l + (ev.clientX - ox) / s)) + "px"; el.style.top = Math.max(0, Math.min(H() - BAR - 20, t + (ev.clientY - oy) / s)) + "px"; };
        const up = () => { e.target.removeEventListener("pointermove", move); e.target.removeEventListener("pointerup", up); };
        e.target.addEventListener("pointermove", move); e.target.addEventListener("pointerup", up);
      });
      task.onclick = () => { if (win.min || shell.active !== win) win.focus(); else win.minimize(); };
      render(win.body, win); win.focus(); return win;
    },
    msgBox(title, text, ico = "info", btns = ["OK"]) {
      return new Promise(res => {
        const win = shell.openWindow({ title, ico: "info", w: 330, h: 124 + Math.ceil(text.length / 42) * 14, x: Math.max(8, (W() - 330) / 2), y: 120, fixed: true,
          render(b) {
            b.innerHTML = `<div class="dlg">${icon(ico)}<p>${esc(text)}</p></div><div class="dlgbtn"></div>`;
            btns.forEach((t, i) => { const bt = document.createElement("button"); bt.className = "btn" + (i ? "" : " def"); bt.textContent = t; bt.style.margin = "0 3px"; bt.onclick = () => { win.close(); res(t); }; b.querySelector(".dlgbtn").append(bt); });
          } });
        win.el.querySelector(".min").remove();
      });
    },
    active: null, open: id => apps.find(a => a.id === id)?.open(shell),
  };
  const paintTasks = () => wins.forEach(o => o.task.classList.toggle("on", shell.active === o && !o.min));

  // ----- desktop icons -----
  apps.filter(a => a.desktop).forEach((a, i) => {
    const el = document.createElement("div"); el.className = "dicon"; el.style.cssText = `left:${6 + (i % 1) * 0}px;top:${8 + i * 66}px`;
    el.innerHTML = `${icon(a.icon)}<span>${esc(a.name)}</span>`; desk.append(el);
    let last = 0;
    el.addEventListener("pointerdown", e => { e.stopPropagation(); closeMenu(); sel?.classList.remove("sel"); sel = el; el.classList.add("sel"); const t = Date.now(); if (t - last < 450) { last = 0; a.open(shell); } else last = t; });
  });
  desk.addEventListener("pointerdown", () => { sel?.classList.remove("sel"); sel = null; closeMenu(); wins.forEach(o => o.el.classList.add("off")); shell.active = null; paintTasks(); });

  // ----- start menu -----
  function closeMenu() { menu?.remove(); menu = null; startBtn.classList.remove("down"); }
  const item = (ico, label, run, sm) => { const li = document.createElement("li"); li.className = "mi" + (sm ? " sm" : ""); li.innerHTML = `${icon(ico)}<span>${label}</span>`; if (run) li.onclick = () => { closeMenu(); run(); }; return li; };
  startBtn.addEventListener("pointerdown", e => {
    e.stopPropagation();
    if (menu) return closeMenu();
    startBtn.classList.add("down");
    menu = document.createElement("div"); menu.className = "smenu";
    const ul = document.createElement("ul");
    const prog = item("folder", "<u>P</u>rograms"), fly = document.createElement("ul"); prog.classList.add("sub"); fly.className = "fly";
    apps.filter(a => a.menu).forEach(a => fly.append(item(a.icon, a.name, () => a.open(shell), true)));
    prog.append(fly); prog.onmouseenter = () => prog.classList.add("open"); prog.onmouseleave = () => prog.classList.remove("open"); prog.onclick = () => prog.classList.toggle("open");
    const na = t => () => shell.msgBox(t, `${t} is not available on this computer.`, "warn");
    ul.append(prog, item("folder", "<u>D</u>ocuments", () => shell.open("docs")), item("computer", "<u>S</u>ettings", na("Control Panel")),
      item("search", "<u>F</u>ind", na("Find")), item("info", "<u>H</u>elp", na("Help")), item("notepad", "<u>R</u>un...", na("Run")),
      Object.assign(document.createElement("div"), { className: "msep" }), item("computer", "Sh<u>u</u>t Down...", () => shell.msgBox("Shut Down Meow OS", "Are you sure you want to shut down your computer?", "warn", ["Yes", "No"]).then(a => a === "Yes" && shutdown())));
    const side = Object.assign(document.createElement("div"), { className: "side", innerHTML: "<b>Meow<span>OS 98</span></b>" });
    menu.append(side, ul); root.append(menu);
  });
  root.addEventListener("pointerdown", e => { if (menu && !e.target.closest(".smenu, .start")) closeMenu(); });

  // ----- clock + boot -----
  const tick = () => { clk.textContent = clock(); }; tick(); setInterval(tick, 15000);
  shell.boot = () => new Promise(done => {
    const lines = ["R2-DEBT BIOS v1.04  Copyright (C) 1998, Black Dog Systems", "", "CPU: 233 MHz   Memory Test: 65536K OK", "", "Detecting IDE Primary Master ... R2-DEBT DISK 2.1GB", "Detecting IDE Primary Slave  ... None", "Droid subsystem ........ bip-bop OK", "", "Starting Meow OS 98..."];
    const boot = Object.assign(document.createElement("div"), { className: "boot" }); root.append(boot); let i = 0;
    const next = () => { if (i < lines.length) { boot.textContent += lines[i++] + "\n"; setTimeout(next, 170); } else setTimeout(splash, 350); };
    const splash = () => { chirp(7); boot.className = "splash"; boot.innerHTML = "<div><b>Meow OS 98</b><i>Starting up...</i></div>"; setTimeout(() => { boot.remove(); done(); }, 1500); };
    next();
  });
  shell.destroy = () => { wins.splice(0).forEach(o => o.el.remove()); };
  return shell;
}
