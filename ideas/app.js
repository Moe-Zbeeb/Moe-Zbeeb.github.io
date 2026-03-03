const STORAGE_KEY = "ideaInbox_state_v1"
const ARCHIVE_KEY = "ideaInbox_archive_v1"
const WEEK_KEY = "ideaInbox_weekKey_v1"

const TRIAGE_ORDER = ["week", "later", "maybe"]
const TRIAGE_LABEL = { week: "This Week", later: "Later", maybe: "Maybe" }
const TRIAGE_COLORS = { week: "#2563eb", later: "#0ea5e9", maybe: "#a855f7" }

const STATE_VERSION = 1

let state = null
let archive = []
let searchQuery = ""
let drag = { type: null }
let toastTimer = null
let toastAction = null
let lastDeleted = null
let focusedCardId = null
let captureTriageTarget = null

const DEFAULT_PLACEHOLDER = "New idea (Enter to add, Ctrl/Cmd+Enter to pin)"

const el = {
  board: document.getElementById("board"),
  banner: document.getElementById("banner"),
  toolbox: document.querySelector(".toolbox"),
  search: document.getElementById("search"),
  tagFilter: document.getElementById("tagFilter"),
  pinnedToggle: document.getElementById("pinnedToggle"),
  exportBtn: document.getElementById("exportBtn"),
  mdExportBtn: document.getElementById("mdExportBtn"),
  importBtn: document.getElementById("importBtn"),
  importFile: document.getElementById("importFile"),
  clearBtn: document.getElementById("clearBtn"),
  toast: document.getElementById("toast"),
  dragHint: document.getElementById("dragHint"),
  sortSelect: document.getElementById("sortSelect"),
  viewStream: document.getElementById("viewStream"),
  viewBuckets: document.getElementById("viewBuckets"),
  captureTitle: document.getElementById("captureTitle"),
  captureTag: document.getElementById("captureTag"),
  captureLink: document.getElementById("captureLink"),
  captureAddBtn: document.getElementById("captureAddBtn"),
  shortcutHelp: document.getElementById("shortcutHelp"),
  shortcutClose: document.getElementById("shortcutClose"),
}

function uid() {
  if (crypto && crypto.randomUUID) return crypto.randomUUID()
  return "id_" + Math.random().toString(16).slice(2) + "_" + Date.now().toString(16)
}

function nowTs() {
  return Date.now()
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function getBeirutYMD() {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Beirut",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
  const parts = dtf.formatToParts(new Date())
  const m = {}
  for (const p of parts) {
    if (p.type !== "literal") m[p.type] = p.value
  }
  return { y: Number(m.year), m: Number(m.month), d: Number(m.day) }
}

function isoWeekKeyForBeirut() {
  const { y, m, d } = getBeirutYMD()
  const date = new Date(Date.UTC(y, m - 1, d))
  const day = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - day)
  const weekYear = date.getUTCFullYear()
  const yearStart = new Date(Date.UTC(weekYear, 0, 1))
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7)
  return `${weekYear}-W${String(weekNo).padStart(2, "0")}`
}

function beirutDayKey(ts) {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Beirut",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
  return dtf.format(new Date(ts))
}

function deepClone(x) {
  return JSON.parse(JSON.stringify(x))
}

function initState() {
  return {
    version: STATE_VERSION,
    ui: { view: "stream", sort: "newest", filterTag: "", showPinnedOnly: false },
    ideas: [],
  }
}

function normalizeIdea(i) {
  const title = String((i && i.title) || "").trim()
  const note = i && typeof i.note === "string" ? i.note.trim() : ""
  const tag = i && typeof i.tag === "string" ? i.tag.trim() : ""
  const link = i && i.link ? String(i.link).trim() : ""
  const triageRaw = i && i.triage ? String(i.triage) : "later"
  const triage = TRIAGE_ORDER.includes(triageRaw) ? triageRaw : "later"
  return {
    id: (i && i.id) || uid(),
    title,
    note,
    tag,
    link,
    createdAt: i && typeof i.createdAt === "number" ? i.createdAt : nowTs(),
    triage,
    pinned: !!(i && i.pinned),
    done: !!(i && i.done),
  }
}

