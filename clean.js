const teams = ["Meem Police", "FC Maavadibe", "FC Karaa", "Muli Blues", "Blackout 5", "Triple T", "Smashers FC"];
const teamLogos = {
  "Meem Police": "assets/meemu_police_club_transparent.webp",
  "FC Maavadibe": "assets/fc_maavadibe_transparent.webp",
  "FC Karaa": "assets/karaa_transparent.webp",
  "Muli Blues": "assets/muli_blues_fc_transparent.webp",
  "Blackout 5": "assets/blackoutfive_transparent.webp",
  "Triple T": "assets/triple_t_transparent.webp",
  "Smashers FC": "assets/smashers_fc_transparent.webp"
};
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
  { id: 21, day: "Day 2 — Thursday, 28 May 2026", round: "Round 7", time: "00:10 – 00:25", home: "Blackout 5", away: "Triple T" },
  { id: 22, day: "Grand Final — Friday, 29 May 2026", round: "Grand Final", time: "After league stage", home: "1st Place", away: "2nd Place", isFinal: true }
];

const leagueMatches = matches.filter((m) => !m.isFinal);
const scoreKey = "goal-diggers-cup-2026-scores";
const stateKey = "goal-diggers-cup-2026-admin-state";
const settingsKey = "goal-diggers-cup-2026-settings";
let activeFilter = "all";
let lastTableMarkup = "";
let lastHomeLogo = "";
let lastAwayLogo = "";
const openDays = {};

