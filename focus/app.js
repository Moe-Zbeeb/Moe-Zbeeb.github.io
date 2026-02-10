const STORAGE_KEY = "focusLens_state_v1";
const ARCHIVE_KEY = "focusLens_archive_v1";
const WEEK_KEY = "focusLens_weekKey_v1";

const DEFAULT_DIRECTIONS = [
  "Leading Projects",
  "Contributing",
  "Emails",
  "Slack",
  "Papers & Blogs",
  "Today (P0)",
];

const PRIORITIES = ["P0", "P1", "P2"];
const PRIORITY_RANK = { P0: 0, P1: 1, P2: 2 };

let state = null;
let archive = [];
let searchQuery = "";
let openEditor = null;
let drag = { type: null };
let toastTimer = null;

const el = {
  board: document.getElementById("board"),
  focusList: document.getElementById("focusList"),
  search: document.getElementById("search"),
  banner: document.getElementById("banner"),
  exportBtn: document.getElementById("exportBtn"),
  importBtn: document.getElementById("importBtn"),
  importFile: document.getElementById("importFile"),
  toast: document.getElementById("toast"),
  quickAdd: document.getElementById("quickAdd"),
  quickDir: document.getElementById("quickDir"),
  quickPrio: document.getElementById("quickPrio"),
  quickText: document.getElementById("quickText"),
  quickLink: document.getElementById("quickLink"),
  quickAddBtn: document.getElementById("quickAddBtn"),
  quickCloseBtn: document.getElementById("quickCloseBtn"),
};

function uid() {
  if (crypto && crypto.randomUUID) return crypto.randomUUID();
  return "id_" + Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
}

function nowTs() {
  return Date.now();
}

function getBeirutYMD() {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Beirut",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = dtf.formatToParts(new Date());
  const m = {};
  for (const p of parts) {
    if (p.type !== "literal") m[p.type] = p.value;
  }
  return { y: Number(m.year), m: Number(m.month), d: Number(m.day) };
}