function normalizeState(raw) {
  const base = initState()
  if (!raw || !Array.isArray(raw.ideas)) return base
  const ui = raw.ui && typeof raw.ui === "object" ? raw.ui : {}
  const view = ui.view === "buckets" ? "buckets" : "stream"
  const sort = ["newest", "oldest", "title"].includes(ui.sort) ? ui.sort : "newest"
  const filterTag = ui.filterTag && typeof ui.filterTag === "string" ? ui.filterTag : ""
  const showPinnedOnly = !!ui.showPinnedOnly
  const ideas = raw.ideas.map(normalizeIdea).filter((x) => x.title)
  return { version: STATE_VERSION, ui: { view, sort, filterTag, showPinnedOnly }, ideas }
}

function cleanupForNewWeek() {
  const currentWeek = isoWeekKeyForBeirut()
  const storedWeek = localStorage.getItem(WEEK_KEY)
  if (!storedWeek) {
    localStorage.setItem(WEEK_KEY, currentWeek)
    return
  }
  if (storedWeek === currentWeek) return
  const prevRaw = loadJSON(STORAGE_KEY, null)
  if (prevRaw && prevRaw.ideas && prevRaw.ideas.length > 0) {
    const prevNorm = normalizeState(prevRaw)
    if (prevNorm.ideas.length > 0) {
      const prevArchive = loadJSON(ARCHIVE_KEY, [])
      prevArchive.push({ weekKey: storedWeek, archivedAt: nowTs(), state: deepClone(prevNorm) })
      saveJSON(ARCHIVE_KEY, prevArchive)
    }
  }
  localStorage.setItem(WEEK_KEY, currentWeek)
  saveJSON(STORAGE_KEY, initState())
  showBanner("New week started. Ideas reset.")
}

function showBanner(text) {
  el.banner.textContent = text
  el.banner.hidden = false
}

function showToast(text) {
  showToastAction(text)
}

function hideToast() {
  clearTimeout(toastTimer)
  toastTimer = null
  el.toast.hidden = true
  el.toast.replaceChildren()
  toastAction = null
}

function showToastAction(text, actionLabel, actionFn) {
  clearTimeout(toastTimer)
  el.toast.replaceChildren()
  const msg = document.createElement("span")
  msg.textContent = text
  el.toast.appendChild(msg)
  if (actionLabel && typeof actionFn === "function") {
    const btn = document.createElement("button")
    btn.type = "button"
    btn.className = "iconbtn"
    btn.textContent = actionLabel
    btn.addEventListener("click", () => {
      actionFn()
      hideToast()
    })
    el.toast.appendChild(btn)
    toastAction = actionFn
  } else {
    toastAction = null
  }
  el.toast.hidden = false
  toastTimer = setTimeout(hideToast, 2600)
}

function persist() {
  saveJSON(STORAGE_KEY, state)
}

function matchesSearch(idea) {
  const q = searchQuery.trim().toLowerCase()
  if (!q) return true
  const a = (idea.title || "").toLowerCase()
  const b = (idea.note || "").toLowerCase()
  const c = (idea.tag || "").toLowerCase()
  const d = (idea.link || "").toLowerCase()
  return a.includes(q) || b.includes(q) || c.includes(q) || d.includes(q)
}

function humanAge(ts) {
  const days = Math.floor((nowTs() - ts) / 86400000)
  if (days <= 0) return "today"
  if (days === 1) return "1d"
  return `${days}d`
}

function sortIdeas(list) {
  const copy = list.slice()
  copy.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    if (state.ui.sort === "newest") return b.createdAt - a.createdAt
    if (state.ui.sort === "oldest") return a.createdAt - b.createdAt
    return a.title.localeCompare(b.title)
  })
  return copy
}

function filteredIdeas() {
  const tag = state.ui.filterTag.trim().toLowerCase()
  const arr = state.ideas.filter((i) => {
    if (state.ui.showPinnedOnly && !i.pinned) return false
    if (tag && i.tag.toLowerCase() !== tag) return false
    if (!matchesSearch(i)) return false
    return true
  })
  return sortIdeas(arr)
}

