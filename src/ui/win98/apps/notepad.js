const KEY = "bd-notepad";
const load = () => { try { return localStorage.getItem(KEY) || ""; } catch (e) { return ""; } };

// Notepad. Opened from the menu it is the player's own scratch pad (kept in localStorage); opened on a document it shows that text read-only-ish.
export function openNotepad(shell, name, text) {
  const own = text === undefined;
  shell.openWindow({ id: own ? "notepad" : "np:" + name, title: `${own ? "Untitled" : name} - Notepad`, ico: "notepad", w: 400, h: 280, x: 60, y: 30,
    render(body) {
      body.innerHTML = `<div class="menubar"><span><u>F</u>ile</span><span><u>E</u>dit</span><span><u>S</u>earch</span><span><u>H</u>elp</span></div><textarea class="np sunken" spellcheck="false"></textarea>`;
      const ta = body.querySelector("textarea"); ta.value = own ? load() : text;
      ta.addEventListener("keydown", e => e.stopPropagation());
      if (own) ta.addEventListener("input", () => { try { localStorage.setItem(KEY, ta.value); } catch (e) {} });
    } });
}
export const notepad = { id: "notepad", name: "Notepad", icon: "notepad", menu: true, open: shell => openNotepad(shell) };
