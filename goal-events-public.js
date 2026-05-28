const goalEventsKey = "goal-diggers-cup-2026-goals";
const cardEventsKey = "goal-diggers-cup-2026-cards";
let goalEventFirebaseListenersAttached = false;

function readGoalEvents() {
  try {
    return JSON.parse(localStorage.getItem(goalEventsKey)) || {};
  } catch {
    return {};
  }
}

function readCardEvents() {
  try {
    return JSON.parse(localStorage.getItem(cardEventsKey)) || {};
  } catch {
    return {};
  }
}

function goalListForMatch(matchId) {
  const data = readGoalEvents();
  return Object.values(data[String(matchId)] || {}).sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
}

function cardListForMatch(matchId) {
  const data = readCardEvents();
  return Object.values(data[String(matchId)] || {}).sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
}

function combinedEventsForMatch(matchId) {
  const goals = goalListForMatch(matchId).map((g) => ({ ...g, eventType: "goal" }));
  const cards = cardListForMatch(matchId).map((c) => ({ ...c, eventType: "card" }));
  return [...goals, ...cards].sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
}

function publicPlayerDisplay(g) {
  return `${g.playerName}${g.ownGoal ? " (OG)" : ""}`;
}

function minuteDisplay(g) {
  return g.matchTime || "";
}

function goalLine(g) {
  return `<span><i class="event-icon ball-icon">⚽</i>${publicPlayerDisplay(g)}</span><b>${minuteDisplay(g)}</b>`;
}

function cardIcon(card) {
  return card.cardType === "red" ? "🟥" : "🟨";
}

function cardLine(card) {
  return `<span><i class="event-icon ${card.cardType === "red" ? "red-card-icon" : "yellow-card-icon"}">${cardIcon(card)}</i>${card.playerName}</span><b>${minuteDisplay(card)}</b>`;
}

function eventLine(event) {
  return event.eventType === "card" ? cardLine(event) : goalLine(event);
}

function fixtureEventLine(event) {
  const time = minuteDisplay(event);
  if (event.eventType === "card") {
    return `<span><i class="event-icon ${event.cardType === "red" ? "red-card-icon" : "yellow-card-icon"}">${cardIcon(event)}</i>${event.playerName}${time ? ` <b>${time}</b>` : ""}</span>`;
  }
  return `<span><i class="event-icon ball-icon">⚽</i>${publicPlayerDisplay(event)}${time ? ` <b>${time}</b>` : ""}</span>`;
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

function eventSideForMatch(match, event) {
  if (event.eventType === "goal") return awardedSideForGoal(match, event);
  if (match && event.playerTeam === match.away) return "away";
  return "home";
}

function splitEventsByTeam(match, events) {
  return {
    home: events.filter((event) => eventSideForMatch(match, event) === "home"),
    away: events.filter((event) => eventSideForMatch(match, event) === "away")
  };
}

function splitGoalsByAwardedTeam(match, goals) {
  return {
    home: goals.filter((g) => awardedSideForGoal(match, g) === "home"),
    away: goals.filter((g) => awardedSideForGoal(match, g) === "away")
  };
}

function setHtmlIfChanged(el, html) {
  if (!el) return;
  if (el.dataset.lastMarkup === html) return;
  el.innerHTML = html;
  el.dataset.lastMarkup = html;
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
    setHtmlIfChanged(wrap, "");
    return;
  }
  const events = combinedEventsForMatch(match.id);
  const split = splitEventsByTeam(match, events);
  const html = events.length ? `<div class="goal-side goal-side-home">${split.home.map(eventLine).join("")}</div><div class="goal-side goal-side-away">${split.away.map(eventLine).join("")}</div>` : "";
  setHtmlIfChanged(wrap, html);
}

function fixtureGoalLine(g) {
  const time = minuteDisplay(g);
  return `<span><i class="event-icon ball-icon">⚽</i>${publicPlayerDisplay(g)}${time ? ` <b>${time}</b>` : ""}</span>`;
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
    const events = combinedEventsForMatch(id);
    const split = splitEventsByTeam(match, events);
    const html = events.length ? `<div class="match-goal-side home">${split.home.map(fixtureEventLine).join("")}</div><div class="match-goal-side away">${split.away.map(fixtureEventLine).join("")}</div>` : "";
    setHtmlIfChanged(box, html);
  });
}

function finalLeagueMatchesForStats() {
  if (typeof leagueMatches === "undefined") return [];
  return leagueMatches.filter((m) => {
    if (typeof isFullTime === "function") return isFullTime(m);
    if (typeof phase === "function") return phase(m.id) === "fulltime";
    return false;
  });
}