function renderTagFilterOptions() {
  const tags = new Set(state.ideas.map((i) => i.tag).filter((t) => t))
  const current = state.ui.filterTag
  el.tagFilter.innerHTML = ""
  const allOpt = document.createElement("option")
  allOpt.value = ""
  allOpt.textContent = "Filter: All tags"
  el.tagFilter.appendChild(allOpt)
  Array.from(tags)
    .sort((a, b) => a.localeCompare(b))
    .forEach((t) => {
      const opt = document.createElement("option")
      opt.value = t
      opt.textContent = t
      el.tagFilter.appendChild(opt)
    })
  el.tagFilter.value = current || ""
}

function renderTopbarState() {
  el.sortSelect.value = state.ui.sort
  el.viewStream.classList.toggle("active", state.ui.view === "stream")
  el.viewBuckets.classList.toggle("active", state.ui.view === "buckets")
  el.pinnedToggle.textContent = state.ui.showPinnedOnly ? "Pinned: On" : "Pinned: Off"
  renderTagFilterOptions()
  const allow = state.ui.view === "buckets" && state.ui.sort === "newest" && !state.ui.filterTag && !state.ui.showPinnedOnly && !searchQuery.trim()
  document.body.setAttribute("data-drag-allowed", allow ? "1" : "0")
  el.dragHint.hidden = false
  el.dragHint.textContent = allow ? "Drag cards to triage" : "Drag disabled: set Buckets/Newest, clear filters and search"
}

function triageColor(triage) {
  return TRIAGE_COLORS[triage] || "#94a3b8"
}

function renderIdeaCard(idea, draggable) {
  const card = document.createElement("div")
  card.className = "ticket" + (idea.done ? " done" : "")
  card.setAttribute("data-idea-id", idea.id)
  card.tabIndex = 0
  if (draggable) {
    card.draggable = true
    card.setAttribute("data-drag-idea", idea.id)
  }

  const row = document.createElement("div")
  row.className = "ticketrow"

  const boxWrap = document.createElement("div")
  boxWrap.className = "donebox"
  const cb = document.createElement("input")
  cb.type = "checkbox"
  cb.className = "donebox"
  cb.checked = !!idea.done
  cb.setAttribute("data-done-toggle", idea.id)
  boxWrap.appendChild(cb)

  const body = document.createElement("div")
  body.className = "ticketbody"

  const top = document.createElement("div")
  top.className = "tickettop"

  const text = document.createElement("div")
  text.className = "tickettext"
  text.textContent = idea.title

  const actions = document.createElement("div")
  actions.className = "ticketactions"

  const pin = document.createElement("button")
  pin.type = "button"
  pin.className = "pinbtn" + (idea.pinned ? " active" : "")
  pin.textContent = "★"
  pin.setAttribute("data-pin", idea.id)

  const triageBtn = document.createElement("button")
  triageBtn.type = "button"
  triageBtn.className = "triagechip"
  triageBtn.style.borderColor = triageColor(idea.triage)
  triageBtn.style.color = triageColor(idea.triage)
  triageBtn.setAttribute("data-triage", idea.id)
  triageBtn.textContent = TRIAGE_LABEL[idea.triage] || "Later"

  const copy = document.createElement("button")
  copy.type = "button"
  copy.className = "iconbtn"
  copy.textContent = "Copy"
  copy.setAttribute("data-copy", idea.id)

  const del = document.createElement("button")
  del.className = "iconbtn"
  del.type = "button"
  del.textContent = "Remove"
  del.setAttribute("data-delete", idea.id)

  actions.appendChild(pin)
  actions.appendChild(triageBtn)
  actions.appendChild(copy)
  actions.appendChild(del)

  top.appendChild(text)
  top.appendChild(actions)
  body.appendChild(top)

  const meta = document.createElement("div")
  meta.className = "ticketmeta"
  const age = document.createElement("span")
  age.textContent = humanAge(idea.createdAt)
  meta.appendChild(age)
  if (idea.pinned) {
    const badge = document.createElement("span")
    badge.className = "badge"
    badge.textContent = "Pinned"
    meta.appendChild(badge)
  }
  if (idea.tag) {
    const chip = document.createElement("span")
    chip.className = "tagchip"
    chip.textContent = idea.tag
    chip.style.borderColor = tagColor(idea.tag)
    chip.style.background = "#eef2f8"
    chip.setAttribute("data-tag-filter", idea.tag)
    meta.appendChild(chip)
  }
  if (idea.note) {
    const noteDetails = document.createElement("details")
    noteDetails.className = "noteline"
    const summary = document.createElement("summary")
    summary.textContent = "Note"
    const bodyNote = document.createElement("div")
    bodyNote.textContent = idea.note
    noteDetails.appendChild(summary)
    noteDetails.appendChild(bodyNote)
    meta.appendChild(noteDetails)
  }
  if (idea.link) {
    const a = document.createElement("a")
    a.className = "tlink"
    a.href = idea.link
    a.target = "_blank"
    a.rel = "noopener noreferrer"
    a.textContent = idea.link
    a.addEventListener("click", (e) => e.stopPropagation())
    meta.appendChild(a)
  }
  body.appendChild(meta)

  row.appendChild(boxWrap)
  row.appendChild(body)
  card.appendChild(row)
  return card
}

