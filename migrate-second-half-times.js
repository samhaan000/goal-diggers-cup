const SECOND_HALF_OFFSET_SECONDS = 6 * 60;
const MIGRATION_KEY = "goal-diggers-second-half-time-migration-v1";

function parseMatchClockToSeconds(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const parts = raw.split(":").map((x) => Number(x) || 0);
  if (parts.length === 1) return parts[0] * 60;
  return parts[0] * 60 + parts[1];
}

function formatMatchClockFromSeconds(total) {
  const safe = Math.max(0, Math.floor(Number(total) || 0));
  const m = String(Math.floor(safe / 60)).padStart(2, "0");
  const s = String(safe % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function shouldShiftSecondHalfEvent(event) {
  if (!event || event.phase !== "second_half") return false;
  if (event.continuousTimeMigrated) return false;
  const seconds = parseMatchClockToSeconds(event.matchTime);
  return seconds !== null && seconds < SECOND_HALF_OFFSET_SECONDS;
}

function migrateSecondHalfCollection(collection) {
  let changed = false;
  const output = { ...(collection || {}) };

  Object.keys(output).forEach((matchId) => {
    const matchEvents = { ...(output[matchId] || {}) };
    Object.keys(matchEvents).forEach((eventId) => {
      const event = { ...(matchEvents[eventId] || {}) };
      if (!shouldShiftSecondHalfEvent(event)) return;
      const oldSeconds = parseMatchClockToSeconds(event.matchTime);
      event.originalMatchTime = event.matchTime;
      event.matchTime = formatMatchClockFromSeconds(oldSeconds + SECOND_HALF_OFFSET_SECONDS);
      event.continuousTimeMigrated = true;
      event.continuousTimeMigratedAt = new Date().toISOString();
      matchEvents[eventId] = event;
      changed = true;
    });
    output[matchId] = matchEvents;
  });

  return { output, changed };
}

async function migrateSecondHalfTimesNow() {
  const already = localStorage.getItem(MIGRATION_KEY);
  if (already) return;
  if (!window.goalDiggersDb) return;

  const ok = confirm("Convert existing 2nd Half goal/card times to continuous match time?\n\nExample: 2nd Half 00:47 becomes 06:47.\nThis runs once only.");
  if (!ok) {
    localStorage.setItem(MIGRATION_KEY, "skipped");
    return;
  }

  try {
    const [goalSnap, cardSnap] = await Promise.all([
      window.goalDiggersDb.ref("goals").once("value"),
      window.goalDiggersDb.ref("cards").once("value")
    ]);

    const goalResult = migrateSecondHalfCollection(goalSnap.val() || {});
    const cardResult = migrateSecondHalfCollection(cardSnap.val() || {});

    if (goalResult.changed) await window.goalDiggersDb.ref("goals").set(goalResult.output);
    if (cardResult.changed) await window.goalDiggersDb.ref("cards").set(cardResult.output);

    localStorage.setItem(MIGRATION_KEY, JSON.stringify({ at: new Date().toISOString(), goals: goalResult.changed, cards: cardResult.changed }));
    alert(goalResult.changed || cardResult.changed ? "Second half times updated." : "No second half times needed updating.");
  } catch (err) {
    console.error(err);
    alert("Could not update second half times. Try again after Firebase loads.");
  }
}

const migrationInit = setInterval(() => {
  if (window.goalDiggersDb) {
    clearInterval(migrationInit);
    setTimeout(migrateSecondHalfTimesNow, 1200);
  }
}, 800);
setTimeout(() => clearInterval(migrationInit), 15000);
