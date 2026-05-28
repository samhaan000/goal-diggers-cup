const auditScoreKey = "goal-diggers-cup-2026-scores";
const auditStateKey = "goal-diggers-cup-2026-admin-state";
const auditGoalsKey = "goal-diggers-cup-2026-goals";
const auditCardsKey = "goal-diggers-cup-2026-cards";

function auditReadLocal(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch {
    return {};
  }
}

async function auditReadData() {
  const data = {
    scores: auditReadLocal(auditScoreKey),
    state: auditReadLocal(auditStateKey),
    goals: auditReadLocal(auditGoalsKey),
    cards: auditReadLocal(auditCardsKey)
  };

  if (!window.goalDiggersDb) return data;

  const [scoresSnap, stateSnap, goalsSnap, cardsSnap] = await Promise.all([
    window.goalDiggersDb.ref("scores").once("value"),
    window.goalDiggersDb.ref("state").once("value"),
    window.goalDiggersDb.ref("goals").once("value"),
    window.goalDiggersDb.ref("cards").once("value")
  ]);

  data.scores = scoresSnap.val() || {};
  data.state = stateSnap.val() || {};
  data.goals = goalsSnap.val() || {};
  data.cards = cardsSnap.val() || {};
  return data;
}

function auditNum(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function auditGoalCountForSide(match, matchGoals, side) {
  return Object.values(matchGoals || {}).filter((g) => {
    const goalForTeam = g.goalForTeam || "";
    if (side === "home") return goalForTeam === match.home || g.side === "home";
    return goalForTeam === match.away || g.side === "away";
  }).length;
}

function auditMatchLabel(match) {
  return `#${match.id} ${match.home} vs ${match.away}`;
}

function auditFindIssues(data) {
  if (typeof matches === "undefined") return [{ level: "warn", text: "Match list not loaded yet. Open admin again and rescan." }];
  const issues = [];
  const livePhases = ["first_half", "halftime", "second_half"];
  const currentMatchId = data.state.currentMatchId ? String(data.state.currentMatchId) : "";

  matches.filter((m) => !m.isFinal).forEach((match) => {
    const id = String(match.id);
    const st = data.state[id] || {};
    const score = data.scores[id] || {};
    const homeScore = auditNum(score.home);
    const awayScore = auditNum(score.away);
    const phase = st.phase || "upcoming";
    const matchGoals = data.goals[id] || {};
    const matchCards = data.cards[id] || {};
    const goalEvents = Object.values(matchGoals || {});
    const cardEvents = Object.values(matchCards || {});

    if (phase === "upcoming" && (homeScore > 0 || awayScore > 0)) {
      issues.push({ level: "danger", matchId: id, text: `${auditMatchLabel(match)} is Upcoming but has score ${homeScore}-${awayScore}.` });
    }

    if (phase === "upcoming" && goalEvents.length) {
      issues.push({ level: "danger", matchId: id, text: `${auditMatchLabel(match)} is Upcoming but has ${goalEvents.length} goal event(s).` });
    }

    if (phase === "upcoming" && cardEvents.length) {
      issues.push({ level: "warn", matchId: id, text: `${auditMatchLabel(match)} is Upcoming but has ${cardEvents.length} card event(s).` });
    }

    if (livePhases.includes(phase) && currentMatchId !== id) {
      issues.push({ level: "warn", matchId: id, text: `${auditMatchLabel(match)} is still marked ${phase}, but it is not the current live match.` });
    }

    if (phase === "fulltime") {
      const homeGoals = auditGoalCountForSide(match, matchGoals, "home");
      const awayGoals = auditGoalCountForSide(match, matchGoals, "away");
      if (homeGoals !== homeScore || awayGoals !== awayScore) {
        issues.push({ level: "warn", matchId: id, text: `${auditMatchLabel(match)} score is ${homeScore}-${awayScore}, but goal log looks like ${homeGoals}-${awayGoals}.` });
      }
    }

    if (phase === "cancelled" && st.countInTable === true) {
      issues.push({ level: "warn", matchId: id, text: `${auditMatchLabel(match)} is cancelled but still set to count in table.` });
    }
  });

  return issues;
}

function auditPanelHtml(issues) {
  const rows = issues.length
    ? issues.map((issue) => `<li class="audit-${issue.level}">${issue.text}</li>`).join("")
    : `<li class="audit-ok">No obvious wrong match/table data found.</li>`;

  return `
    <div class="audit-head">
      <div>
        <span>Data Check</span>
        <h2>Match Data Audit</h2>
      </div>
      <button id="runDataAuditBtn" class="ghost-btn" type="button">Scan Again</button>
    </div>
    <p>Checks for wrong live statuses, scores on upcoming matches, goal-log mismatches, and cancelled matches counted in the table.</p>
    <ul class="audit-list">${rows}</ul>
  `;
}

function ensureAuditPanel() {
  let panel = document.getElementById("dataAuditPanel");
  if (panel) return panel;
  panel = document.createElement("section");
  panel.id = "dataAuditPanel";
  panel.className = "admin-card data-audit-card";
  const backup = document.getElementById("backupPanel");
  const danger = document.querySelector(".danger-zone");
  if (backup?.parentNode) backup.parentNode.insertBefore(panel, backup);
  else if (danger?.parentNode) danger.parentNode.insertBefore(panel, danger);
  else document.querySelector(".admin-shell")?.appendChild(panel);
  return panel;
}

function injectAuditStyles() {
  if (document.getElementById("dataAuditStyle")) return;
  const style = document.createElement("style");
  style.id = "dataAuditStyle";
  style.textContent = `
    .data-audit-card{border-color:#fde68a!important;background:linear-gradient(180deg,#fff,#fffaf0)!important}
    .audit-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:8px}
    .audit-head span{display:block;color:#92400e;font-size:.7rem;font-weight:950;text-transform:uppercase;letter-spacing:.07em}
    .audit-head h2{margin:3px 0 0;color:#102033;font-size:1.05rem}
    .data-audit-card p{margin:0 0 10px;color:#64748b;font-size:.78rem;font-weight:750;line-height:1.4}
    .audit-list{list-style:none;padding:0;margin:0;display:grid;gap:7px}
    .audit-list li{padding:9px 10px;border-radius:11px;font-size:.78rem;font-weight:800;line-height:1.35}
    .audit-ok{background:#ecfdf5;color:#047857;border:1px solid #bbf7d0}
    .audit-warn{background:#fff7ed;color:#9a3412;border:1px solid #fed7aa}
    .audit-danger{background:#fef2f2;color:#991b1b;border:1px solid #fecaca}
  `;
  document.head.appendChild(style);
}

async function runDataAudit() {
  const panel = ensureAuditPanel();
  panel.innerHTML = auditPanelHtml([{ level: "warn", text: "Scanning Firebase data..." }]);
  panel.querySelector("#runDataAuditBtn")?.addEventListener("click", runDataAudit);
  try {
    const data = await auditReadData();
    const issues = auditFindIssues(data);
    panel.innerHTML = auditPanelHtml(issues);
    panel.querySelector("#runDataAuditBtn")?.addEventListener("click", runDataAudit);
  } catch (err) {
    console.error(err);
    panel.innerHTML = auditPanelHtml([{ level: "danger", text: "Could not scan data. Firebase may still be loading." }]);
    panel.querySelector("#runDataAuditBtn")?.addEventListener("click", runDataAudit);
  }
}

injectAuditStyles();
setTimeout(runDataAudit, 2200);
