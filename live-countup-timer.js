// Override the live match timer to count up like a normal football clock.
// Loaded after clean.js so the existing render functions use this version.
phaseTimer = function(id){
  const p = phase(id);
  const started = phaseStarted(id);
  if (p === "fulltime") return "FT";
  if (p === "halftime") return "Half Time";
  if (!started || !isLivePhase(p)) return phaseText(p);

  const elapsed = Math.max(0, Date.now() - new Date(started).getTime());
  const seconds = Math.floor(elapsed / 1000);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `${phaseText(p)} • ${mm}:${ss}`;
};

// Keep the badge honest: show LIVE NOW only when a match is actually live.
const originalRenderLiveBoard = renderLiveBoard;
renderLiveBoard = function(match){
  originalRenderLiveBoard(match);
  const label = document.getElementById("currentMatchLabel");
  if (label) label.textContent = match ? "Live Now" : "Current Match";
};