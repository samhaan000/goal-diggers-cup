const teams = [
  "Meem Police",
  "FC Maavadibe",
  "FC Karaa",
  "Muli Blues",
  "Blackout 5",
  "Triple T",
  "Smashers FC"
];

const matches = [
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
  { id: 21, day: "Day 2 — Thursday, 28 May 2026", round: "Round 7", time: "00:10 – 00:25", home: "Blackout 5", away: "Triple T" }
];

const storageKey = "goal-diggers-cup-2026-scores";
const adminMode = new URLSearchParams(window.location.search).get("admin") === "1";
let activeFilter = "all";

const standingsBody = document.getElementById("standingsBody");
const standingsCards = document.getElementById("standingsCards");
const scheduleList = document.getElementById("scheduleList");
const adminPanel = document.getElementById("adminPanel");

function getScores() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || {};
  } catch {
    return {};
  }
}

function saveScores(scores) {
  localStorage.setItem(storageKey, JSON.stringify(scores));
}

function numberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function getResult(match) {
  const result = getScores()[match.id];
  if (!result) return null;
  const home = numberOrNull(result.home);
  const away = numberOrNull(result.away);
  if (home === null || away === null) return null;
  return { home, away };
}

function calculateStandings() {
  const scores = getScores();
  const table = Object.fromEntries(teams.map(team => [team, {
    team, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0
  }]));

  matches.forEach(match => {
    const result = scores[match.id];
    if (!result) return;
    const homeGoals = numberOrNull(result.home);
    const awayGoals = numberOrNull(result.away);
    if (homeGoals === null || awayGoals === null) return;

    const home = table[match.home];
    const away = table[match.away];

    home.played += 1;
    away.played += 1;
    home.gf += homeGoals;
    home.ga += awayGoals;
    away.gf += awayGoals;
    away.ga += homeGoals;

    if (homeGoals > awayGoals) {
      home.won += 1; home.points += 3;
      away.lost += 1;
    } else if (homeGoals < awayGoals) {
      away.won += 1; away.points += 3;
      home.lost += 1;
    } else {
      home.drawn += 1; away.drawn += 1;
      home.points += 1; away.points += 1;
    }
  });

  return Object.values(table).map(row => ({ ...row, gd: row.gf - row.ga }))
    .sort((a, b) =>
      b.points - a.points ||
      b.gd - a.gd ||
      b.gf - a.gf ||
      a.team.localeCompare(b.team)
    );
}

function renderStandings() {
  const standings = calculateStandings();
  standingsBody.innerHTML = standings.map((row, index) => `
    <tr class="${index < 2 ? "top-two" : ""}">
      <td class="rank">${index + 1}</td>
      <td class="team">${row.team}</td>
      <td>${row.played}</td>
      <td>${row.won}</td>
      <td>${row.drawn}</td>
      <td>${row.lost}</td>
      <td>${row.gf}</td>
      <td>${row.ga}</td>
      <td>${row.gd > 0 ? "+" : ""}${row.gd}</td>
      <td><strong>${row.points}</strong></td>
    </tr>
  `).join("");

  standingsCards.innerHTML = standings.map((row, index) => `
    <article class="standing-card ${index < 2 ? "top" : ""}">
      <div class="rank-badge">${index + 1}</div>
      <div>
        <div class="card-team">${row.team}</div>
        <div class="card-record">${row.played}P • ${row.won}W ${row.drawn}D ${row.lost}L • GD ${row.gd > 0 ? "+" : ""}${row.gd}</div>
      </div>
      <div class="card-points">${row.points}<span>pts</span></div>
    </article>
  `).join("");

  updateSummary(standings);
}

function updateSummary(standings) {
  const completed = matches.filter(match => getResult(match)).length;
  const next = matches.find(match => !getResult(match));
  const leader = standings[0];

  document.getElementById("playedCount").textContent = `${completed} / ${matches.length}`;
  document.getElementById("leaderName").textContent = completed ? leader.team : "—";
  document.getElementById("leaderMeta").textContent = completed ? `${leader.points} pts • GD ${leader.gd > 0 ? "+" : ""}${leader.gd}` : "Scores pending";
  document.getElementById("nextMatchTitle").textContent = next ? `${next.home} vs ${next.away}` : "League complete";
  document.getElementById("nextMatchMeta").textContent = next ? `${next.time} • ${next.round}` : "Top 2 move to final";
}

