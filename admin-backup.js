const backupLocalKeys = {
  scores: "goal-diggers-cup-2026-scores",
  state: "goal-diggers-cup-2026-admin-state",
  settings: "goal-diggers-cup-2026-settings",
  goals: "goal-diggers-cup-2026-goals",
  cards: "goal-diggers-cup-2026-cards"
};

const backupFirebasePaths = Object.keys(backupLocalKeys);
let backupTimer = null;
let backupStarted = false;
let lastBackupSignature = "";
let lastBackupAt = 0;

function readBackupLocal(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch {
    return {};
  }
}

function backupStamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function backupFileName() {
  return `goal-diggers-backup-${backupStamp()}.json`;
}

function escapeExport(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function collectBackupData() {
  const data = {
    createdAt: new Date().toISOString(),
    source: "Goal Diggers Cup Admin",
    version: "backup-v1",
    scores: {},
    state: {},
    settings: {},
    goals: {},
    cards: {}
  };

  if (window.goalDiggersDb) {
    await Promise.all(
      backupFirebasePaths.map(async (path) => {
        try {
          const snap = await window.goalDiggersDb.ref(path).once("value");
          data[path] = snap.val() || {};
        } catch {
          data[path] = readBackupLocal(backupLocalKeys[path]);
        }
      })
    );
  } else {
    backupFirebasePaths.forEach((path) => {
      data[path] = readBackupLocal(backupLocalKeys[path]);
    });
  }

  return data;
}

function downloadBackupObject(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = backupFileName();
  a.click();
  URL.revokeObjectURL(url);
}

async function saveBackupToFirebase(reason = "manual") {
  if (!window.goalDiggersDb) throw new Error("Firebase is not ready yet.");
  const data = await collectBackupData();
  data.reason = reason;
  data.backupId = backupStamp();

  await window.goalDiggersDb.ref("backups/latest").set(data);
  await window.goalDiggersDb.ref(`backups/history/${data.backupId}`).set(data);
  localStorage.setItem("goal-diggers-cup-2026-last-backup", JSON.stringify({ at: data.createdAt, reason }));
  updateBackupStatus(`Last backup: ${new Date(data.createdAt).toLocaleString()}`);
  return data;
}

function updateBackupStatus(text) {
  const el = document.getElementById("backupStatusText");
  if (el) el.textContent = text;
}

function scoreValue(data, matchId, side) {
  return Number(data?.scores?.[matchId]?.[side] || 0);
}

function phaseValue(data, matchId) {
  return data?.state?.[matchId]?.phase || "upcoming";
}

function finalLeagueMatches(data) {
  if (typeof leagueMatches === "undefined") return [];
  return leagueMatches.filter((m) => phaseValue(data, m.id) === "fulltime");
}

function makeLeagueTableRows(data) {
  if (typeof teams === "undefined" || typeof leagueMatches === "undefined") return [];
  const tableMap = Object.fromEntries(teams.map((team) => [team, { team, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 }]));

  finalLeagueMatches(data).forEach((m) => {
    const homeScore = scoreValue(data, m.id, "home");
    const awayScore = scoreValue(data, m.id, "away");
    const home = tableMap[m.home];
    const away = tableMap[m.away];
    if (!home || !away) return;

    home.played++;
    away.played++;
    home.gf += homeScore;
    home.ga += awayScore;
    away.gf += awayScore;
    away.ga += homeScore;

    if (homeScore > awayScore) {
      home.won++;
      home.points += 3;
      away.lost++;
    } else if (homeScore < awayScore) {
      away.won++;
      away.points += 3;
      home.lost++;
    } else {
      home.drawn++;
      away.drawn++;
      home.points++;
      away.points++;
    }
  });

  return Object.values(tableMap)
    .map((row) => ({ ...row, gd: row.gf - row.ga }))
    .sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf || a.team.localeCompare(b.team));
}

function makeMatchRows(data) {
  if (typeof matches === "undefined") return [];
  return matches.map((m) => ({
    id: m.id,
    day: m.day,
    round: m.round,
    time: m.time,
    home: m.home,
    away: m.away,
    homeScore: scoreValue(data, m.id, "home"),
    awayScore: scoreValue(data, m.id, "away"),
    phase: phaseValue(data, m.id),
    isFinal: m.isFinal ? "Yes" : "No"
  }));
}

