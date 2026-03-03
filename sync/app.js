const STORAGE_KEY = "syncPrep_state_v1";
const ARCHIVE_KEY = "syncPrep_archive_v1";
const WEEK_KEY = "syncPrep_weekKey_v1";

const DEFAULT_BUCKETS = ["Wins", "Risks", "Asks", "Next"];
const BUCKET_COLORS = ["#6366f1", "#f59e0b", "#a855f7", "#22c55e", "#0ea5e9"];

let state = null;
let archive = [];
let searchQuery = "";
let drag = { type: null };
let toastTimer = null;
let toastAction = null;
let lastDeleted = null;

const el = {
  board: document.getElementById("board"),
  banner: document.getElementById("banner"),
  toolbox: document.querySelector(".toolbox"),
  search: document.getElementById("search"),
  exportBtn: document.getElementById("exportBtn"),
  mdExportBtn: document.getElementById("mdExportBtn"),
  importBtn: document.getElementById("importBtn"),
  importFile: document.getElementById("importFile"),
  clearBtn: document.getElementById("clearBtn"),
  toast: document.getElementById("toast"),
  dragHint: document.getElementById("dragHint"),
  newItemBtn: document.getElementById("newItemBtn"),
  sortSelect: document.getElementById("sortSelect"),
  filterSelect: document.getElementById("filterSelect"),
  viewKanban: document.getElementById("viewKanban"),
  viewList: document.getElementById("viewList"),
  itemModal: document.getElementById("itemModal"),
  modalCloseBtn: document.getElementById("modalCloseBtn"),
  quickBucket: document.getElementById("quickBucket"),
  quickTitle: document.getElementById("quickTitle"),
  quickNote: document.getElementById("quickNote"),
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

function deepClone(x) {
  return JSON.parse(JSON.stringify(x));
}

function initState() {
  const buckets = DEFAULT_BUCKETS.map((name, i) => ({
    id: uid(),
    name,
    color: BUCKET_COLORS[i % BUCKET_COLORS.length],
    tickets: [],
  }));
  return { version: 1, ui: { view: "kanban", sort: "manual", filter: "open" }, buckets };
}

function colorForName(name) {
  const idx = DEFAULT_BUCKETS.indexOf(name);
  if (idx >= 0) return BUCKET_COLORS[idx % BUCKET_COLORS.length];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return BUCKET_COLORS[h % BUCKET_COLORS.length];
}

function normalizeTicket(t) {
  const title = String((t && (t.title ?? t.text)) || "").trim();
  return {
    id: (t && t.id) || uid(),
    title,
    note: t && typeof t.note === "string" ? t.note.trim() : "",
    link: t && t.link ? String(t.link).trim() : "",
    createdAt: t && typeof t.createdAt === "number" ? t.createdAt : nowTs(),
    done: !!(t && t.done),
  };
}

function normalizeState(raw) {
  const base = initState();
  if (!raw || !Array.isArray(raw.buckets)) return base;

  const ui = raw.ui && typeof raw.ui === "object" ? raw.ui : {};
  const view = ui.view === "list" ? "list" : "kanban";
  const sort = ["manual", "oldest", "newest", "title"].includes(ui.sort) ? ui.sort : "manual";
  const filter = ["open", "all", "done"].includes(ui.filter) ? ui.filter : "open";

  const mapped = raw.buckets.map((b) => ({
    id: b.id || uid(),
    name: String(b.name || "Untitled"),
    color: String(b.color || ""),
    tickets: Array.isArray(b.tickets) ? b.tickets.map(normalizeTicket).filter((x) => x.title) : [],
  }));

  const byName = new Map(mapped.map((b) => [b.name, b]));
  for (const name of DEFAULT_BUCKETS) {
    if (!byName.has(name)) {
      const nb = { id: uid(), name, color: colorForName(name), tickets: [] };
      mapped.push(nb);
      byName.set(name, nb);
    }
  }

  for (const b of mapped) {
    if (!b.color) b.color = colorForName(b.name);
  }

  return { version: 1, ui: { view, sort, filter }, buckets: mapped };
}

function cleanupForNewWeek() {
  const currentWeek = isoWeekKeyForBeirut();
  const storedWeek = localStorage.getItem(WEEK_KEY);
  if (!storedWeek) {
    localStorage.setItem(WEEK_KEY, currentWeek);
    return;
  }
  if (storedWeek === currentWeek) return;

  const prevRaw = loadJSON(STORAGE_KEY, null);
  if (prevRaw && prevRaw.buckets) {
    const prevNorm = normalizeState(prevRaw);
    const hasAny = prevNorm.buckets.some((b) => (b.tickets || []).length > 0);
    if (hasAny) {
      const prevArchive = loadJSON(ARCHIVE_KEY, []);
      prevArchive.push({ weekKey: storedWeek, archivedAt: nowTs(), state: deepClone(prevNorm) });
      saveJSON(ARCHIVE_KEY, prevArchive);
    }
  }

  localStorage.setItem(WEEK_KEY, currentWeek);
  saveJSON(STORAGE_KEY, initState());
  showBanner("New week started. Buckets reset.");
}

function showBanner(text) {
  el.banner.textContent = text;
  el.banner.hidden = false;
}

function showToast(text) {
  showToastAction(text);
}

function hideToast() {
  clearTimeout(toastTimer);
  toastTimer = null;
  el.toast.hidden = true;
  el.toast.replaceChildren();
  toastAction = null;
}

function showToastAction(text, actionLabel, actionFn) {
  clearTimeout(toastTimer);
  el.toast.replaceChildren();
  const msg = document.createElement("span");
  msg.textContent = text;
  el.toast.appendChild(msg);
  if (actionLabel && typeof actionFn === "function") {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "iconbtn";
    btn.textContent = actionLabel;
    btn.addEventListener("click", () => {
      actionFn();
      hideToast();
    });
    el.toast.appendChild(btn);
    toastAction = actionFn;
  } else {
    toastAction = null;
  }
  el.toast.hidden = false;
  toastTimer = setTimeout(hideToast, 2600);
}

function persist() {
  saveJSON(STORAGE_KEY, state);
}

function findBucket(bucketId) {
  return state.buckets.find((b) => b.id === bucketId) || null;
}

function findTicket(ticketId) {
  for (const b of state.buckets) {
    const t = b.tickets.find((x) => x.id === ticketId);
    if (t) return { bucket: b, ticket: t };
  }
  return null;
}

function matchesSearch(ticket) {
  const q = searchQuery.trim().toLowerCase();
  if (!q) return true;
  const a = (ticket.title || "").toLowerCase();
  const b = (ticket.link || "").toLowerCase();
  const c = (ticket.note || "").toLowerCase();
  return a.includes(q) || b.includes(q) || c.includes(q);
}

function humanAge(ts) {
  const days = Math.floor((nowTs() - ts) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "1d";
  return `${days}d`;
}

function renderQuickBucketOptions() {
  const current = el.quickBucket.value;
  el.quickBucket.innerHTML = "";
  for (const b of state.buckets) {
    const opt = document.createElement("option");
    opt.value = b.id;
    opt.textContent = b.name;
    el.quickBucket.appendChild(opt);
  }
  if (current && state.buckets.some((b) => b.id === current)) el.quickBucket.value = current;
}

function setView(view) {
  state.ui.view = view;
  persist();
  render();
}

function setSort(sort) {
  state.ui.sort = sort;
  if (state.ui.sort !== "manual") showToast("Sorting disables drag. Switch to Manual to drag.");
  persist();
  render();
}

function setFilter(filter) {
  state.ui.filter = filter;
  persist();
  render();
}

function renderTopbarState() {
  el.sortSelect.value = state.ui.sort;
  el.filterSelect.value = state.ui.filter;
  el.viewKanban.classList.toggle("active", state.ui.view === "kanban");
  el.viewList.classList.toggle("active", state.ui.view === "list");
  if (el.dragHint) {
    const allow = state.ui.view === "kanban" && state.ui.sort === "manual" && !searchQuery.trim() && state.ui.filter !== "done";
    document.body.setAttribute("data-drag-allowed", allow ? "1" : "0");
    el.dragHint.hidden = false;
    el.dragHint.textContent = allow ? "Drag cards to prioritize" : "Drag disabled: set Manual/Open and clear search";
  }
}

function sortTicketsView(tickets) {
  const mode = state.ui.sort;
  if (mode === "manual") return tickets;
  const copy = tickets.slice();
  if (mode === "oldest") copy.sort((a, b) => a.createdAt - b.createdAt);
  if (mode === "newest") copy.sort((a, b) => b.createdAt - a.createdAt);
  if (mode === "title") copy.sort((a, b) => a.title.localeCompare(b.title));
  return copy;
}

function addTicketToBucket(bucketId, ticketLike) {
  const bucket = findBucket(bucketId);
  if (!bucket) return;
  const t = normalizeTicket(ticketLike);
  if (!t.title) return;
  bucket.tickets.push(t);
  persist();
  render();
}

function deleteTicket(ticketId) {
  const found = findTicket(ticketId);
  if (!found) return;
  const idx = found.bucket.tickets.findIndex((t) => t.id === ticketId);
  if (idx < 0) return;
  const removed = found.bucket.tickets.splice(idx, 1)[0];
  lastDeleted = { bucketId: found.bucket.id, index: idx, ticket: removed };
  persist();
  render();
  showToastAction("Removed", "Undo", () => {
    if (!lastDeleted) return;
    const b = findBucket(lastDeleted.bucketId);
    if (!b) return;
    const at = Math.max(0, Math.min(lastDeleted.index, b.tickets.length));
    b.tickets.splice(at, 0, lastDeleted.ticket);
    persist();
    render();
    lastDeleted = null;
  });
}

function clearAllTickets() {
  const ok = confirm("Clear ALL items (open + done) from every bucket? This cannot be undone.");
  if (!ok) return;
  const next = normalizeState(state);
  for (const b of next.buckets) b.tickets = [];
  next.ui.sort = "manual";
  next.ui.filter = "open";
  state = next;
  searchQuery = "";
  el.search.value = "";
  lastDeleted = null;
  closeModal();
  persist();
  render();
  showToast("Cleared all");
}

function moveTicket(ticketId, toBucketId, toIndex) {
  const found = findTicket(ticketId);
  if (!found) return;
  const { bucket: fromBucket, ticket } = found;
  const toBucket = findBucket(toBucketId);
  if (!toBucket) return;
  const fromIdx = fromBucket.tickets.findIndex((t) => t.id === ticketId);
  if (fromIdx < 0) return;
  fromBucket.tickets.splice(fromIdx, 1);

  const active = toBucket.tickets.filter((t) => !t.done);
  const done = toBucket.tickets.filter((t) => t.done);
  const mapped = active.map((t) => t.id);
  const targetIdx = Math.max(0, Math.min(toIndex, mapped.length));
  const activeTickets = active.slice();
  activeTickets.splice(targetIdx, 0, ticket);
  toBucket.tickets = activeTickets.concat(done);
  persist();
  render();
}

function clearDropClasses() {
  el.board.querySelectorAll(".drop-before,.drop-after,.drag-over").forEach((n) => {
    n.classList.remove("drop-before", "drop-after", "drag-over");
  });
}

function ticketDropIndex(bucketId, overTicketId, after) {
  const bucket = findBucket(bucketId);
  if (!bucket) return 0;
  const active = bucket.tickets.filter((t) => !t.done && matchesSearch(t));
  if (!overTicketId) return active.length;
  const idx = active.findIndex((t) => t.id === overTicketId);
  if (idx < 0) return active.length;
  return after ? idx + 1 : idx;
}

function cssEscape(s) {
  return String(s).replace(/[^a-zA-Z0-9_-]/g, (m) => "\\" + m);
}

function renderTicketCard(ticket, draggable) {
  const card = document.createElement("div");
  card.className = "ticket" + (ticket.done ? " done" : "");
  card.setAttribute("data-ticket-id", ticket.id);
  card.draggable = !!draggable;
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
  text.textContent = ticket.title;

  const actions = document.createElement("div");
  actions.className = "ticketactions";
  const del = document.createElement("button");
  del.className = "iconbtn";
  del.type = "button";
  del.textContent = "Remove";
  del.setAttribute("data-delete", ticket.id);
  actions.appendChild(del);

  top.appendChild(text);
  top.appendChild(actions);
  body.appendChild(top);

  const meta = document.createElement("div");
  meta.className = "ticketmeta";
  const age = document.createElement("span");
  age.textContent = humanAge(ticket.createdAt);
  meta.appendChild(age);
  if (ticket.note) {
    const noteDetails = document.createElement("details");
    noteDetails.className = "noteline";
    const summary = document.createElement("summary");
    summary.textContent = "Note";
    const bodyNote = document.createElement("div");
    bodyNote.textContent = ticket.note;
    noteDetails.appendChild(summary);
    noteDetails.appendChild(bodyNote);
    meta.appendChild(noteDetails);
  }
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
  body.appendChild(meta);

  row.appendChild(boxWrap);
  row.appendChild(body);
  card.appendChild(row);
  return card;
}

function renderKanban() {
  el.board.classList.remove("list");
  el.board.innerHTML = "";

  const allowDrag = state.ui.sort === "manual" && !searchQuery.trim() && state.ui.filter !== "done";

  for (const b of state.buckets) {
    const col = document.createElement("section");
    col.className = "col";
    col.setAttribute("data-bucket-id", b.id);

    const head = document.createElement("div");
    head.className = "colhead";

    const title = document.createElement("div");
    title.className = "coltitle";
    const dot = document.createElement("span");
    dot.className = "dot";
    dot.style.background = b.color;
    title.appendChild(dot);
    const text = document.createElement("span");
    text.textContent = b.name;
    title.appendChild(text);

    const count = document.createElement("div");
    count.className = "colcount";
    count.textContent = `${b.tickets.filter((t) => !t.done).length}`;

    const actions = document.createElement("div");
    actions.className = "headactions";
    const add = document.createElement("button");
    add.type = "button";
    add.className = "headbtn";
    add.textContent = "+";
    add.setAttribute("data-col-add", b.id);
    actions.appendChild(add);

    head.appendChild(title);
    head.appendChild(count);
    head.appendChild(actions);
    col.appendChild(head);

    const list = document.createElement("div");
    list.className = "collist";
    list.setAttribute("data-ticket-list", b.id);

    const open = b.tickets.filter((t) => !t.done && matchesSearch(t));
    const done = b.tickets.filter((t) => t.done && matchesSearch(t));

    let openView = sortTicketsView(open);
    if (state.ui.filter === "done") openView = [];
    for (const t of openView) list.appendChild(renderTicketCard(t, allowDrag));

    col.appendChild(list);

    if (state.ui.filter !== "open") {
      const doneWrap = document.createElement("div");
      doneWrap.className = "donewrap";
      const details = document.createElement("details");
      details.className = "donedetails";
      details.open = state.ui.filter === "done";
      const summary = document.createElement("summary");
      summary.textContent = `Done (${b.tickets.filter((t) => t.done).length})`;
      details.appendChild(summary);
      const doneList = document.createElement("div");
      doneList.className = "done-list";
      doneList.setAttribute("data-done-list", b.id);
      const doneView = sortTicketsView(done);
      for (const t of doneView) doneList.appendChild(renderTicketCard(t, false));
      details.appendChild(doneList);
      doneWrap.appendChild(details);
      col.appendChild(doneWrap);
    }

    if (state.ui.filter !== "done") {
      const addBar = document.createElement("div");
      addBar.className = "addbar";
      const input = document.createElement("input");
      input.className = "addinput";
      input.type = "text";
      input.placeholder = "Title (Enter to add)";
      input.setAttribute("data-add-title", b.id);
      input.autocomplete = "off";
      addBar.appendChild(input);
      col.appendChild(addBar);
    }

    el.board.appendChild(col);
  }
}

function renderList() {
  el.board.classList.add("list");
  el.board.innerHTML = "";

  for (const b of state.buckets) {
    const group = document.createElement("section");
    group.className = "listgroup";

    const head = document.createElement("div");
    head.className = "listhead";
    const t = document.createElement("div");
    t.className = "coltitle";
    const dot = document.createElement("span");
    dot.className = "dot";
    dot.style.background = b.color;
    t.appendChild(dot);
    const txt = document.createElement("span");
    txt.textContent = b.name;
    t.appendChild(txt);
    const c = document.createElement("div");
    c.className = "colcount";
    c.textContent = `${b.tickets.filter((x) => !x.done).length} open`;
    head.appendChild(t);
    head.appendChild(c);
    group.appendChild(head);

    const items = document.createElement("div");
    items.className = "listitems";

    const open = b.tickets.filter((x) => !x.done && matchesSearch(x));
    const done = b.tickets.filter((x) => x.done && matchesSearch(x));

    let view = [];
    if (state.ui.filter === "open") view = open;
    if (state.ui.filter === "done") view = done;
    if (state.ui.filter === "all") view = open.concat(done);
    view = sortTicketsView(view);

    for (const ticket of view) {
      const row = document.createElement("div");
      row.className = "listrow" + (ticket.done ? " done" : "");
      row.setAttribute("data-ticket-id", ticket.id);

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = !!ticket.done;
      cb.setAttribute("data-done-toggle", ticket.id);

      const main = document.createElement("div");
      main.className = "listmain";
      const title = document.createElement("div");
      title.className = "listtitle";
      title.textContent = ticket.title;
      main.appendChild(title);
      const meta = document.createElement("div");
      meta.className = "listmeta";
      const age = document.createElement("span");
      age.textContent = humanAge(ticket.createdAt);
      meta.appendChild(age);
      if (ticket.note) {
        const noteDetails = document.createElement("details");
        noteDetails.className = "noteline";
        const summary = document.createElement("summary");
        summary.textContent = "Note";
        const bodyNote = document.createElement("div");
        bodyNote.textContent = ticket.note;
        noteDetails.appendChild(summary);
        noteDetails.appendChild(bodyNote);
        meta.appendChild(noteDetails);
      }
      if (ticket.link) {
        const a = document.createElement("a");
        a.className = "tlink";
        a.href = ticket.link;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = ticket.link;
        meta.appendChild(a);
      }
      main.appendChild(meta);

      const del = document.createElement("button");
      del.className = "iconbtn";
      del.type = "button";
      del.textContent = "Remove";
      del.setAttribute("data-delete", ticket.id);

      row.appendChild(cb);
      row.appendChild(main);
      row.appendChild(del);
      items.appendChild(row);
    }

    group.appendChild(items);
    el.board.appendChild(group);
  }
}

function renderBoard() {
  if (state.ui.view === "list") renderList();
  else renderKanban();
}

function render() {
  renderTopbarState();
  renderQuickBucketOptions();
  renderBoard();
}

function openModal() {
  el.itemModal.hidden = false;
  document.body.classList.add("modal-open");
  el.quickTitle.value = "";
  el.quickNote.value = "";
  el.quickLink.value = "";
  renderQuickBucketOptions();
  updateModalCTA();
  setTimeout(() => el.quickTitle.focus(), 0);
}

function closeModal() {
  el.itemModal.hidden = true;
  document.body.classList.remove("modal-open");
}

function quickAddSubmit() {
  const bucketId = el.quickBucket.value;
  const title = el.quickTitle.value.trim();
  const note = el.quickNote.value.trim();
  const link = el.quickLink.value.trim();
  if (!title) return;
  addTicketToBucket(bucketId, { title, note, link });
  closeModal();
}

function openModalForBucket(bucketId) {
  openModal();
  if (bucketId) el.quickBucket.value = bucketId;
}

function updateModalCTA() {
  el.quickAddBtn.disabled = !el.quickTitle.value.trim();
}

function exportJSON() {
  const payload = {
    app: "Weekly Sync Prep",
    schemaVersion: "v1",
    exportedAt: nowTs(),
    weekKey: localStorage.getItem(WEEK_KEY) || isoWeekKeyForBeirut(),
    state,
    archive,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `sync-prep-export-${payload.weekKey}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}

function exportMarkdown() {
  const lines = [];
  lines.push(`# Weekly Sync Prep (${localStorage.getItem(WEEK_KEY) || isoWeekKeyForBeirut()})`);
  for (const bucket of state.buckets) {
    lines.push(`\n## ${bucket.name}`);
    const view = bucket.tickets.slice();
    for (const t of view) {
      const doneMark = t.done ? "[x]" : "[ ]";
      const linkPart = t.link ? ` (${t.link})` : "";
      const notePart = t.note ? ` — ${t.note}` : "";
      lines.push(`- ${doneMark} ${t.title}${notePart}${linkPart}`);
    }
    if (view.length === 0) lines.push("- [ ] (empty)");
  }
  const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `sync-prep-${localStorage.getItem(WEEK_KEY) || isoWeekKeyForBeirut()}.md`;
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

  const nextState = parsed.state && parsed.state.buckets ? parsed.state : parsed;
  const nextArchive = Array.isArray(parsed.archive) ? parsed.archive : loadJSON(ARCHIVE_KEY, []);
  if (parsed.schemaVersion && parsed.schemaVersion !== "v1") {
    alert(`Importing schema ${parsed.schemaVersion}; expected v1. Data will be normalized.`);
  }

  if (!nextState || !Array.isArray(nextState.buckets)) {
    alert("JSON does not contain a valid Sync Prep state.");
    return;
  }

  const ok = confirm("Replace current Sync Prep data with this JSON? This cannot be undone.");
  if (!ok) return;

  state = normalizeState(nextState);
  archive = Array.isArray(nextArchive) ? nextArchive : [];
  persist();
  saveJSON(ARCHIVE_KEY, archive);
  localStorage.setItem(WEEK_KEY, parsed.weekKey || isoWeekKeyForBeirut());
  closeModal();
  showToast("Imported");
  render();
}

function bindEvents() {
  document.addEventListener("click", (e) => {
    if (!el.toolbox || !el.toolbox.open) return;
    if (el.toolbox.contains(e.target)) return;
    el.toolbox.open = false;
  });

  el.search.addEventListener("input", () => {
    searchQuery = el.search.value || "";
    render();
  });

  el.clearBtn.addEventListener("click", clearAllTickets);
  el.newItemBtn.addEventListener("click", () => openModalForBucket(el.quickBucket.value));
  el.modalCloseBtn.addEventListener("click", closeModal);
  el.quickCloseBtn.addEventListener("click", closeModal);
  el.quickAddBtn.addEventListener("click", quickAddSubmit);

  el.itemModal.addEventListener("click", (e) => {
    if (e.target && e.target.getAttribute && e.target.getAttribute("data-close-modal")) closeModal();
  });

  document.addEventListener(
    "pointerdown",
    (e) => {
      if (el.itemModal.hidden) return;
      const card = el.itemModal.querySelector(".modal-card");
      if (!card) return;
      if (!card.contains(e.target)) closeModal();
    },
    true
  );

  el.quickTitle.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      quickAddSubmit();
    }
  });
  el.quickTitle.addEventListener("input", updateModalCTA);
  el.quickNote.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      quickAddSubmit();
    }
  });
  el.quickNote.addEventListener("input", updateModalCTA);
  el.quickLink.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      quickAddSubmit();
    }
  });

  el.sortSelect.addEventListener("change", () => setSort(el.sortSelect.value));
  el.filterSelect.addEventListener("change", () => setFilter(el.filterSelect.value));

  el.viewKanban.addEventListener("click", () => setView("kanban"));
  el.viewList.addEventListener("click", () => setView("list"));

  el.exportBtn.addEventListener("click", exportJSON);
  el.mdExportBtn.addEventListener("click", exportMarkdown);
  el.importBtn.addEventListener("click", () => el.importFile.click());
  el.importFile.addEventListener("change", async () => {
    const f = el.importFile.files && el.importFile.files[0];
    el.importFile.value = "";
    if (!f) return;
    await importJSON(f);
  });

  document.addEventListener("keydown", (e) => {
    const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : "";
    const isTyping = tag === "input" || tag === "textarea" || tag === "select";
    if (e.key === "Escape") {
      closeModal();
      return;
    }
    if (e.key === "n" && !isTyping) {
      e.preventDefault();
      openModalForBucket(el.quickBucket.value);
    }
  });

  el.board.addEventListener("keydown", (e) => {
    if (state.ui.view !== "kanban") return;
    if (state.ui.filter === "done") return;
    const titleInput = e.target && e.target.matches && e.target.matches("[data-add-title]");
    if (!titleInput) return;
    if (e.key !== "Enter") return;
    e.preventDefault();
    const bucketId = e.target.getAttribute("data-add-title");
    const titleEl = el.board.querySelector(`[data-add-title="${cssEscape(bucketId)}"]`);
    const title = titleEl ? titleEl.value.trim() : "";
    if (!title) return;
    if (titleEl) titleEl.value = "";
    addTicketToBucket(bucketId, { title });
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
    const del = e.target && e.target.closest ? e.target.closest("[data-delete]") : null;
    if (del) {
      const id = del.getAttribute("data-delete");
      deleteTicket(id);
      return;
    }
    const colAdd = e.target && e.target.closest ? e.target.closest("[data-col-add]") : null;
    if (colAdd) {
      const bucketId = colAdd.getAttribute("data-col-add");
      openModalForBucket(bucketId);
      return;
    }
  });

  el.board.addEventListener("dragstart", (e) => {
    if (state.ui.view !== "kanban") return;
    if (state.ui.sort !== "manual") {
      e.preventDefault();
      showToast("Switch to Manual to drag");
      return;
    }
    if (state.ui.filter === "done") {
      e.preventDefault();
      showToast("Switch filter to Open/All to drag");
      return;
    }
    if (searchQuery.trim()) {
      e.preventDefault();
      showToast("Clear search to drag");
      return;
    }
    const t = e.target;
    clearDropClasses();

    if (t && t.matches && t.matches("[data-drag-ticket]")) {
      const ticketId = t.getAttribute("data-drag-ticket");
      const found = findTicket(ticketId);
      if (!found) return;
      drag = { type: "ticket", ticketId, fromBucketId: found.bucket.id };
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", JSON.stringify(drag));
      t.classList.add("dragging");
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
    if (state.ui.view !== "kanban") return;
    if (state.ui.sort !== "manual") return;
    if (!drag || !drag.type) return;
    e.preventDefault();
    const target = e.target;
    clearDropClasses();

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
    if (state.ui.view !== "kanban") return;
    if (state.ui.sort !== "manual") return;
    if (!drag || !drag.type) return;
    e.preventDefault();
    const target = e.target;

    if (drag.type === "ticket") {
      const col = target.closest && target.closest(".col");
      if (!col) return;
      const toBucketId = col.getAttribute("data-bucket-id");
      const ticketNode = target.closest && target.closest(".ticket");
      let overId = null;
      let after = false;
      if (ticketNode) {
        overId = ticketNode.getAttribute("data-ticket-id");
        const rect = ticketNode.getBoundingClientRect();
        after = (e.clientY - rect.top) > rect.height / 2;
      }
      const idx = ticketDropIndex(toBucketId, overId, after);
      moveTicket(drag.ticketId, toBucketId, idx);
      clearDropClasses();
      drag = { type: null };
    }
  });
}

function bootstrap() {
  cleanupForNewWeek();
  const v1 = loadJSON(STORAGE_KEY, null);
  state = normalizeState(v1 || initState());
  archive = loadJSON(ARCHIVE_KEY, []);
  persist();
  saveJSON(ARCHIVE_KEY, archive);
  bindEvents();
  render();
}

bootstrap();