function tagColor(tag) {
  let h = 0
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) >>> 0
  return `hsl(${h % 360}deg 55% 60%)`
}

function renderBuckets() {
  el.board.classList.remove("stream")
  el.board.classList.remove("list")
  el.board.innerHTML = ""
  const allowDrag = state.ui.view === "buckets" && state.ui.sort === "newest" && !state.ui.filterTag && !state.ui.showPinnedOnly && !searchQuery.trim()
  const filtered = filteredIdeas()
  for (const triage of TRIAGE_ORDER) {
    const bucketIdeas = filtered.filter((i) => i.triage === triage)
    const col = document.createElement("section")
    col.className = "col"
    col.setAttribute("data-triage", triage)

    const head = document.createElement("div")
    head.className = "colhead"
    const title = document.createElement("div")
    title.className = "coltitle"
    const dot = document.createElement("span")
    dot.className = "dot"
    dot.style.background = triageColor(triage)
    title.appendChild(dot)
    const text = document.createElement("span")
    text.textContent = TRIAGE_LABEL[triage]
    title.appendChild(text)
    const count = document.createElement("div")
    count.className = "colcount"
    count.textContent = `${bucketIdeas.filter((t) => !t.done).length}`
    const actions = document.createElement("div")
    actions.className = "headactions"
    const add = document.createElement("button")
    add.type = "button"
    add.className = "headbtn"
    add.textContent = "+"
    add.setAttribute("data-col-add", triage)
    actions.appendChild(add)
    head.appendChild(title)
    head.appendChild(count)
    head.appendChild(actions)
    col.appendChild(head)

    const list = document.createElement("div")
    list.className = "collist"
    list.setAttribute("data-ticket-list", triage)

    const open = bucketIdeas.filter((t) => !t.done)
    const done = bucketIdeas.filter((t) => t.done)
    for (const t of open) list.appendChild(renderIdeaCard(t, allowDrag))
    col.appendChild(list)

    const doneWrap = document.createElement("div")
    doneWrap.className = "donewrap"
    const details = document.createElement("details")
    details.className = "donedetails"
    details.open = false
    const summary = document.createElement("summary")
    summary.textContent = `Done (${done.length})`
    details.appendChild(summary)
    const doneList = document.createElement("div")
    doneList.className = "done-list"
    for (const t of done) doneList.appendChild(renderIdeaCard(t, false))
    details.appendChild(doneList)
    doneWrap.appendChild(details)
    col.appendChild(doneWrap)

    el.board.appendChild(col)
  }
}