function renderSchedule() {
  const scores = getScores();
  let currentDay = "";
  let currentRound = "";
  let html = "";

  matches.forEach(match => {
    const result = scores[match.id] || {};
    const homeScore = numberOrNull(result.home);
    const awayScore = numberOrNull(result.away);
    const completed = homeScore !== null && awayScore !== null;
    const shouldHide = activeFilter === "completed" && !completed || activeFilter === "upcoming" && completed;

    if (match.day !== currentDay) {
      currentDay = match.day;
      currentRound = "";
      html += `<div class="day-title">${match.day}</div>`;
    }
    if (match.round !== currentRound) {
      currentRound = match.round;
      html += `<div class="round-title">${match.round}</div>`;
    }

    const scoreMarkup = adminMode ? `
      <div class="admin-fields">
        <input class="score-input" type="number" min="0" inputmode="numeric" aria-label="${match.home} score" data-match="${match.id}" data-side="home" value="${result.home ?? ""}">
        <span class="score-dash">-</span>
        <input class="score-input" type="number" min="0" inputmode="numeric" aria-label="${match.away} score" data-match="${match.id}" data-side="away" value="${result.away ?? ""}">
      </div>
    ` : `<div class="score-display">${completed ? `${homeScore} - ${awayScore}` : "vs"}</div>`;

    html += `
      <article class="match-card ${shouldHide ? "hidden" : ""}" data-id="${match.id}" data-status="${completed ? "completed" : "upcoming"}">
        <div class="match-meta">#${match.id}<br>${match.time}</div>
        <div class="team-name">${match.home}</div>
        ${scoreMarkup}
        <div class="team-name team-away">${match.away}</div>
        <div class="status-pill ${completed ? "completed" : ""}">${completed ? "FT" : "Upcoming"}</div>
      </article>
    `;
  });

  scheduleList.innerHTML = html;

  document.querySelectorAll(".score-input").forEach(input => {
    input.addEventListener("input", event => {
      const scores = getScores();
      const matchId = event.target.dataset.match;
      const side = event.target.dataset.side;
      scores[matchId] = scores[matchId] || {};
      scores[matchId][side] = event.target.value;

      if ((scores[matchId].home ?? "") === "" && (scores[matchId].away ?? "") === "") {
        delete scores[matchId];
      }

      saveScores(scores);
      renderSchedule();
      renderStandings();
    });
  });
}

function setupTabs() {
  document.querySelectorAll(".tab-btn").forEach(button => {
    button.addEventListener("click", () => openTab(button.dataset.tab));
  });
}

function openTab(tabName) {
  document.querySelectorAll(".tab-btn").forEach(button => {
    const active = button.dataset.tab === tabName;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", active ? "true" : "false");
  });

  document.querySelectorAll(".tab-panel").forEach(panel => {
    panel.classList.toggle("active", panel.id === `panel-${tabName}`);
  });
}

function setupFilters() {
  document.querySelectorAll(".filter-btn").forEach(button => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter;
      document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.toggle("active", btn === button));
      renderSchedule();
    });
  });
}

const resetBtn = document.getElementById("resetBtn");
if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    if (!confirm("Reset all saved scores on this device?")) return;
    localStorage.removeItem(storageKey);
    renderSchedule();
    renderStandings();
  });
}

document.getElementById("shareBtn").addEventListener("click", async () => {
  if (navigator.share) {
    await navigator.share({ title: "Goal Diggers Cup 2026", url: location.href });
  } else {
    await navigator.clipboard.writeText(location.href);
    alert("Page link copied.");
  }
});

if (adminMode && adminPanel) adminPanel.hidden = false;

setupTabs();
setupFilters();
renderSchedule();
renderStandings();
