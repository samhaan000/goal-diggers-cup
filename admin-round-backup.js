const roundBackupKey = "goal-diggers-cup-2026-round-backups";
let roundBackupTimer = null;
let lastRoundBackupSnapshot = "";

function readRoundBackupMarks() {
  try {
    return JSON.parse(localStorage.getItem(roundBackupKey)) || {};
  } catch {
    return {};
  }
}

function writeRoundBackupMarks(value) {
  localStorage.setItem(roundBackupKey, JSON.stringify(value || {}));
}

function getRoundName(match) {
  return String(match?.round || "").trim();
}

function isMatchFullTimeForRoundBackup(data, matchId) {
  return data?.state?.[matchId]?.phase === "fulltime";
}

function completedRoundsFromData(data) {
  if (typeof leagueMatches === "undefined") return [];
  const groups = {};

  leagueMatches.forEach((match) => {
    const round = getRoundName(match);
    if (!round) return;
    groups[round] = groups[round] || [];
    groups[round].push(match);
  });

  return Object.entries(groups)
    .filter(([, list]) => list.length && list.every((match) => isMatchFullTimeForRoundBackup(data, match.id)))
    .map(([round, list]) => ({ round, matches: list.map((m) => m.id) }));
}

async function saveCompletedRoundBackup(roundInfo, data) {
  if (!window.goalDiggersDb) return;
  const backupId = `round_${roundInfo.round.replace(/[^a-z0-9]+/gi, "_").toLowerCase()}_${backupStamp()}`;
  const payload = {
    ...data,
    reason: `round-complete-${roundInfo.round}`,
    backupId,
    round: roundInfo.round,
    roundMatches: roundInfo.matches
  };

  await window.goalDiggersDb.ref("backups/latest").set(payload);
  await window.goalDiggersDb.ref(`backups/rounds/${roundInfo.round}`).set(payload);
  await window.goalDiggersDb.ref(`backups/history/${backupId}`).set(payload);
  updateBackupStatus(`Round backup: ${roundInfo.round}`);
}

async function checkRoundBackup() {
  try {
    if (!window.goalDiggersDb || typeof collectBackupData !== "function") return;
    const data = await collectBackupData();
    const snapshot = JSON.stringify({ scores: data.scores, state: data.state });
    if (snapshot === lastRoundBackupSnapshot) return;
    lastRoundBackupSnapshot = snapshot;

    const marks = readRoundBackupMarks();
    const completedRounds = completedRoundsFromData(data);

    for (const roundInfo of completedRounds) {
      const signature = JSON.stringify(roundInfo.matches.map((id) => ({ id, score: data.scores?.[id], phase: data.state?.[id]?.phase })));
      if (marks[roundInfo.round] === signature) continue;
      await saveCompletedRoundBackup(roundInfo, data);
      marks[roundInfo.round] = signature;
      writeRoundBackupMarks(marks);
    }
  } catch (err) {
    console.warn("Round backup check failed", err);
  }
}

function scheduleRoundBackupCheck() {
  clearTimeout(roundBackupTimer);
  roundBackupTimer = setTimeout(checkRoundBackup, 2000);
}

function startRoundBackupWatch() {
  if (!window.goalDiggersDb) return;
  window.goalDiggersDb.ref("scores").on("value", scheduleRoundBackupCheck);
  window.goalDiggersDb.ref("state").on("value", scheduleRoundBackupCheck);
  scheduleRoundBackupCheck();
}

const roundBackupInit = setInterval(() => {
  if (window.goalDiggersDb && typeof collectBackupData === "function") {
    clearInterval(roundBackupInit);
    startRoundBackupWatch();
  }
}, 800);
setTimeout(() => clearInterval(roundBackupInit), 15000);