function renderStream() {
  el.board.classList.add("stream")
  el.board.innerHTML = ""
  const items = filteredIdeas()
  const groups = new Map()
  for (const idea of items) {
    const key = beirutDayKey(idea.createdAt)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(idea)
  }
  const sortedDays = Array.from(groups.keys()).sort((a, b) => (state.ui.sort === "oldest" ? a.localeCompare(b) : b.localeCompare(a)))
  for (const day of sortedDays) {
    const wrap = document.createElement("div")
    wrap.className = "daygroup"
    const head = document.createElement("div")
    head.className = "dayhead"
    const left = document.createElement("div")
    left.textContent = day
    const right = document.createElement("div")
    right.textContent = `${groups.get(day).filter((i) => !i.done).length} open`
    head.appendChild(left)
    head.appendChild(right)
    wrap.appendChild(head)
    const list = document.createElement("div")
    list.className = "streamitems"
    const open = groups.get(day).filter((i) => !i.done)
    const done = groups.get(day).filter((i) => i.done)
    for (const t of open) list.appendChild(renderIdeaCard(t, false))
    wrap.appendChild(list)
    const doneWrap = document.createElement("div")
    doneWrap.className = "donewrap"
    const details = document.createElement("details")
    details.className = "donedetails"
    const summary = document.createElement("summary")
    summary.textContent = `Done (${done.length})`
    details.appendChild(summary)
    const doneList = document.createElement("div")
    doneList.className = "done-list"
    for (const t of done) doneList.appendChild(renderIdeaCard(t, false))
    details.appendChild(doneList)
    doneWrap.appendChild(details)
    wrap.appendChild(doneWrap)
    el.board.appendChild(wrap)
  }
}

function renderBoard() {
  if (state.ui.view === "buckets") renderBuckets()
  else renderStream()
}

function render() {
  renderTopbarState()
  renderBoard()
}

function addIdeaFromCapture(pin) {
  const raw = el.captureTitle.value || ""
  const lines = raw.split(/\r?\n/)
  const title = (lines.shift() || "").trim()
  const noteFromLines = lines.join("\n").trim()
  const tag = el.captureTag.value.trim()
  const link = el.captureLink.value.trim()
  if (!title) return
  const idea = normalizeIdea({ title, note: noteFromLines, tag, link, pinned: !!pin, triage: captureTriageTarget || "later" })
  state.ideas.push(idea)
  persist()
  el.captureTitle.value = ""
  el.captureTag.value = ""
  el.captureLink.value = ""
  el.captureTitle.placeholder = DEFAULT_PLACEHOLDER
  captureTriageTarget = null
  render()
}

function deleteIdea(id) {
  const idx = state.ideas.findIndex((i) => i.id === id)
  if (idx < 0) return
  const removed = state.ideas.splice(idx, 1)[0]
  lastDeleted = { index: idx, idea: removed }
  persist()
  render()
  showToastAction("Removed", "Undo", () => {
    if (!lastDeleted) return
    const at = Math.max(0, Math.min(lastDeleted.index, state.ideas.length))
    state.ideas.splice(at, 0, lastDeleted.idea)
    persist()
    render()
    lastDeleted = null
  })
}

function clearAll() {
  const ok = confirm("Clear ALL ideas (open + done)? This cannot be undone.")
  if (!ok) return
  state = initState()
  archive = []
  searchQuery = ""
  el.search.value = ""
  persist()
  render()
  showToast("Cleared all")
}

function togglePin(id) {
  const idea = state.ideas.find((i) => i.id === id)
  if (!idea) return
  idea.pinned = !idea.pinned
  persist()
  render()
}

function cycleTriage(id) {
  const idea = state.ideas.find((i) => i.id === id)
  if (!idea) return
  const idx = TRIAGE_ORDER.indexOf(idea.triage)
  const next = TRIAGE_ORDER[(idx + 1) % TRIAGE_ORDER.length]
  idea.triage = next
  persist()
  render()
}

function setDone(id, val) {
  const idea = state.ideas.find((i) => i.id === id)
  if (!idea) return
  idea.done = !!val
  persist()
  render()
}

function moveIdea(id, triage, index) {
  const foundIdx = state.ideas.findIndex((i) => i.id === id)
  if (foundIdx < 0) return
  const idea = state.ideas.splice(foundIdx, 1)[0]
  idea.triage = triage
  const bucketIdeas = state.ideas.filter((i) => i.triage === triage)
  const ids = sortIdeas(bucketIdeas).map((i) => i.id)
  const targetIdx = Math.max(0, Math.min(index, ids.length))
  let insertIdx = state.ideas.length
  for (let i = 0, seen = 0; i < state.ideas.length; i++) {
    if (state.ideas[i].triage !== triage) continue
    if (seen === targetIdx) {
      insertIdx = i
      break
    }
    seen++
  }
  state.ideas.splice(insertIdx, 0, idea)
  persist()
  render()
}

