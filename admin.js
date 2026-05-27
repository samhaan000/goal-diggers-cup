const adminMatches = [
  { id: 1, day: "Day 1 — Wednesday, 27 May 2026", round: "Round 1", time: "20:45 – 21:00", home: "FC Maavadibe", away: "Smashers FC" },
  { id: 2, day: "Day 1 — Wednesday, 27 May 2026", round: "Round 1", time: "21:05 – 21:20", home: "FC Karaa", away: "Triple T" },
  { id: 3, day: "Day 1 — Wednesday, 27 May 2026", round: "Round 1", time: "21:25 – 21:40", home: "Muli Blues", away: "Blackout 5" },
  { id: 4, day: "Day 1 — Wednesday, 27 May 2026", round: "Round 2", time: "21:50 – 22:05", home: "Meem Police", away: "Smashers FC" },
  { id: 5, day: "Day 1 — Wednesday, 27 May 2026", round: "Round 2", time: "22:10 – 22:25", home: "FC Maavadibe", away: "Blackout 5" },
  { id: 6, day: "Day 1 — Wednesday, 27 May 2026", round: "Round 2", time: "22:30 – 22:45", home: "FC Karaa", away: "Muli Blues" },
  { id: 7, day: "Day 1 — Wednesday, 27 May 2026", round: "Round 3", time: "22:55 – 23:10", home: "Meem Police", away: "Triple T" },
  { id: 8, day: "Day 1 — Wednesday, 27 May 2026", round: "Round 3", time: "23:15 – 23:30", home: "Smashers FC", away: "Blackout 5" },
  { id: 9, day: "Day 1 — Wednesday, 27 May 2026", round: "Round 3", time: "23:35 – 23:50", home: "FC Maavadibe", away: "FC Karaa" },
  { id: 10, day: "Day 2 — Thursday, 28 May 2026", round: "Round 4", time: "20:15 – 20:30", home: "Meem Police", away: "Blackout 5" },
  { id: 11, day: "Day 2 — Thursday, 28 May 2026", round: "Round 4", time: "20:35 – 20:50", home: "Triple T", away: "Muli Blues" },
  { id: 12, day: "Day 2 — Thursday, 28 May 2026", round: "Round 4", time: "20:55 – 21:10", home: "Smashers FC", away: "FC Karaa" },
  { id: 13, day: "Day 2 — Thursday, 28 May 2026", round: "Round 5", time: "21:20 – 21:35", home: "Meem Police", away: "Muli Blues" },
  { id: 14, day: "Day 2 — Thursday, 28 May 2026", round: "Round 5", time: "21:40 – 21:55", home: "Blackout 5", away: "FC Karaa" },
  { id: 15, day: "Day 2 — Thursday, 28 May 2026", round: "Round 5", time: "22:00 – 22:15", home: "Triple T", away: "FC Maavadibe" },
  { id: 16, day: "Day 2 — Thursday, 28 May 2026", round: "Round 6", time: "22:25 – 22:40", home: "Meem Police", away: "FC Karaa" },
  { id: 17, day: "Day 2 — Thursday, 28 May 2026", round: "Round 6", time: "22:45 – 23:00", home: "Muli Blues", away: "FC Maavadibe" },
  { id: 18, day: "Day 2 — Thursday, 28 May 2026", round: "Round 6", time: "23:05 – 23:20", home: "Triple T", away: "Smashers FC" },
  { id: 19, day: "Day 2 — Thursday, 28 May 2026", round: "Round 7", time: "23:30 – 23:45", home: "Meem Police", away: "FC Maavadibe" },
  { id: 20, day: "Day 2 — Thursday, 28 May 2026", round: "Round 7", time: "23:50 – 00:05", home: "Muli Blues", away: "Smashers FC" },
  { id: 21, day: "Day 2 — Thursday, 28 May 2026", round: "Round 7", time: "00:10 – 00:25", home: "Blackout 5", away: "Triple T" },
  { id: 22, day: "Grand Final — Friday, 29 May 2026", round: "Grand Final", time: "After league stage", home: "1st Place", away: "2nd Place", isFinal: true }
];

const scoreKey = "goal-diggers-cup-2026-scores";
const stateKey = "goal-diggers-cup-2026-admin-state";
const settingsKey = "goal-diggers-cup-2026-settings";
const goalEventsKey = "goal-diggers-cup-2026-goals";

let selectedId = 1;
let activeAdminFilter = "all";
let firebaseReady = false;

function readJson(key, fallback = {}) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
}

function firebasePath(key) {
  if (key === scoreKey) return "scores";
  if (key === stateKey) return "state";
  if (key === settingsKey) return "settings";
  if (key === goalEventsKey) return "goals";
  return null;
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value || {}));
  const path = firebasePath(key);
  if (firebaseReady && path && window.goalDiggersDb) window.goalDiggersDb.ref(path).set(value || {});
}