function makeGoalRows(data) {
  const rows = [];
  Object.entries(data.goals || {}).forEach(([matchId, matchGoals]) => {
    Object.values(matchGoals || {}).forEach((g) => {
      const m = typeof matches !== "undefined" ? matches.find((x) => String(x.id) === String(matchId)) : null;
      rows.push({
        matchId,
        match: m ? `${m.home} vs ${m.away}` : "",
        time: g.matchTime || "",
        goalForTeam: g.goalForTeam || "",
        playerNumber: g.playerNumber || "",
        playerName: g.playerName || "",
        playerTeam: g.playerTeam || "",
        ownGoal: g.ownGoal ? "Yes" : "No",
        phase: g.phase || "",
        createdAt: g.createdAt || ""
      });
    });
  });
  return rows.sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
}

function makeCardRows(data) {
  const rows = [];
  Object.entries(data.cards || {}).forEach(([matchId, matchCards]) => {
    Object.values(matchCards || {}).forEach((c) => {
      const m = typeof matches !== "undefined" ? matches.find((x) => String(x.id) === String(matchId)) : null;
      rows.push({
        matchId,
        match: m ? `${m.home} vs ${m.away}` : "",
        time: c.matchTime || "",
        cardType: c.cardType || "",
        playerNumber: c.playerNumber || "",
        playerName: c.playerName || "",
        playerTeam: c.playerTeam || "",
        phase: c.phase || "",
        createdAt: c.createdAt || ""
      });
    });
  });
  return rows.sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
}

function makeTopScorerRows(data) {
  const map = {};
  makeGoalRows(data).forEach((g) => {
    if (g.ownGoal === "Yes") return;
    const key = `${g.playerTeam}_${g.playerNumber}_${g.playerName}`;
    map[key] = map[key] || { playerNumber: g.playerNumber, playerName: g.playerName, playerTeam: g.playerTeam, goals: 0 };
    map[key].goals++;
  });
  return Object.values(map).sort((a, b) => b.goals - a.goals || String(a.playerName).localeCompare(String(b.playerName)));
}

function makeCardSummaryRows(data) {
  const map = {};
  makeCardRows(data).forEach((c) => {
    const key = `${c.playerTeam}_${c.playerNumber}_${c.playerName}`;
    map[key] = map[key] || { playerNumber: c.playerNumber, playerName: c.playerName, playerTeam: c.playerTeam, yellow: 0, red: 0 };
    if (c.cardType === "red") map[key].red++;
    else map[key].yellow++;
  });
  return Object.values(map).sort((a, b) => b.red - a.red || b.yellow - a.yellow || String(a.playerName).localeCompare(String(b.playerName)));
}

function makeCleanSheetRows(data) {
  if (typeof teams === "undefined") return [];
  const map = Object.fromEntries(teams.map((team) => [team, { team, cleanSheets: 0, played: 0 }]));
  finalLeagueMatches(data).forEach((m) => {
    const homeScore = scoreValue(data, m.id, "home");
    const awayScore = scoreValue(data, m.id, "away");
    if (!map[m.home] || !map[m.away]) return;
    map[m.home].played++;
    map[m.away].played++;
    if (awayScore === 0) map[m.home].cleanSheets++;
    if (homeScore === 0) map[m.away].cleanSheets++;
  });
  return Object.values(map).filter((r) => r.cleanSheets > 0).sort((a, b) => b.cleanSheets - a.cleanSheets || a.team.localeCompare(b.team));
}