function ticketDropIndex(triage, overId, after) {
  const bucketIdeas = filteredIdeas().filter((i) => i.triage === triage && !i.done)
  if (!overId) return bucketIdeas.length
  const idx = bucketIdeas.findIndex((i) => i.id === overId)
  if (idx < 0) return bucketIdeas.length
  return after ? idx + 1 : idx
}

function exportJSON() {
  const payload = {
    app: "Idea Inbox",
    schemaVersion: "v1",
    exportedAt: nowTs(),
    weekKey: localStorage.getItem(WEEK_KEY) || isoWeekKeyForBeirut(),
    state,
    archive,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = `ideas-export-${payload.weekKey}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(a.href)
}

function exportMarkdown() {
  const lines = []
  lines.push(`# Idea Inbox (${localStorage.getItem(WEEK_KEY) || isoWeekKeyForBeirut()})`)
  for (const triage of TRIAGE_ORDER) {
    const ideas = filteredIdeas().filter((i) => i.triage === triage)
    lines.push(`\n## ${TRIAGE_LABEL[triage]}`)
    const ordered = ideas.slice().sort((a, b) => (a.pinned === b.pinned ? 0 : a.pinned ? -1 : 1))
    for (const i of ordered) {
      const doneMark = i.done ? "[x]" : "[ ]"
      const tagPart = i.tag ? ` [${i.tag}]` : ""
      const notePart = i.note ? ` — ${i.note}` : ""
      const linkPart = i.link ? ` (${i.link})` : ""
      lines.push(`- ${doneMark} ${i.title}${tagPart}${notePart}${linkPart}${i.pinned ? " ★" : ""}`)
    }
    if (ordered.length === 0) lines.push("- [ ] (empty)")
  }
  const blob = new Blob([lines.join("\n")], { type: "text/markdown" })
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = `ideas-${localStorage.getItem(WEEK_KEY) || isoWeekKeyForBeirut()}.md`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(a.href)
}

async function importJSON(file) {
  const text = await file.text()
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    alert("Invalid JSON file.")
    return
  }
  const nextState = parsed.state && parsed.state.ideas ? parsed.state : parsed
  const nextArchive = Array.isArray(parsed.archive) ? parsed.archive : loadJSON(ARCHIVE_KEY, [])
  if (parsed.schemaVersion && parsed.schemaVersion !== "v1") {
    alert(`Importing schema ${parsed.schemaVersion}; expected v1. Data will be normalized.`)
  }
  if (!nextState || !Array.isArray(nextState.ideas)) {
    alert("JSON does not contain a valid Idea Inbox state.")
    return
  }
  const ok = confirm("Replace current Idea Inbox data with this JSON? This cannot be undone.")
  if (!ok) return
  state = normalizeState(nextState)
  archive = Array.isArray(nextArchive) ? nextArchive : []
  persist()
  saveJSON(ARCHIVE_KEY, archive)
  localStorage.setItem(WEEK_KEY, parsed.weekKey || isoWeekKeyForBeirut())
  showToast("Imported")
  render()
}

function copyIdea(id) {
  const idea = state.ideas.find((i) => i.id === id)
  if (!idea) return
  const parts = [idea.title]
  if (idea.note) parts.push(idea.note)
  if (idea.link) parts.push(idea.link)
  if (idea.tag) parts.push(`#${idea.tag}`)
  navigator.clipboard.writeText(parts.join("\n")).then(() => showToast("Copied"), () => showToast("Copy failed"))
}

function handleCaptureSubmit(e) {
  if (e) e.preventDefault()
  const pin = (e && (e.metaKey || e.ctrlKey)) || false
  addIdeaFromCapture(pin)
}

function toggleHelp(show) {
  el.shortcutHelp.hidden = !show
}

