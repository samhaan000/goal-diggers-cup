// Override the live match timer to count up like a normal football clock.
// Loaded after clean.js so the existing render functions use this version.
function publicTimerState(id){
  try { return (state()[id] || {}); } catch { return {}; }
}
function publicPad(n){ return String(Math.max(0, Math.floor(n))).padStart(2, "0"); }
function publicClockFromSeconds(total){
  const seconds = Math.max(0, Math.floor(Number(total) || 0));
  return `${publicPad(seconds / 60)}:${publicPad(seconds % 60)}`;
}
phaseTimer = function(id){
  const p = phase(id);
  const st = publicTimerState(id);
  const started = phaseStarted(id);
  const offset = Number(st.timerOffsetSeconds || 0);

  if (p === "cancelled") return "Cancelled";
  if (p === "fulltime") return "FT";
  if (p === "halftime") return "Half Time";
  if (st.timerPaused) return `Paused • ${phaseText(st.pausedPhase || p)} • ${publicClockFromSeconds(offset)}`;
  if (!started || !isLivePhase(p)) return phaseText(p);

  const elapsed = Math.max(0, Date.now() - new Date(started).getTime());
  const seconds = offset + Math.floor(elapsed / 1000);
  return `${phaseText(p)} • ${publicClockFromSeconds(seconds)}`;
};

// Keep the badge honest: show LIVE NOW only when a match is actually live.
const originalRenderLiveBoard = renderLiveBoard;
renderLiveBoard = function(match){
  originalRenderLiveBoard(match);
  const label = document.getElementById("currentMatchLabel");
  const card = document.getElementById("currentMatchCard");
  if (label) label.textContent = match ? "Live Now" : "Match Status";
  if (card) card.classList.toggle("is-live", !!match);
};