function scores() { return readJson(scoreKey, {}); }
function state() { return readJson(stateKey, {}); }
function settings() { return readJson(settingsKey, { youtubeLink: "https://youtube.com/@youthenhancement?si=sXVp1Qaj-kMiVCAF" }); }
function goalEvents() { return readJson(goalEventsKey, {}); }
function matchPhase(matchId) { return (state()[matchId] || {}).phase || "upcoming"; }
function filteredMatches() {
  return adminMatches.filter((m) => {
    const p = matchPhase(m.id);
    if (activeAdminFilter === "upcoming") return p === "upcoming";
    if (activeAdminFilter === "progress") return ["first_half", "halftime", "second_half"].includes(p);
    if (activeAdminFilter === "completed") return p === "fulltime";
    return true;
  });
}
function currentMatch() { return adminMatches.find((m) => String(m.id) === String(selectedId)) || filteredMatches()[0] || adminMatches[0]; }
function confirmAction(title, message, confirmText = "Confirm") { return confirm(`${title}\n\n${message}\n\nTap OK to ${confirmText}. Tap Cancel to go back.`); }

function saveScoreSide(side, delta) {
  const s = scores();
  s[selectedId] = s[selectedId] || { home: "", away: "" };
  const old = Number(s[selectedId][side] || 0);
  s[selectedId][side] = String(Math.max(0, old + delta));
  writeJson(scoreKey, s);
  render();
}
function saveScore() {
  const s = scores();
  s[selectedId] = s[selectedId] || { home: "0", away: "0" };
  writeJson(scoreKey, s);
  render();
  alert("Score synced. You can still correct it later, even after Full Time.");
}
function setPhase(phase) {
  const st = state();
  st.currentMatchId = selectedId;
  st[selectedId] = st[selectedId] || {};
  st[selectedId].phase = phase;
  st[selectedId].phaseStartedAt = new Date().toISOString();
  writeJson(stateKey, st);
  render();
}
function resetPhase() {
  if (!confirmAction("Reset selected match status?", "This will reset only the selected match back to Upcoming. Scores will not be changed.", "reset status")) return;
  const st = state();
  delete st[selectedId];
  if (String(st.currentMatchId) === String(selectedId)) delete st.currentMatchId;
  writeJson(stateKey, st);
  render();
  alert("Selected match status reset");
}
function saveSettings() {
  const input = document.getElementById("youtubeLink");
  writeJson(settingsKey, { youtubeLink: input.value.trim() });
  alert("Live link saved");
}
function clearYoutubeLink() {
  if (!confirmAction("Clear YouTube link?", "This clears the link field only. Tap Save Live Link afterward if you want to save it blank.", "clear link")) return;
  document.getElementById("youtubeLink").value = "";
}
async function pasteYoutubeLink() {
  const input = document.getElementById("youtubeLink");
  try {
    const text = await navigator.clipboard.readText();
    if (!text.trim()) return alert("Clipboard is empty");
    input.value = text.trim();
    input.focus();
  } catch { alert("Paste permission was blocked. Tap the field and paste manually."); }
}
function clearScoresAndStatus() {
  if (!confirmAction("Clear selected match data?", "This will remove the selected match score, status, and goal scorers. Other matches will not be changed.", "clear selected match data")) return;
  const s = scores(), st = state(), g = goalEvents();
  delete s[selectedId]; delete st[selectedId]; delete g[String(selectedId)];
  if (String(st.currentMatchId) === String(selectedId)) delete st.currentMatchId;
  writeJson(scoreKey, s); writeJson(stateKey, st); writeJson(goalEventsKey, g);
  render();
  alert("Selected match score, status, and scorers cleared");
}
function clearAllMatchData() {
  if (!confirmAction("Clear all tournament data?", "This will remove all scores, all match statuses, current match state, saved settings, and all goal scorer data. This action cannot be undone.", "continue")) return;
  if (prompt("Type CLEAR to confirm clearing all tournament data.") !== "CLEAR") return alert("Clear all cancelled");
  localStorage.removeItem(scoreKey); localStorage.removeItem(stateKey); localStorage.removeItem(settingsKey); localStorage.removeItem(goalEventsKey);
  if (firebaseReady && window.goalDiggersDb) {
    window.goalDiggersDb.ref("scores").set({}); window.goalDiggersDb.ref("state").set({}); window.goalDiggersDb.ref("settings").set({}); window.goalDiggersDb.ref("goals").set({});
  }
  selectedId = 1; activeAdminFilter = "all"; render(); alert("All match data cleared");
}
function phaseText(p) {
  return { first_half: "1st Half", halftime: "Half Time", second_half: "2nd Half", fulltime: "Full Time", upcoming: "Upcoming" }[p] || "Upcoming";
}
function startTimeLabel(time) {
  return String(time || "").includes("–") ? String(time).split("–")[0].trim() : time;
}
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
function renderMatchSelect() {
  const select = document.getElementById("matchSelect");
  const list = filteredMatches();
  if (!list.some((m) => String(m.id) === String(selectedId))) selectedId = list[0]?.id || adminMatches[0].id;
  select.innerHTML = list.length
    ? list.map((m) => `<option value="${m.id}">${m.id === 22 ? "Final" : `#${m.id}`} — ${m.home} vs ${m.away}</option>`).join("")
    : `<option>No matches in this filter</option>`;
  select.disabled = !list.length;
  select.value = String(selectedId);
  document.querySelectorAll(".admin-tab").forEach((btn) => btn.classList.toggle("active", btn.dataset.adminFilter === activeAdminFilter));
}
function render() {
  renderMatchSelect();
  const m = currentMatch();
  const s = scores()[selectedId] || { home: "0", away: "0" };
  const st = state()[selectedId] || {};
  const phase = phaseText(st.phase || "upcoming");
  const matchNo = m.id === 22 ? "Final" : `#${m.id}`;
  setText("homeTeam", m.home);
  setText("awayTeam", m.away);
  setText("homeScore", s.home === "" ? "0" : s.home || "0");
  setText("awayScore", s.away === "" ? "0" : s.away || "0");
  setText("currentMatchNumber", matchNo);
  setText("currentMatchStatus", phase);
  setText("currentMatchTitleAdmin", `${m.home} vs ${m.away}`);
  setText("matchInfo", `${startTimeLabel(m.time)} • ${m.round}`);
  setText("phaseLabel", phase);
  setText("scorePhaseBadge", phase);
  document.querySelectorAll(".phase-buttons button").forEach((btn) => btn.classList.toggle("active", btn.dataset.phase === st.phase));
  document.getElementById("youtubeLink").value = settings().youtubeLink || "";
  if (typeof window.renderGoalLog === "function") window.renderGoalLog();
}
function goMatch(step) {
  const list = filteredMatches();
  const currentIndex = list.findIndex((m) => String(m.id) === String(selectedId));
  const index = currentIndex < 0 ? 0 : Math.min(list.length - 1, Math.max(0, currentIndex + step));
  if (list[index]) selectedId = list[index].id;
  render();
}
function handleScoreButtonClick(btn) {
  const side = btn.dataset.score;
  const delta = Number(btn.dataset.delta);
  if (delta > 0 && typeof window.openGoalPicker === "function") return window.openGoalPicker(side);
  if (delta < 0 && typeof window.removeLastGoal === "function") return window.removeLastGoal(side);
  saveScoreSide(side, delta);
}
function loadScript(src) {
  return new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
}
async function startFirebase() {
  try {
    await loadScript("https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js");
    await loadScript("https://www.gstatic.com/firebasejs/10.12.5/firebase-database-compat.js");
    await loadScript("firebase-config.js?v=firebase-config-1");
    firebaseReady = !!window.goalDiggersDb;
    if (!firebaseReady) return;
    window.goalDiggersDb.ref("scores").on("value", (snap) => { localStorage.setItem(scoreKey, JSON.stringify(snap.val() || {})); render(); });
    window.goalDiggersDb.ref("state").on("value", (snap) => { localStorage.setItem(stateKey, JSON.stringify(snap.val() || {})); render(); });
    window.goalDiggersDb.ref("settings").on("value", (snap) => { localStorage.setItem(settingsKey, JSON.stringify(snap.val() || {})); render(); });
    window.goalDiggersDb.ref("goals").on("value", (snap) => { localStorage.setItem(goalEventsKey, JSON.stringify(snap.val() || {})); if (typeof window.renderGoalLog === "function") window.renderGoalLog(); });
  } catch (e) { console.warn("Firebase admin sync unavailable", e); }
}
function init() {
  const select = document.getElementById("matchSelect");
  select.addEventListener("change", () => { selectedId = select.value; render(); });
  document.querySelectorAll(".admin-tab").forEach((btn) => btn.addEventListener("click", () => { activeAdminFilter = btn.dataset.adminFilter; render(); }));
  document.getElementById("prevMatchBtn")?.addEventListener("click", () => goMatch(-1));
  document.getElementById("nextMatchBtn")?.addEventListener("click", () => goMatch(1));
  document.querySelectorAll("[data-score]").forEach((btn) => btn.addEventListener("click", () => handleScoreButtonClick(btn)));
  document.getElementById("saveScoreBtn").addEventListener("click", saveScore);
  document.querySelectorAll(".phase-buttons button").forEach((btn) => btn.addEventListener("click", () => setPhase(btn.dataset.phase)));
  document.getElementById("resetPhaseBtn").addEventListener("click", resetPhase);
  document.getElementById("saveSettingsBtn").addEventListener("click", saveSettings);
  document.getElementById("pasteLinkBtn").addEventListener("click", pasteYoutubeLink);
  document.getElementById("clearLinkBtn").addEventListener("click", clearYoutubeLink);
  document.getElementById("resetScoresBtn").addEventListener("click", clearScoresAndStatus);
  document.getElementById("clearAllDataBtn").addEventListener("click", clearAllMatchData);
  render();
  startFirebase();
}
window.saveScoreSide = saveScoreSide;
window.render = render;
window.goalEvents = goalEvents;
init();