function cleanSheetStats() {
  if (typeof teams === "undefined" || typeof matchScore !== "function") return [];
  const map = Object.fromEntries(teams.map((team) => [team, { team, cleanSheets: 0, played: 0 }]));

  finalLeagueMatchesForStats().forEach((m) => {
    const sc = matchScore(m);
    if (!map[m.home] || !map[m.away]) return;
    map[m.home].played++;
    map[m.away].played++;
    if (sc.away === 0) map[m.home].cleanSheets++;
    if (sc.home === 0) map[m.away].cleanSheets++;
  });

  return Object.values(map)
    .filter((row) => row.cleanSheets > 0)
    .sort((a, b) => b.cleanSheets - a.cleanSheets || a.team.localeCompare(b.team));
}

function statPlayerKey(event) {
  return event.playerId || `${event.playerTeam || "Unknown"}_${event.playerNumber || ""}_${event.playerName || "Unknown Player"}`;
}

function renderStatsTab() {
  const panel = document.getElementById("panel-stats");
  if (!panel) return;
  const allGoals = Object.values(readGoalEvents()).flatMap((x) => Object.values(x || {}));
  const allCards = Object.values(readCardEvents()).flatMap((x) => Object.values(x || {}));
  const scorerMap = {};
  const cardMap = {};

  allGoals.forEach((g) => {
    if (g.ownGoal) return;
    const key = statPlayerKey(g);
    scorerMap[key] = scorerMap[key] || { ...g, playerName: g.playerName || "Unknown Player", playerTeam: g.playerTeam || "Unknown Team", goals: 0 };
    scorerMap[key].goals++;
  });

  allCards.forEach((c) => {
    const key = statPlayerKey(c);
    cardMap[key] = cardMap[key] || { ...c, playerName: c.playerName || "Unknown Player", playerTeam: c.playerTeam || "Unknown Team", yellow: 0, red: 0 };
    if (c.cardType === "red") cardMap[key].red++;
    else cardMap[key].yellow++;
  });

  const scorers = Object.values(scorerMap).sort((a, b) => b.goals - a.goals || a.playerName.localeCompare(b.playerName));
  const carded = Object.values(cardMap).sort((a, b) => (b.red - a.red) || (b.yellow - a.yellow) || a.playerName.localeCompare(b.playerName));
  const cleanSheets = cleanSheetStats();

  const html = `
    <div class="section-head"><div><span class="section-kicker">Stats</span><h2>Top Scorers</h2></div></div>
    <div class="stats-list">${scorers.length ? scorers.map((p, i) => `<div class="stats-row"><span>${i + 1}</span><strong><i class="event-icon ball-icon">⚽</i>${p.playerName}</strong><small>${p.playerTeam}</small><b>${p.goals}</b></div>`).join("") : `<div class="empty-state">No goals recorded yet.</div>`}</div>
    <div class="section-head card-stats-head"><div><span class="section-kicker">Defence</span><h2>Clean Sheets</h2></div></div>
    <div class="stats-list clean-sheet-list">${cleanSheets.length ? cleanSheets.map((t, i) => `<div class="stats-row clean-sheet-row"><span>${i + 1}</span><strong><i class="event-icon clean-sheet-icon">🧤</i>${t.team}</strong><small>${t.played} matches played</small><b>${t.cleanSheets}</b></div>`).join("") : `<div class="empty-state">No clean sheets recorded yet.</div>`}</div>
    <div class="section-head card-stats-head"><div><span class="section-kicker">Discipline</span><h2>Cards</h2></div></div>
    <div class="stats-list card-stats-list">${carded.length ? carded.map((p, i) => `<div class="stats-row card-stats-row"><span>${i + 1}</span><strong>${p.playerName}</strong><small>${p.playerTeam}</small><b><i class="event-icon yellow-card-icon">🟨</i>${p.yellow || 0} <i class="event-icon red-card-icon">🟥</i>${p.red || 0}</b></div>`).join("") : `<div class="empty-state">No cards recorded yet.</div>`}</div>
  `;
  setHtmlIfChanged(panel, html);
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

function loadGoalEventsFromFirebase(retry = 0) {
  if (goalEventFirebaseListenersAttached) return;
  if (!window.goalDiggersDb) {
    if (retry < 30) setTimeout(() => loadGoalEventsFromFirebase(retry + 1), 500);
    return;
  }
  goalEventFirebaseListenersAttached = true;
  window.goalDiggersDb.ref("goals").on("value", (snap) => {
    localStorage.setItem(goalEventsKey, JSON.stringify(snap.val() || {}));
    refreshGoalDisplays();
  });
  window.goalDiggersDb.ref("cards").on("value", (snap) => {
    localStorage.setItem(cardEventsKey, JSON.stringify(snap.val() || {}));
    refreshGoalDisplays();
  });
}

setTimeout(() => loadGoalEventsFromFirebase(), 500);
refreshGoalDisplays();