function bindEvents() {
  document.addEventListener("click", (e) => {
    if (!el.toolbox || !el.toolbox.open) return
    if (el.toolbox.contains(e.target)) return
    el.toolbox.open = false
  })

  el.captureAddBtn.addEventListener("click", () => addIdeaFromCapture(false))
  el.captureTitle.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleCaptureSubmit(e)
  })

  el.search.addEventListener("input", () => {
    searchQuery = el.search.value || ""
    render()
  })

  el.tagFilter.addEventListener("change", () => {
    state.ui.filterTag = el.tagFilter.value
    persist()
    render()
  })

  el.pinnedToggle.addEventListener("click", () => {
    state.ui.showPinnedOnly = !state.ui.showPinnedOnly
    persist()
    render()
  })

  el.sortSelect.addEventListener("change", () => {
    state.ui.sort = el.sortSelect.value
    persist()
    render()
  })

  el.viewStream.addEventListener("click", () => {
    state.ui.view = "stream"
    persist()
    render()
  })
  el.viewBuckets.addEventListener("click", () => {
    state.ui.view = "buckets"
    persist()
    render()
  })

  el.exportBtn.addEventListener("click", exportJSON)
  el.mdExportBtn.addEventListener("click", exportMarkdown)
  el.importBtn.addEventListener("click", () => el.importFile.click())
  el.importFile.addEventListener("change", async () => {
    const f = el.importFile.files && el.importFile.files[0]
    el.importFile.value = ""
    if (!f) return
    await importJSON(f)
  })

  el.clearBtn.addEventListener("click", clearAll)

  el.board.addEventListener("click", (e) => {
    const doneToggle = e.target && e.target.matches && e.target.matches("[data-done-toggle]")
    if (doneToggle) {
      const id = e.target.getAttribute("data-done-toggle")
      setDone(id, e.target.checked)
      return
    }
    const del = e.target && e.target.closest ? e.target.closest("[data-delete]") : null
    if (del) {
      const id = del.getAttribute("data-delete")
      deleteIdea(id)
      return
    }
    const pin = e.target && e.target.closest ? e.target.closest("[data-pin]") : null
    if (pin) {
      const id = pin.getAttribute("data-pin")
      togglePin(id)
      return
    }
    const triage = e.target && e.target.closest ? e.target.closest("[data-triage]") : null
    if (triage) {
      const id = triage.getAttribute("data-triage")
      cycleTriage(id)
      return
    }
    const copy = e.target && e.target.closest ? e.target.closest("[data-copy]") : null
    if (copy) {
      const id = copy.getAttribute("data-copy")
      copyIdea(id)
      return
    }
    const tagFilter = e.target && e.target.closest ? e.target.closest("[data-tag-filter]") : null
    if (tagFilter) {
      const tag = tagFilter.getAttribute("data-tag-filter")
      state.ui.filterTag = tag
      persist()
      render()
      return
    }
    const colAdd = e.target && e.target.closest ? e.target.closest("[data-col-add]") : null
    if (colAdd) {
      const triageKey = colAdd.getAttribute("data-col-add")
      state.ui.view = "buckets"
      persist()
      el.captureTitle.focus()
      el.captureTitle.value = ""
      captureTriageTarget = triageKey
      el.captureTitle.placeholder = `New idea for ${TRIAGE_LABEL[triageKey]}`
      return
    }
  })

  el.board.addEventListener("focusin", (e) => {
    const card = e.target && e.target.closest ? e.target.closest("[data-idea-id]") : null
    if (card) focusedCardId = card.getAttribute("data-idea-id")
  })

  el.board.addEventListener("dragstart", (e) => {
    if (state.ui.view !== "buckets") return
    const allow = state.ui.sort === "newest" && !state.ui.filterTag && !state.ui.showPinnedOnly && !searchQuery.trim()
    if (!allow) {
      e.preventDefault()
      showToast("Drag blocked by filters")
      return
    }
    const t = e.target
    clearDropClasses()
    if (t && t.matches && t.matches("[data-drag-idea]")) {
      const ideaId = t.getAttribute("data-drag-idea")
      const idea = state.ideas.find((i) => i.id === ideaId)
      if (!idea) return
      drag = { type: "idea", ideaId, fromTriage: idea.triage }
      e.dataTransfer.effectAllowed = "move"
      e.dataTransfer.setData("text/plain", JSON.stringify(drag))
      t.classList.add("dragging")
      return
    }
  })

  el.board.addEventListener("dragend", (e) => {
    const t = e.target
    if (t && t.classList) t.classList.remove("dragging")
    clearDropClasses()
    drag = { type: null }
  })

  el.board.addEventListener("dragover", (e) => {
    if (state.ui.view !== "buckets") return
    if (!drag || !drag.type) return
    e.preventDefault()
    const target = e.target
    clearDropClasses()
    if (drag.type === "idea") {
      const col = target.closest && target.closest(".col")
      if (!col) return
      col.classList.add("drag-over")
      const card = target.closest && target.closest(".ticket")
      if (!card) return
      const overId = card.getAttribute("data-idea-id")
      if (!overId || overId === drag.ideaId) return
      const rect = card.getBoundingClientRect()
      const after = (e.clientY - rect.top) > rect.height / 2
      card.classList.add(after ? "drop-after" : "drop-before")
    }
  })

  el.board.addEventListener("drop", (e) => {
    if (state.ui.view !== "buckets") return
    if (!drag || !drag.type) return
    e.preventDefault()
    const target = e.target
    if (drag.type === "idea") {
      const col = target.closest && target.closest(".col")
      if (!col) return
      const triage = col.getAttribute("data-triage")
      const card = target.closest && target.closest(".ticket")
      let overId = null
      let after = false
      if (card) {
        overId = card.getAttribute("data-idea-id")
        const rect = card.getBoundingClientRect()
        after = (e.clientY - rect.top) > rect.height / 2
      }
      const idx = ticketDropIndex(triage, overId, after)
      moveIdea(drag.ideaId, triage, idx)
      clearDropClasses()
      drag = { type: null }
    }
  })

  el.shortcutClose.addEventListener("click", () => toggleHelp(false))
  el.shortcutHelp.addEventListener("click", (e) => {
    if (e.target === el.shortcutHelp) toggleHelp(false)
  })

  document.addEventListener("keydown", (e) => {
    const tag = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : ""
    const isTyping = tag === "input" || tag === "textarea" || tag === "select"
    if (e.key === "?" && !isTyping) {
      e.preventDefault()
      toggleHelp(el.shortcutHelp.hidden)
      return
    }
    if (e.key === "Escape") {
      if (!el.shortcutHelp.hidden) {
        toggleHelp(false)
        return
      }
      if (el.captureTitle === document.activeElement && el.captureTitle.value) {
        el.captureTitle.value = ""
        return
      }
    }
    if (e.key === "n" && !isTyping) {
      e.preventDefault()
      el.captureTitle.focus()
      return
    }
    if (e.key === "/" && !isTyping) {
      e.preventDefault()
      el.search.focus()
      return
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      if (document.activeElement === el.captureTitle || document.activeElement === el.captureTag || document.activeElement === el.captureLink) {
        e.preventDefault()
        addIdeaFromCapture(true)
      }
      return
    }
    if (e.key === "Enter") {
      if (document.activeElement === el.captureTitle || document.activeElement === el.captureTag || document.activeElement === el.captureLink) {
        e.preventDefault()
        addIdeaFromCapture(false)
      }
      return
    }
    if (e.key === "p" && !isTyping && focusedCardId) {
      e.preventDefault()
      togglePin(focusedCardId)
      return
    }
    if (e.key === "t" && !isTyping && focusedCardId) {
      e.preventDefault()
      cycleTriage(focusedCardId)
      return
    }
  })
}

function clearDropClasses() {
  el.board.querySelectorAll(".drop-before,.drop-after,.drag-over").forEach((n) => {
    n.classList.remove("drop-before", "drop-after", "drag-over")
  })
}

function bootstrap() {
  cleanupForNewWeek()
  const stored = loadJSON(STORAGE_KEY, null)
  state = normalizeState(stored || initState())
  archive = loadJSON(ARCHIVE_KEY, [])
  persist()
  saveJSON(ARCHIVE_KEY, archive)
  el.captureTitle.placeholder = DEFAULT_PLACEHOLDER
  bindEvents()
  render()
}

bootstrap()