function isoWeekKeyForBeirut() {
  const { y, m, d } = getBeirutYMD();
  const date = new Date(Date.UTC(y, m - 1, d));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const weekYear = date.getUTCFullYear();
  const yearStart = new Date(Date.UTC(weekYear, 0, 1));
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return `${weekYear}-W${String(weekNo).padStart(2, "0")}`;
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function initState() {
  const directions = DEFAULT_DIRECTIONS.map((name) => ({
    id: uid(),
    name,
    tickets: [],
  }));
  return { version: 1, directions };
}

function deepClone(x) {
  return JSON.parse(JSON.stringify(x));
}

function cleanupForNewWeek() {
  const currentWeek = isoWeekKeyForBeirut();
  const storedWeek = localStorage.getItem(WEEK_KEY);

  if (!storedWeek) {
    localStorage.setItem(WEEK_KEY, currentWeek);
    return;
  }

  if (storedWeek === currentWeek) return;

  const prevState = loadJSON(STORAGE_KEY, null);
  if (prevState && prevState.directions) {
    const hasAny = prevState.directions.some((d) => (d.tickets || []).length > 0);
    if (hasAny) {
      const prevArchive = loadJSON(ARCHIVE_KEY, []);
      prevArchive.push({
        weekKey: storedWeek,
        archivedAt: nowTs(),
        state: deepClone(prevState),
      });
      saveJSON(ARCHIVE_KEY, prevArchive);
    }
  }

  localStorage.setItem(WEEK_KEY, currentWeek);
  saveJSON(STORAGE_KEY, initState());
  showBanner("New week started. Tickets reset.");
}

function showBanner(text) {
  el.banner.textContent = text;
  el.banner.hidden = false;
}

function showToast(text) {
  clearTimeout(toastTimer);
  el.toast.textContent = text;
  el.toast.hidden = false;
  toastTimer = setTimeout(() => {
    el.toast.hidden = true;
  }, 1600);
}

function findDirection(dirId) {
  return state.directions.find((d) => d.id === dirId) || null;
}

function findTicket(ticketId) {
  for (const d of state.directions) {
    const t = d.tickets.find((x) => x.id === ticketId);
    if (t) return { dir: d, ticket: t };
  }
  return null;
}

function normalizeTicket(t) {
  return {
    id: t.id || uid(),
    text: String(t.text || "").trim(),
    priority: PRIORITIES.includes(t.priority) ? t.priority : "P1",
    link: t.link ? String(t.link) : "",
    createdAt: typeof t.createdAt === "number" ? t.createdAt : nowTs(),
    done: !!t.done,
  };
}

function persist() {
  saveJSON(STORAGE_KEY, state);
}

function matchesSearch(ticket) {
  const q = searchQuery.trim().toLowerCase();
  if (!q) return true;
  const t = (ticket.text || "").toLowerCase();
  const l = (ticket.link || "").toLowerCase();
  return t.includes(q) || l.includes(q);
}

function humanAge(ts) {
  const days = Math.floor((nowTs() - ts) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "1d";
  return `${days}d`;
}

function render() {
  renderQuickDirOptions();
  renderFocusPanel();
  renderBoard();
}

function renderQuickDirOptions() {
  const current = el.quickDir.value;
  el.quickDir.innerHTML = "";
  for (const d of state.directions) {
    const opt = document.createElement("option");
    opt.value = d.id;
    opt.textContent = d.name;
    el.quickDir.appendChild(opt);
  }
  if (current && state.directions.some((d) => d.id === current)) el.quickDir.value = current;
}

function priorityPill(prio) {
  const span = document.createElement("span");
  span.className = `pill ${prio.toLowerCase()}`;
  span.textContent = prio;
  return span;
}

function focusCandidates() {
  const items = [];
  for (const d of state.directions) {
    for (const t of d.tickets) {
      if (t.done) continue;
      if (!matchesSearch(t)) continue;
      items.push({ dirId: d.id, dirName: d.name, ticket: t });
    }
  }
  items.sort((a, b) => {
    const pa = PRIORITY_RANK[a.ticket.priority] ?? 1;
    const pb = PRIORITY_RANK[b.ticket.priority] ?? 1;
    if (pa !== pb) return pa - pb;
    return a.ticket.createdAt - b.ticket.createdAt;
  });
  return items;
}

function renderFocusPanel() {
  el.focusList.innerHTML = "";
  const top = focusCandidates().slice(0, 5);
  if (top.length === 0) {
    const li = document.createElement("li");
    li.className = "focusitem";
    li.innerHTML = `<span class="pill p2">OK</span><div class="focus-main"><div class="focus-text">No actionable tickets</div><div class="focus-meta">Add a ticket to get started</div></div><div class="focus-age"></div>`;
    el.focusList.appendChild(li);
    return;
  }
  for (const item of top) {
    const li = document.createElement("li");
    li.className = "focusitem";
    li.appendChild(priorityPill(item.ticket.priority));
    const main = document.createElement("div");
    main.className = "focus-main";
    const text = document.createElement("div");
    text.className = "focus-text";
    text.textContent = item.ticket.text;
    const meta = document.createElement("div");
    meta.className = "focus-meta";
    meta.textContent = item.dirName;
    main.appendChild(text);
    main.appendChild(meta);
    const age = document.createElement("div");
    age.className = "focus-age";
    age.textContent = humanAge(item.ticket.createdAt);
    li.appendChild(main);
    li.appendChild(age);
    li.addEventListener("click", () => {
      const { dirId, ticket } = item;
      const node = el.board.querySelector(`[data-dir-id="${cssEscape(dirId)}"] [data-ticket-id="${cssEscape(ticket.id)}"]`);
      if (node) {
        node.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        openTicketEditor(ticket.id);
      }
    });
    el.focusList.appendChild(li);
  }
}

function renderBoard() {
  el.board.innerHTML = "";
  for (const d of state.directions) {
    const col = document.createElement("section");
    col.className = "col";
    col.dataset.dirId = d.id;
    col.setAttribute("data-dir-id", d.id);

    const activeTickets = d.tickets.filter((t) => !t.done && matchesSearch(t));
    const doneTickets = d.tickets.filter((t) => t.done && matchesSearch(t));

    const head = document.createElement("div");
    head.className = "colhead";
    head.draggable = true;
    head.setAttribute("data-drag-dir", d.id);

    const title = document.createElement("div");
    title.className = "coltitle";
    title.textContent = d.name;

    const count = document.createElement("div");
    count.className = "colcount";
    count.textContent = `${d.tickets.filter((t) => !t.done).length} open`;

    head.appendChild(title);
    head.appendChild(count);
    col.appendChild(head);

    const list = document.createElement("div");
    list.className = "collist";
    list.setAttribute("data-ticket-list", d.id);

    for (const t of activeTickets) {
      list.appendChild(renderTicket(d, t, false));
    }

    col.appendChild(list);

    const doneWrap = document.createElement("div");
    doneWrap.className = "donewrap";
    const details = document.createElement("details");
    details.className = "donedetails";
    const summary = document.createElement("summary");
    summary.textContent = `Done (${d.tickets.filter((t) => t.done).length})`;
    details.appendChild(summary);
    const doneList = document.createElement("div");
    doneList.className = "done-list";
    doneList.setAttribute("data-done-list", d.id);
    for (const t of doneTickets) {
      doneList.appendChild(renderTicket(d, t, true));
    }
    details.appendChild(doneList);
    doneWrap.appendChild(details);
    col.appendChild(doneWrap);

    const add = document.createElement("div");
    add.className = "addbar";
    const input = document.createElement("input");
    input.className = "addinput";
    input.type = "text";
    input.placeholder = "Add a ticket and press Enter";
    input.setAttribute("data-add-input", d.id);
    input.autocomplete = "off";
    add.appendChild(input);
    col.appendChild(add);

    el.board.appendChild(col);
  }
}

function renderTicket(dir, ticket, isDoneList) {
  const card = document.createElement("div");
  card.className = "ticket" + (ticket.done ? " done" : "");
  card.setAttribute("data-ticket-id", ticket.id);
  card.dataset.ticketId = ticket.id;

  const draggable = !ticket.done;
  card.draggable = draggable;
  if (draggable) card.setAttribute("data-drag-ticket", ticket.id);

  const row = document.createElement("div");
  row.className = "ticketrow";

  const boxWrap = document.createElement("div");
  boxWrap.className = "donebox";
  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.className = "donebox";
  cb.checked = !!ticket.done;
  cb.setAttribute("data-done-toggle", ticket.id);
  boxWrap.appendChild(cb);

  const body = document.createElement("div");
  body.className = "ticketbody";

  const top = document.createElement("div");
  top.className = "tickettop";

  const text = document.createElement("div");
  text.className = "tickettext";
  text.textContent = ticket.text;

  top.appendChild(text);
  top.appendChild(priorityPill(ticket.priority));

  const meta = document.createElement("div");
  meta.className = "ticketmeta";
  const age = document.createElement("span");
  age.textContent = humanAge(ticket.createdAt);
  meta.appendChild(age);
  if (ticket.link) {
    const a = document.createElement("a");
    a.className = "tlink";
    a.href = ticket.link;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = ticket.link;
    a.addEventListener("click", (e) => e.stopPropagation());
    meta.appendChild(a);
  }

  body.appendChild(top);
  body.appendChild(meta);
  row.appendChild(boxWrap);
  row.appendChild(body);
  card.appendChild(row);

  if (openEditor && openEditor.ticketId === ticket.id) {
    card.appendChild(renderEditor(ticket.id));
  }

  card.addEventListener("click", (e) => {
    if (e.target && (e.target.matches('input[type="checkbox"]') || e.target.matches("a"))) return;
    openTicketEditor(ticket.id);
  });

  return card;
}

function renderEditor(ticketId) {
  const found = findTicket(ticketId);
  if (!found) return document.createElement("div");
  const { ticket } = found;
  const wrap = document.createElement("div");
  wrap.className = "editor";
  wrap.setAttribute("data-editor", ticketId);

  const row1 = document.createElement("div");
  row1.className = "editor-row";
  const text = document.createElement("input");
  text.className = "field grow";
  text.type = "text";
  text.value = ticket.text;
  text.setAttribute("data-edit-text", ticketId);
  text.autocomplete = "off";
  row1.appendChild(text);
  wrap.appendChild(row1);

  const row2 = document.createElement("div");
  row2.className = "editor-row";
  const prio = document.createElement("select");
  prio.className = "field";
  prio.setAttribute("data-edit-prio", ticketId);
  for (const p of PRIORITIES) {
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    if (p === ticket.priority) opt.selected = true;
    prio.appendChild(opt);
  }
  const link = document.createElement("input");
  link.className = "field grow";
  link.type = "url";
  link.placeholder = "Link (optional)";
  link.value = ticket.link || "";
  link.setAttribute("data-edit-link", ticketId);
  link.autocomplete = "off";
  row2.appendChild(prio);
  row2.appendChild(link);
  wrap.appendChild(row2);

  const row3 = document.createElement("div");
  row3.className = "editor-row";
  const save = document.createElement("button");
  save.className = "btn primary";
  save.textContent = "Save";
  save.setAttribute("data-edit-save", ticketId);
  const close = document.createElement("button");
  close.className = "btn";
  close.textContent = "Close";
  close.setAttribute("data-edit-close", ticketId);
  row3.appendChild(save);
  row3.appendChild(close);
  wrap.appendChild(row3);

  setTimeout(() => {
    const node = el.board.querySelector(`[data-edit-text="${cssEscape(ticketId)}"]`);
    if (node) node.focus();
  }, 0);

  return wrap;
}

function openTicketEditor(ticketId) {
  openEditor = { ticketId };
  render();
}

function closeEditors() {
  openEditor = null;
  el.quickAdd.hidden = true;
  render();
}

function addTicketToDirection(dirId, ticketLike) {
  const dir = findDirection(dirId);
  if (!dir) return;
  const t = normalizeTicket(ticketLike);
  if (!t.text) return;
  dir.tickets.push(t);
  persist();
  render();
}

function moveTicket(ticketId, toDirId, toIndex) {
  const found = findTicket(ticketId);
  if (!found) return;
  const { dir: fromDir, ticket } = found;
  const toDir = findDirection(toDirId);
  if (!toDir) return;
  const fromIdx = fromDir.tickets.findIndex((t) => t.id === ticketId);
  if (fromIdx < 0) return;
  fromDir.tickets.splice(fromIdx, 1);

  const active = toDir.tickets.filter((t) => !t.done);
  const done = toDir.tickets.filter((t) => t.done);
  const mapped = active.map((t) => t.id);
  const targetIdx = Math.max(0, Math.min(toIndex, mapped.length));

  const activeTickets = active.slice();
  activeTickets.splice(targetIdx, 0, ticket);
  toDir.tickets = activeTickets.concat(done);
  persist();
  render();
}

function reorderWithinDirection(dirId, ticketId, toIndex) {
  moveTicket(ticketId, dirId, toIndex);
}

function reorderDirections(fromId, toId) {
  if (fromId === toId) return;
  const fromIdx = state.directions.findIndex((d) => d.id === fromId);
  const toIdx = state.directions.findIndex((d) => d.id === toId);
  if (fromIdx < 0 || toIdx < 0) return;
  const [d] = state.directions.splice(fromIdx, 1);
  state.directions.splice(toIdx, 0, d);
  persist();
  render();
}

function cssEscape(s) {
  return String(s).replace(/[^a-zA-Z0-9_-]/g, (m) => "\\" + m);
}

function clearDropClasses() {
  el.board.querySelectorAll(".drop-before,.drop-after,.drag-over").forEach((n) => {
    n.classList.remove("drop-before", "drop-after", "drag-over");
  });
}

function ticketDropIndex(dirId, overTicketId, after) {
  const dir = findDirection(dirId);
  if (!dir) return 0;
  const active = dir.tickets.filter((t) => !t.done && matchesSearch(t));
  if (!overTicketId) return active.length;
  const idx = active.findIndex((t) => t.id === overTicketId);
  if (idx < 0) return active.length;
  return after ? idx + 1 : idx;
}

function applyEditorSave(ticketId) {
  const found = findTicket(ticketId);
  if (!found) return;
  const t = found.ticket;
  const text = el.board.querySelector(`[data-edit-text="${cssEscape(ticketId)}"]`);
  const prio = el.board.querySelector(`[data-edit-prio="${cssEscape(ticketId)}"]`);
  const link = el.board.querySelector(`[data-edit-link="${cssEscape(ticketId)}"]`);
  const nextText = text ? text.value.trim() : t.text;
  const nextPrio = prio ? prio.value : t.priority;
  const nextLink = link ? link.value.trim() : t.link;
  if (!nextText) return;
  t.text = nextText;
  t.priority = PRIORITIES.includes(nextPrio) ? nextPrio : "P1";
  t.link = nextLink;
  persist();
  showToast("Saved");
  render();
}

function openQuickAdd() {
  el.quickAdd.hidden = false;
  renderQuickDirOptions();
  el.quickText.value = "";
  el.quickLink.value = "";
  el.quickPrio.value = "P1";
  setTimeout(() => el.quickText.focus(), 0);
}

function closeQuickAdd() {
  el.quickAdd.hidden = true;
}

function quickAddSubmit() {
  const dirId = el.quickDir.value;
  const text = el.quickText.value.trim();
  const prio = el.quickPrio.value;
  const link = el.quickLink.value.trim();
  if (!text) return;
  addTicketToDirection(dirId, { text, priority: prio, link });
  closeQuickAdd();
}

function exportJSON() {
  const payload = {
    app: "Focus Lens",
    exportedAt: nowTs(),
    weekKey: localStorage.getItem(WEEK_KEY) || isoWeekKeyForBeirut(),
    state,
    archive,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `focus-lens-export-${payload.weekKey}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}

async function importJSON(file) {
  const text = await file.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    alert("Invalid JSON file.");
    return;
  }

  const nextState = parsed.state && parsed.state.directions ? parsed.state : parsed;
  const nextArchive = Array.isArray(parsed.archive) ? parsed.archive : loadJSON(ARCHIVE_KEY, []);

  if (!nextState || !Array.isArray(nextState.directions)) {
    alert("JSON does not contain a valid Focus Lens state.");
    return;
  }

  const ok = confirm("Replace current Focus Lens data with this JSON? This cannot be undone.");
  if (!ok) return;

  const normalized = {
    version: 1,
    directions: nextState.directions.map((d) => ({
      id: d.id || uid(),
      name: String(d.name || "Untitled"),
      tickets: Array.isArray(d.tickets) ? d.tickets.map(normalizeTicket) : [],
    })),
  };

  state = normalized;
  archive = Array.isArray(nextArchive) ? nextArchive : [];
  persist();
  saveJSON(ARCHIVE_KEY, archive);
  localStorage.setItem(WEEK_KEY, parsed.weekKey || isoWeekKeyForBeirut());
  closeEditors();
  showToast("Imported");
  render();
}

function bindEvents() {
  el.search.addEventListener("input", () => {
    searchQuery = el.search.value || "";
    render();
  });

  el.exportBtn.addEventListener("click", exportJSON);
  el.importBtn.addEventListener("click", () => el.importFile.click());
  el.importFile.addEventListener("change", async () => {
    const f = el.importFile.files && el.importFile.files[0];
    el.importFile.value = "";
    if (!f) return;
    await importJSON(f);
  });

  el.quickAddBtn.addEventListener("click", quickAddSubmit);
  el.quickCloseBtn.addEventListener("click", () => {
    closeQuickAdd();
  });

  el.quickText.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      quickAddSubmit();
    }
  });

  el.quickLink.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      quickAddSubmit();
    }
  });

  document.addEventListener("keydown", (e) => {
    const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : "";
    const isTyping = tag === "input" || tag === "textarea" || tag === "select";
    if (e.key === "Escape") {
      closeEditors();
      return;
    }
    if (e.key === "n" && !isTyping) {
      e.preventDefault();
      openQuickAdd();
    }
  });

  el.board.addEventListener("keydown", (e) => {
    const add = e.target && e.target.matches && e.target.matches("[data-add-input]");
    if (!add) return;
    if (e.key !== "Enter") return;
    const dirId = e.target.getAttribute("data-add-input");
    const text = e.target.value.trim();
    if (!text) return;
    e.target.value = "";
    addTicketToDirection(dirId, { text });
  });

  el.board.addEventListener("click", (e) => {
    const doneToggle = e.target && e.target.matches && e.target.matches("[data-done-toggle]");
    if (doneToggle) {
      const id = e.target.getAttribute("data-done-toggle");
      const found = findTicket(id);
      if (!found) return;
      found.ticket.done = !!e.target.checked;
      persist();
      render();
      return;
    }

    const save = e.target && e.target.matches && e.target.matches("[data-edit-save]");
    if (save) {
      const id = e.target.getAttribute("data-edit-save");
      applyEditorSave(id);
      return;
    }
    const close = e.target && e.target.matches && e.target.matches("[data-edit-close]");
    if (close) {
      closeEditors();
      return;
    }
  });

  el.board.addEventListener("dragstart", (e) => {
    const t = e.target;
    clearDropClasses();

    if (t && t.matches && t.matches("[data-drag-ticket]")) {
      const ticketId = t.getAttribute("data-drag-ticket");
      const found = findTicket(ticketId);
      if (!found) return;
      drag = { type: "ticket", ticketId, fromDirId: found.dir.id };
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", JSON.stringify(drag));
      t.classList.add("dragging");
      return;
    }

    if (t && t.matches && t.matches("[data-drag-dir]")) {
      const dirId = t.getAttribute("data-drag-dir");
      drag = { type: "dir", dirId };
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", JSON.stringify(drag));
      return;
    }
  });

  el.board.addEventListener("dragend", (e) => {
    const t = e.target;
    if (t && t.classList) t.classList.remove("dragging");
    clearDropClasses();
    drag = { type: null };
  });

  el.board.addEventListener("dragover", (e) => {
    if (!drag || !drag.type) return;
    e.preventDefault();
    const target = e.target;

    clearDropClasses();

    if (drag.type === "dir") {
      const col = target.closest && target.closest(".col");
      if (!col) return;
      col.classList.add("drag-over");
      return;
    }

    if (drag.type === "ticket") {
      const col = target.closest && target.closest(".col");
      if (!col) return;
      col.classList.add("drag-over");

      const ticketNode = target.closest && target.closest(".ticket");
      if (!ticketNode) return;
      const overId = ticketNode.getAttribute("data-ticket-id");
      if (!overId || overId === drag.ticketId) return;
      const rect = ticketNode.getBoundingClientRect();
      const after = (e.clientY - rect.top) > rect.height / 2;
      ticketNode.classList.add(after ? "drop-after" : "drop-before");
    }
  });

  el.board.addEventListener("drop", (e) => {
    if (!drag || !drag.type) return;
    e.preventDefault();
    const target = e.target;

    if (drag.type === "dir") {
      const col = target.closest && target.closest(".col");
      if (!col) return;
      const toId = col.getAttribute("data-dir-id");
      reorderDirections(drag.dirId, toId);
      clearDropClasses();
      drag = { type: null };
      return;
    }

    if (drag.type === "ticket") {
      const col = target.closest && target.closest(".col");
      if (!col) return;
      const toDirId = col.getAttribute("data-dir-id");
      const ticketNode = target.closest && target.closest(".ticket");
      let overId = null;
      let after = false;
      if (ticketNode) {
        overId = ticketNode.getAttribute("data-ticket-id");
        const rect = ticketNode.getBoundingClientRect();
        after = (e.clientY - rect.top) > rect.height / 2;
      }
      const idx = ticketDropIndex(toDirId, overId, after);
      if (toDirId === drag.fromDirId) reorderWithinDirection(toDirId, drag.ticketId, idx);
      else moveTicket(drag.ticketId, toDirId, idx);
      clearDropClasses();
      drag = { type: null };
    }
  });
}

function bootstrap() {
  cleanupForNewWeek();
  state = loadJSON(STORAGE_KEY, null) || initState();
  archive = loadJSON(ARCHIVE_KEY, []);

  if (!state || !Array.isArray(state.directions) || state.directions.length === 0) {
    state = initState();
    persist();
  } else {
    state.directions = state.directions.map((d) => ({
      id: d.id || uid(),
      name: String(d.name || "Untitled"),
      tickets: Array.isArray(d.tickets) ? d.tickets.map(normalizeTicket) : [],
    }));
    persist();
  }

  bindEvents();
  render();
}

bootstrap();

