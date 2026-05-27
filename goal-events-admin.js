var adminGoalEventsKey = "goal-diggers-cup-2026-goals";

function readGoalEvents() {
  try {
    return JSON.parse(localStorage.getItem(adminGoalEventsKey)) || {};
  } catch {
    return {};
  }
}

function writeGoalEvents(value) {
  localStorage.setItem(adminGoalEventsKey, JSON.stringify(value || {}));
  if (firebaseReady && window.goalDiggersDb) {
    window.goalDiggersDb.ref("goals").set(value || {});
  }
}

function selectedMatchObj() {
  return adminMatches.find((m) => String(m.id) === String(selectedId)) || adminMatches[0];
}

function mmssFromPhaseStart() {
  const st = state()[selectedId] || {};
  if (!st.phaseStartedAt) return "";
  const ms = Math.max(0, Date.now() - new Date(st.phaseStartedAt).getTime());
  const sec = Math.floor(ms / 1000);
  return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
}

function closeGoalPicker() {
  document.getElementById("goalPickerOverlay")?.remove();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function playerButton(player, goalForTeam, isOwnGoal) {
  return `<button class="player-pick-btn" data-player-id="${escapeHtml(player.id)}" data-player-name="${escapeHtml(player.name)}" data-player-number="${escapeHtml(player.number)}" data-player-team="${escapeHtml(player.team)}" data-goal-team="${escapeHtml(goalForTeam)}" data-own-goal="${isOwnGoal ? "1" : "0"}" type="button"><b>#${escapeHtml(player.number)}</b><span>${escapeHtml(player.name)}</span>${isOwnGoal ? "<em>OG</em>" : ""}</button>`;
}

function openGoalPicker(side) {
  const m = selectedMatchObj();
  const goalTeam = side === "home" ? m.home : m.away;
  const otherTeam = side === "home" ? m.away : m.home;
  const players = window.goalDiggersPlayers || {};
  const normal = players[goalTeam] || [];
  const own = players[otherTeam] || [];

  closeGoalPicker();

  const overlay = document.createElement("div");
  overlay.id = "goalPickerOverlay";
  overlay.className = "goal-picker-overlay";
  overlay.innerHTML = `
    <div class="goal-picker">
      <div class="goal-picker-head">
        <div><span>Goal for</span><strong>${escapeHtml(goalTeam)}</strong></div>
        <button type="button" id="closeGoalPicker">×</button>
      </div>
      <div class="goal-picker-section">
        <h3>${escapeHtml(goalTeam)}</h3>
        ${normal.length ? normal.map((p) => playerButton(p, goalTeam, false)).join("") : `<p class="empty-picker-note">No players found for ${escapeHtml(goalTeam)}.</p>`}
      </div>
      <div class="goal-picker-section og-section">
        <h3>Own Goal by ${escapeHtml(otherTeam)}</h3>
        ${own.length ? own.map((p) => playerButton(p, goalTeam, true)).join("") : `<p class="empty-picker-note">No players found for ${escapeHtml(otherTeam)}.</p>`}
      </div>
    </div>`;

  document.body.appendChild(overlay);
  document.getElementById("closeGoalPicker").addEventListener("click", closeGoalPicker);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeGoalPicker();
  });
  overlay.querySelectorAll(".player-pick-btn").forEach((btn) => {
    btn.addEventListener("click", () => addGoalFromPlayer(btn, side));
  });
}