function htmlTable(title, rows, headers) {
  return `<h2>${escapeExport(title)}</h2><table><thead><tr>${headers.map((h) => `<th>${escapeExport(h.label)}</th>`).join("")}</tr></thead><tbody>${rows.length ? rows.map((row) => `<tr>${headers.map((h) => `<td>${escapeExport(row[h.key])}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${headers.length}">No data</td></tr>`}</tbody></table>`;
}

function exportReportHtml(data) {
  const leagueRows = makeLeagueTableRows(data).map((r, i) => ({ pos: i + 1, ...r }));
  const matchRows = makeMatchRows(data);
  const goalRows = makeGoalRows(data);
  const cardRows = makeCardRows(data);
  const topRows = makeTopScorerRows(data).map((r, i) => ({ pos: i + 1, ...r }));
  const cleanRows = makeCleanSheetRows(data).map((r, i) => ({ pos: i + 1, ...r }));
  const cardSummaryRows = makeCardSummaryRows(data).map((r, i) => ({ pos: i + 1, ...r }));

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Goal Diggers Cup Export</title><style>body{font-family:Arial,sans-serif;color:#111827;padding:24px}h1{margin:0 0 4px;color:#1f1330}p{margin:0 0 18px;color:#64748b}h2{margin:22px 0 8px;color:#8a6415;font-size:18px}table{width:100%;border-collapse:collapse;margin-bottom:18px;font-size:12px}th{background:#1f1330;color:#fff;text-align:left}th,td{border:1px solid #d7c58f;padding:7px 8px;vertical-align:top}tr:nth-child(even){background:#fff8e6}@media print{body{padding:10mm}h2{break-after:avoid}table{break-inside:auto}tr{break-inside:avoid}}</style></head><body><h1>Goal Diggers Cup 2026 — Data Export</h1><p>Generated: ${escapeExport(new Date(data.createdAt || Date.now()).toLocaleString())}</p>${htmlTable("League Table", leagueRows, [{ key: "pos", label: "Pos" }, { key: "team", label: "Team" }, { key: "played", label: "PL" }, { key: "won", label: "W" }, { key: "drawn", label: "D" }, { key: "lost", label: "L" }, { key: "gf", label: "GF" }, { key: "ga", label: "GA" }, { key: "gd", label: "GD" }, { key: "points", label: "PTS" }])}${htmlTable("Matches", matchRows, [{ key: "id", label: "ID" }, { key: "day", label: "Day" }, { key: "round", label: "Round" }, { key: "time", label: "Time" }, { key: "home", label: "Home" }, { key: "homeScore", label: "HS" }, { key: "awayScore", label: "AS" }, { key: "away", label: "Away" }, { key: "phase", label: "Status" }])}${htmlTable("Top Scorers", topRows, [{ key: "pos", label: "Pos" }, { key: "playerNumber", label: "No" }, { key: "playerName", label: "Player" }, { key: "playerTeam", label: "Team" }, { key: "goals", label: "Goals" }])}${htmlTable("Clean Sheets", cleanRows, [{ key: "pos", label: "Pos" }, { key: "team", label: "Team" }, { key: "played", label: "Played" }, { key: "cleanSheets", label: "Clean Sheets" }])}${htmlTable("Cards Summary", cardSummaryRows, [{ key: "pos", label: "Pos" }, { key: "playerNumber", label: "No" }, { key: "playerName", label: "Player" }, { key: "playerTeam", label: "Team" }, { key: "yellow", label: "Yellow" }, { key: "red", label: "Red" }])}${htmlTable("Goal Events", goalRows, [{ key: "matchId", label: "Match ID" }, { key: "match", label: "Match" }, { key: "time", label: "Time" }, { key: "goalForTeam", label: "Goal For" }, { key: "playerNumber", label: "No" }, { key: "playerName", label: "Player" }, { key: "playerTeam", label: "Team" }, { key: "ownGoal", label: "OG" }, { key: "phase", label: "Phase" }])}${htmlTable("Card Events", cardRows, [{ key: "matchId", label: "Match ID" }, { key: "match", label: "Match" }, { key: "time", label: "Time" }, { key: "cardType", label: "Card" }, { key: "playerNumber", label: "No" }, { key: "playerName", label: "Player" }, { key: "playerTeam", label: "Team" }, { key: "phase", label: "Phase" }])}</body></html>`;
}

function downloadExcelReport(data) {
  const html = exportReportHtml(data);
  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `goal-diggers-data-${backupStamp()}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

function printPdfReport(data) {
  const win = window.open("", "_blank");
  if (!win) {
    alert("Popup blocked. Allow popups, then try Export PDF again.");
    return;
  }
  win.document.open();
  win.document.write(exportReportHtml(data));
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 500);
}

function scheduleAutoBackup(reason = "auto") {
  clearTimeout(backupTimer);
  backupTimer = setTimeout(async () => {
    try {
      const data = await collectBackupData();
      const signature = JSON.stringify({ scores: data.scores, state: data.state, settings: data.settings, goals: data.goals, cards: data.cards });
      const now = Date.now();
      if (signature === lastBackupSignature || now - lastBackupAt < 12000) return;
      lastBackupSignature = signature;
      lastBackupAt = now;
      data.reason = reason;
      data.backupId = backupStamp();
      await window.goalDiggersDb.ref("backups/latest").set(data);
      await window.goalDiggersDb.ref(`backups/history/${data.backupId}`).set(data);
      localStorage.setItem("goal-diggers-cup-2026-last-backup", JSON.stringify({ at: data.createdAt, reason }));
      updateBackupStatus(`Auto backup: ${new Date(data.createdAt).toLocaleTimeString()}`);
    } catch (err) {
      console.warn("Auto backup failed", err);
      updateBackupStatus("Auto backup waiting for Firebase...");
    }
  }, 2500);
}

function startAutoBackupWatch() {
  if (backupStarted || !window.goalDiggersDb) return;
  backupStarted = true;
  backupFirebasePaths.forEach((path) => {
    window.goalDiggersDb.ref(path).on("value", () => scheduleAutoBackup(path));
  });
  scheduleAutoBackup("admin-opened");
}

function insertBackupPanel() {
  if (document.getElementById("backupPanel")) return;
  const danger = document.querySelector(".danger-zone");
  const panel = document.createElement("section");
  panel.id = "backupPanel";
  panel.className = "admin-card backup-card";
  panel.innerHTML = `
    <div class="backup-head">
      <div>
        <span>Data Backup</span>
        <h2>Protect Tournament Data</h2>
      </div>
      <strong id="backupStatusText">Auto backup ready</strong>
    </div>
    <p>Backs up scores, match status, settings, goals, and cards to Firebase. You can also export a PDF, Excel sheet, or JSON copy.</p>
    <div class="backup-actions" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
      <button id="manualFirebaseBackupBtn" class="primary-btn" type="button">Save Backup Now</button>
      <button id="downloadBackupBtn" class="ghost-btn" type="button">Download JSON</button>
      <button id="exportPdfBtn" class="ghost-btn" type="button">Export PDF</button>
      <button id="exportExcelBtn" class="ghost-btn" type="button">Export Excel</button>
    </div>
  `;

  if (danger?.parentNode) danger.parentNode.insertBefore(panel, danger);
  else document.querySelector(".admin-shell")?.appendChild(panel);

  document.getElementById("manualFirebaseBackupBtn")?.addEventListener("click", async () => {
    const btn = document.getElementById("manualFirebaseBackupBtn");
    try {
      btn.textContent = "Saving...";
      await saveBackupToFirebase("manual");
      btn.textContent = "Saved";
      setTimeout(() => (btn.textContent = "Save Backup Now"), 1200);
    } catch (err) {
      console.error(err);
      alert("Could not save backup yet. Try again after Firebase loads.");
      btn.textContent = "Save Backup Now";
    }
  });

  document.getElementById("downloadBackupBtn")?.addEventListener("click", async () => {
    const data = await collectBackupData();
    downloadBackupObject(data);
  });

  document.getElementById("exportPdfBtn")?.addEventListener("click", async () => {
    const data = await collectBackupData();
    printPdfReport(data);
  });

  document.getElementById("exportExcelBtn")?.addEventListener("click", async () => {
    const data = await collectBackupData();
    downloadExcelReport(data);
  });
}

insertBackupPanel();
const backupInit = setInterval(() => {
  if (window.goalDiggersDb) {
    clearInterval(backupInit);
    startAutoBackupWatch();
  }
}, 800);
setTimeout(() => clearInterval(backupInit), 15000);