function readJson(k, f = {}) {
  try {
    return JSON.parse(localStorage.getItem(k)) || f;
  } catch {
    return f;
  }
}
function scores() { return readJson(scoreKey, {}); }
function state() { return readJson(stateKey, {}); }
function settings() { return readJson(settingsKey, {}); }
function num(v) {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
function scoreNum(v) {
  const n = num(v);
  return n === null ? 0 : n;
}
function matchScore(m) {
  const r = scores()[m.id] || {};
  return { home: scoreNum(r.home), away: scoreNum(r.away) };
}
function initials(n) {
  return n.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase().replace("5", "5");
}
function teamMark(team) {
  const logo = teamLogos[team];
  return logo
    ? `<img class="team-logo" src="${logo}" alt="${team} logo" decoding="async" onerror="this.style.display='none';this.nextElementSibling.style.display='grid';"><div class="team-badge fallback-badge" style="display:none">${initials(team)}</div>`
    : `<div class="team-badge">${initials(team)}</div>`;
}
function startTime(time) {
  if (!time) return "";
  if (!/[–-]/.test(time)) return time.trim();
  return time.split(/[–-]/)[0].trim();
}

function phase(id) { return (state()[id] || {}).phase || "upcoming"; }
function phaseStarted(id) { return (state()[id] || {}).phaseStartedAt || null; }
function isFullTime(m) { return phase(m.id) === "fulltime"; }
function isLivePhase(p) { return ["first_half", "halftime", "second_half"].includes(p); }
function isCountableForLiveTable(m) {
  const p = phase(m.id);
  return !m.isFinal && (p === "fulltime" || isLivePhase(p));
}
function phaseText(p) {
  return { first_half: "1st Half", halftime: "Half Time", second_half: "2nd Half", fulltime: "FT", upcoming: "Upcoming" }[p] || "Upcoming";
}
function clock(ms) {
  const t = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}
function phaseTimer(id) {
  const p = phase(id);
  const started = phaseStarted(id);
  if (p === "fulltime") return "FT";
  if (p === "halftime") return "Half Time";
  if (!started || !isLivePhase(p)) return phaseText(p);
  return `${phaseText(p)} • ${clock(Date.now() - new Date(started).getTime())}`;
}
function dayKey(day) {
  return day.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function shortDay(day) {
  return day.replace("Wednesday, ", "Wed ").replace("Thursday, ", "Thu ").replace("Friday, ", "Fri ");
}
function liveMatch() {
  const st = state();
  const id = st.currentMatchId;
  const m = matches.find((x) => String(x.id) === String(id));
  return m && isLivePhase(phase(m.id)) ? m : null;
}
function nextUnplayed() {
  return matches.find((m) => phase(m.id) === "upcoming") || matches.find((m) => !isFullTime(m));
}

function table() {
  const t = Object.fromEntries(teams.map((team) => [team, { team, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 }]));
  leagueMatches.forEach((m) => {
    if (!isCountableForLiveTable(m)) return;
    const sc = matchScore(m);
    const h = sc.home;
    const a = sc.away;
    const H = t[m.home];
    const A = t[m.away];
    H.played++;
    A.played++;
    H.gf += h;
    H.ga += a;
    A.gf += a;
    A.ga += h;
    if (h > a) {
      H.won++;
      H.points += 3;
      A.lost++;
    } else if (h < a) {
      A.won++;
      A.points += 3;
      H.lost++;
    } else {
      H.drawn++;
      A.drawn++;
      H.points++;
      A.points++;
    }
  });
  return Object.values(t).map((r) => ({ ...r, gd: r.gf - r.ga })).sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf || a.team.localeCompare(b.team));
}

function renderLiveBoard(match) {
  const board = document.getElementById("liveMatchBoard");
  const empty = document.getElementById("noLiveMatchState");
  const meta = document.getElementById("currentMatchMeta");
  const score = document.getElementById("currentMatchScore");
  if (!board || !empty) return;
  if (!match) {
    board.hidden = true;
    empty.hidden = false;
    return;
  }
  const sc = matchScore(match);
  const homeLogo = teamLogos[match.home] || "";
  const awayLogo = teamLogos[match.away] || "";
  empty.hidden = true;
  board.hidden = false;
  document.getElementById("liveHomeName").textContent = match.home;
  document.getElementById("liveAwayName").textContent = match.away;
  const homeImg = document.getElementById("liveHomeLogo");
  const awayImg = document.getElementById("liveAwayLogo");
  if (lastHomeLogo !== homeLogo) {
    homeImg.src = homeLogo;
    lastHomeLogo = homeLogo;
  }
  if (lastAwayLogo !== awayLogo) {
    awayImg.src = awayLogo;
    lastAwayLogo = awayLogo;
  }
  homeImg.alt = `${match.home} logo`;
  awayImg.alt = `${match.away} logo`;
  score.textContent = `${sc.home} - ${sc.away}`;
  meta.textContent = phaseTimer(match.id);
}

function updateMatchCards() {
  const done = leagueMatches.filter(isFullTime).length;
  const current = liveMatch();
  const next = nextUnplayed();
  const set = settings();
  document.getElementById("playedCount").textContent = `${done} / ${leagueMatches.length}`;
  renderLiveBoard(current);
  if (!current) document.getElementById("currentMatchTitle").textContent = "No live match";
  document.getElementById("nextMatchTitle").textContent = next ? `${next.home} vs ${next.away}` : "Tournament complete";
  document.getElementById("nextMatchMeta").textContent = next ? `${startTime(next.time)} • ${next.round}` : "Thanks for following";
  const link = document.querySelector(".watch-live-btn");
  if (link && set.youtubeLink) link.href = set.youtubeLink;
}

function renderTable() {
  const el = document.getElementById("standingsList");
  if (el) {
    const html = table().map((r, i) => `<div class="league-row ${i < 2 ? "top-two" : ""}"><span>${i + 1}</span><div class="team-cell">${teamMark(r.team)}<strong>${r.team}</strong></div><span>${r.played}</span><span>${r.won}</span><span>${r.gd > 0 ? "+" : ""}${r.gd}</span><b>${r.points}</b></div>`).join("");
    if (html !== lastTableMarkup) {
      el.innerHTML = html;
      lastTableMarkup = html;
    }
  }
  updateMatchCards();
}

function fixtureTeam(team, side) {
  return `<div class="fixture-team fixture-${side}">${side === "home" ? `${teamMark(team)}<span>${team}</span>` : `<span>${team}</span>${teamMark(team)}`}</div>`;
}

function matchRow(m) {
  const p = phase(m.id);
  const sc = matchScore(m);
  const hasScore = isCountableForLiveTable(m);
  const center = `<div class="score-display">${hasScore ? `${sc.home} - ${sc.away}` : "vs"}</div>`;
  const status = p === "fulltime" ? "FT" : isLivePhase(p) ? phaseTimer(m.id) : m.isFinal ? "Final" : `${startTime(m.time)} • ${m.round}`;
  return `<article class="match-card ${m.isFinal ? "final-match-card" : ""}" data-match-id="${m.id}">
    <div class="match-meta">${m.isFinal ? "Final" : `#${m.id}`}</div>
    ${fixtureTeam(m.home, "home")}
    ${center}
    ${fixtureTeam(m.away, "away")}
    <div class="status-pill ${p === "fulltime" ? "completed" : isLivePhase(p) ? "live" : m.isFinal ? "final-status" : ""}">${status}</div>
  </article>`;
}

function renderMatches() {
  const visible = matches.filter((m) => {
    const p = phase(m.id);
    if (activeFilter === "completed") return p === "fulltime";
    if (activeFilter === "upcoming") return p !== "fulltime";
    return true;
  });
  const groups = [];
  visible.forEach((m) => {
    let g = groups.find((x) => x.day === m.day);
    if (!g) {
      g = { day: m.day, matches: [] };
      groups.push(g);
    }
    g.matches.push(m);
  });
  let html = "";
  groups.forEach((g, i) => {
    const key = dayKey(g.day);
    if (openDays[key] === undefined) openDays[key] = i === 0;
    let body = "";
    let round = "";
    g.matches.forEach((m) => {
      if (m.round !== round) {
        round = m.round;
        body += `<div class="round-title ${m.isFinal ? "final-round-title" : ""}">${m.round}</div>`;
      }
      body += matchRow(m);
    });
    html += `<section class="fixture-day ${openDays[key] ? "open" : "closed"}"><button class="day-toggle" type="button" data-day="${key}" aria-expanded="${openDays[key]}"><span>${shortDay(g.day)}</span><small>${g.matches.length} ${g.matches.length === 1 ? "match" : "matches"}</small><b>${openDays[key] ? "−" : "+"}</b></button><div class="day-fixtures" ${openDays[key] ? "" : "hidden"}>${body}</div></section>`;
  });
  document.getElementById("scheduleList").innerHTML = html || `<div class="empty-state">No matches found.</div>`;
  document.querySelectorAll(".day-toggle").forEach((btn) => btn.addEventListener("click", () => {
    openDays[btn.dataset.day] = !openDays[btn.dataset.day];
    renderMatches();
  }));
}

function refreshAll() {
  renderMatches();
  renderTable();
}
function openTab(name) {
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
  document.querySelectorAll(".tab-panel").forEach((p) => p.classList.toggle("active", p.id === `panel-${name}`));
}

document.querySelectorAll(".tab-btn").forEach((b) => b.addEventListener("click", () => openTab(b.dataset.tab)));
document.querySelectorAll(".filter-btn").forEach((b) => b.addEventListener("click", () => {
  activeFilter = b.dataset.filter;
  document.querySelectorAll(".filter-btn").forEach((x) => x.classList.toggle("active", x === b));
  renderMatches();
}));
document.getElementById("shareBtn")?.addEventListener("click", async () => {
  if (navigator.share) await navigator.share({ title: "Goal Diggers Cup 2026", url: location.href });
  else {
    await navigator.clipboard.writeText(location.href);
    alert("Page link copied");
  }
});

function loadScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = res;
    s.onerror = rej;
    document.head.appendChild(s);
  });
}
async function startFirebase() {
  try {
    await loadScript("https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js");
    await loadScript("https://www.gstatic.com/firebasejs/10.12.5/firebase-database-compat.js");
    await loadScript("firebase-config.js?v=firebase-config-1");
    const db = window.goalDiggersDb;
    if (!db) return;
    db.ref("scores").on("value", (snap) => {
      localStorage.setItem(scoreKey, JSON.stringify(snap.val() || {}));
      refreshAll();
    });
    db.ref("state").on("value", (snap) => {
      localStorage.setItem(stateKey, JSON.stringify(snap.val() || {}));
      refreshAll();
    });
    db.ref("settings").on("value", (snap) => {
      localStorage.setItem(settingsKey, JSON.stringify(snap.val() || {}));
      refreshAll();
    });
  } catch (e) {
    console.warn("Firebase sync unavailable", e);
  }
}

refreshAll();
setInterval(() => {
  updateMatchCards();
  if (liveMatch()) renderTable();
}, 1000);
startFirebase();
