const goalEventsKey = "goal-diggers-cup-2026-goals";

function readGoalEvents() {
  try {
    return JSON.parse(localStorage.getItem(goalEventsKey)) || {};
  } catch {
    return {};
  }
}

function goalListForMatch(matchId) {
  const data = readGoalEvents();
  return Object.values(data[String(matchId)] || {}).sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
}

function playerDisplay(g) {
  return `#${g.playerNumber} ${g.playerName}${g.ownGoal ? " (OG)" : ""}`;
}

function minuteDisplay(g) {
  return g.matchTime || "";
}

function goalLine(g) {
  return `<span>${playerDisplay(g)}</span><b>${minuteDisplay(g)}</b>`;
}

function matchById(matchId) {
  if (!Array.isArray(window.matches) && typeof matches === "undefined") return null;
  const list = Array.isArray(window.matches) ? window.matches : matches;
  return list.find((m) => String(m.id) === String(matchId)) || null;
}

function awardedSideForGoal(match, goal) {
  if (!match || !goal) return goal?.side || "home";
  if (goal.goalForTeam === match.home) return "home";
  if (goal.goalForTeam === match.away) return "away";
  return goal.side || "home";
}

function splitGoalsByAwardedTeam(match, goals) {
  return {
    home: goals.filter((g) => awardedSideForGoal(match, g) === "home"),
    away: goals.filter((g) => awardedSideForGoal(match, g) === "away")
  };
}

function renderGoalsUnderLive(match) {
  let wrap = document.getElementById("liveGoalScorers");
  const board = document.getElementById("liveMatchBoard");
  if (!board) return;
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.id = "liveGoalScorers";
    wrap.className = "goal-scorers live-goal-scorers";
    board.appendChild(wrap);
  }
  if (!match) {
    wrap.innerHTML = "";
    return;
  }
  const goals = goalListForMatch(match.id);
  const split = splitGoalsByAwardedTeam(match, goals);
  wrap.innerHTML = goals.length ? `<div class="goal-side goal-side-home">${split.home.map(goalLine).join("")}</div><div class="goal-side goal-side-away">${split.away.map(goalLine).join("")}</div>` : "";
}

function fixtureGoalLine(g) {
  const time = minuteDisplay(g);
  return `<span>${playerDisplay(g)}${time ? ` <b>${time}</b>` : ""}</span>`;
}

function renderGoalTimelines() {
  document.querySelectorAll(".match-card[data-match-id]").forEach((card) => {
    const id = card.dataset.matchId;
    const match = matchById(id);
    let box = card.querySelector(".match-goals");
    if (!box) {
      box = document.createElement("div");
      box.className = "match-goals";
      card.appendChild(box);
    }
    const goals = goalListForMatch(id);
    const split = splitGoalsByAwardedTeam(match, goals);
    box.innerHTML = goals.length ? `<div class="match-goal-side home">${split.home.map(fixtureGoalLine).join("")}</div><div class="match-goal-side away">${split.away.map(fixtureGoalLine).join("")}</div>` : "";
  });
}

function renderStatsTab() {
  const panel = document.getElementById("panel-stats");
  if (!panel) return;
  const all = Object.values(readGoalEvents()).flatMap((x) => Object.values(x || {}));
  const scorerMap = {};
  all.forEach((g) => {
    if (g.ownGoal) return;
    const key = g.playerId || `${g.playerTeam}_${g.playerNumber}_${g.playerName}`;
    scorerMap[key] = scorerMap[key] || { ...g, goals: 0 };
    scorerMap[key].goals++;
  });
  const scorers = Object.values(scorerMap).sort((a, b) => b.goals - a.goals || a.playerName.localeCompare(b.playerName));
  panel.innerHTML = `<div class="section-head"><div><span class="section-kicker">Stats</span><h2>Top Scorers</h2></div></div><div class="stats-list">${scorers.length ? scorers.map((p, i) => `<div class="stats-row"><span>${i + 1}</span><strong>#${p.playerNumber} ${p.playerName}</strong><small>${p.playerTeam}</small><b>${p.goals}</b></div>`).join("") : `<div class="empty-state">No goals recorded yet.</div>`}</div>`;
}

function refreshGoalDisplays() {
  try {
    renderGoalsUnderLive(typeof liveMatch === "function" ? liveMatch() : null);
    renderGoalTimelines();
    renderStatsTab();
  } catch (e) {
    console.warn("Goal display refresh failed", e);
  }
}

const oldRenderMatchesForGoals = renderMatches;
renderMatches = function () {
  oldRenderMatchesForGoals();
  refreshGoalDisplays();
};
const oldRenderTableForGoals = renderTable;
renderTable = function () {
  oldRenderTableForGoals();
  refreshGoalDisplays();
};

function loadGoalEventsFromFirebase() {
  if (!window.goalDiggersDb) return;
  window.goalDiggersDb.ref("goals").on("value", (snap) => {
    localStorage.setItem(goalEventsKey, JSON.stringify(snap.val() || {}));
    refreshGoalDisplays();
  });
}

setTimeout(loadGoalEventsFromFirebase, 1800);
setInterval(refreshGoalDisplays, 2000);
refreshGoalDisplays();