function addGoalFromPlayer(btn, side) {
  const all = readGoalEvents();
  const id = String(selectedId);
  all[id] = all[id] || {};

  const goalId = `goal_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  all[id][goalId] = {
    id: goalId,
    matchId: selectedId,
    goalForTeam: btn.dataset.goalTeam,
    side,
    playerId: btn.dataset.playerId,
    playerName: btn.dataset.playerName,
    playerNumber: Number(btn.dataset.playerNumber),
    playerTeam: btn.dataset.playerTeam,
    ownGoal: btn.dataset.ownGoal === "1",
    phase: matchPhase(selectedId),
    matchTime: mmssFromPhaseStart(),
    createdAt: new Date().toISOString()
  };

  writeGoalEvents(all);

  const s = scores();
  s[selectedId] = s[selectedId] || { home: "0", away: "0" };
  s[selectedId][side] = String(Number(s[selectedId][side] || 0) + 1);
  writeJson(scoreKey, s);

  closeGoalPicker();
  render();
  renderGoalLog();
}

function removeLastGoal(side) {
  const all = readGoalEvents();
  const id = String(selectedId);
  const list = Object.values(all[id] || {})
    .filter((g) => g.side === side)
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

  if (list.length) {
    delete all[id][list[0].id];
    writeGoalEvents(all);
  }

  const s = scores();
  s[selectedId] = s[selectedId] || { home: "0", away: "0" };
  s[selectedId][side] = String(Math.max(0, Number(s[selectedId][side] || 0) - 1));
  writeJson(scoreKey, s);
  render();
  renderGoalLog();
}

function allPlayersForMatch() {
  const m = selectedMatchObj();
  const players = window.goalDiggersPlayers || {};
  return [...(players[m.home] || []), ...(players[m.away] || [])];
}

function openGoalEditor(goalId) {
  const all = readGoalEvents();
  const matchGoals = all[String(selectedId)] || {};
  const g = matchGoals[goalId];
  if (!g) return;

  const players = allPlayersForMatch();
  closeGoalPicker();

  const overlay = document.createElement("div");
  overlay.id = "goalPickerOverlay";
  overlay.className = "goal-picker-overlay";
  overlay.innerHTML = `
    <div class="goal-picker goal-edit">
      <div class="goal-picker-head">
        <div><span>Edit goal</span><strong>${escapeHtml(g.goalForTeam)}</strong></div>
        <button type="button" id="closeGoalPicker">×</button>
      </div>
      <label class="edit-label">Scorer</label>
      <select id="editGoalPlayer" class="edit-input">
        ${players.map((p) => `<option value="${escapeHtml(p.id)}" ${p.id === g.playerId ? "selected" : ""}>#${escapeHtml(p.number)} ${escapeHtml(p.name)} — ${escapeHtml(p.team)}</option>`).join("")}
      </select>
      <label class="edit-check"><input id="editOwnGoal" type="checkbox" ${g.ownGoal ? "checked" : ""}> Own goal (OG)</label>
      <label class="edit-label">Time shown</label>
      <input id="editGoalTime" class="edit-input" value="${escapeHtml(g.matchTime || "")}" placeholder="00:23">
      <div class="edit-actions">
        <button id="saveGoalEdit" class="primary-btn" type="button">Save Edit</button>
        <button id="deleteGoalEdit" class="danger-btn" type="button">Delete Goal</button>
      </div>
    </div>`;

  document.body.appendChild(overlay);
  document.getElementById("closeGoalPicker").addEventListener("click", closeGoalPicker);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeGoalPicker();
  });
  document.getElementById("saveGoalEdit").addEventListener("click", () => saveGoalEdit(goalId));
  document.getElementById("deleteGoalEdit").addEventListener("click", () => deleteGoal(goalId));
}

function saveGoalEdit(goalId) {
  const all = readGoalEvents();
  const g = all[String(selectedId)]?.[goalId];
  if (!g) return;

  const playerId = document.getElementById("editGoalPlayer").value;
  const p = allPlayersForMatch().find((x) => x.id === playerId);
  if (p) {
    g.playerId = p.id;
    g.playerName = p.name;
    g.playerNumber = Number(p.number);
    g.playerTeam = p.team;
  }
  g.ownGoal = document.getElementById("editOwnGoal").checked;
  g.matchTime = document.getElementById("editGoalTime").value.trim();

  writeGoalEvents(all);
  closeGoalPicker();
  renderGoalLog();
}

function deleteGoal(goalId) {
  if (!confirm("Delete this goal and reduce the score by 1?")) return;

  const all = readGoalEvents();
  const g = all[String(selectedId)]?.[goalId];
  if (!g) return;

  delete all[String(selectedId)][goalId];
  writeGoalEvents(all);

  const s = scores();
  s[selectedId] = s[selectedId] || { home: "0", away: "0" };
  s[selectedId][g.side] = String(Math.max(0, Number(s[selectedId][g.side] || 0) - 1));
  writeJson(scoreKey, s);

  closeGoalPicker();
  render();
  renderGoalLog();
}

function renderGoalLog() {
  let box = document.getElementById("adminGoalLog");
  const scoreCard = document.querySelector(".score-card");
  if (!box && scoreCard) {
    box = document.createElement("div");
    box.id = "adminGoalLog";
    box.className = "admin-goal-log";
    scoreCard.appendChild(box);
  }
  if (!box) return;

  const goals = Object.values(readGoalEvents()[String(selectedId)] || {})
    .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));

  box.innerHTML = `
    <h3>Goal Scorers</h3>
    ${goals.length
      ? goals.map((g) => `<div class="admin-goal-row"><span>#${escapeHtml(g.playerNumber)} ${escapeHtml(g.playerName)}${g.ownGoal ? " (OG)" : ""}</span><small>${escapeHtml(g.goalForTeam)} · ${escapeHtml(g.matchTime || "")}</small><button data-edit-goal="${escapeHtml(g.id)}" type="button">Edit</button></div>`).join("")
      : `<p>No scorers added yet. Tap + beside a team score to select scorer.</p>`}
  `;

  box.querySelectorAll("[data-edit-goal]").forEach((btn) => {
    btn.addEventListener("click", () => openGoalEditor(btn.dataset.editGoal));
  });
}

function listenGoalEvents() {
  if (!window.goalDiggersDb) return;
  window.goalDiggersDb.ref("goals").on("value", (snap) => {
    localStorage.setItem(adminGoalEventsKey, JSON.stringify(snap.val() || {}));
    renderGoalLog();
  });
}

window.openGoalPicker = openGoalPicker;
window.removeLastGoal = removeLastGoal;
window.renderGoalLog = renderGoalLog;
window.openGoalEditor = openGoalEditor;
window.closeGoalPicker = closeGoalPicker;

renderGoalLog();
setTimeout(listenGoalEvents, 900);
