function applyGrandFinalTime() {
  try {
    const finalMatch = typeof matches !== "undefined" ? matches.find((m) => Number(m.id) === 22) : null;
    if (finalMatch) finalMatch.time = "20:10";

    const nextTitle = document.getElementById("nextMatchTitle");
    const nextMeta = document.getElementById("nextMatchMeta");
    const finalPhase = typeof phase === "function" ? phase(22) : "upcoming";
    const isFinalPending = finalPhase !== "fulltime";

    if (nextTitle && nextMeta && isFinalPending) {
      const isGrandFinalNext = nextMeta.textContent.toLowerCase().includes("grand final") || nextTitle.textContent.toLowerCase().includes("smashers") || nextTitle.textContent.toLowerCase().includes("meem police");
      if (isGrandFinalNext) nextMeta.textContent = "20:10 • Grand Final";
    }

    document.querySelectorAll('.match-card[data-match-id="22"] .status-pill').forEach((el) => {
      if (!["FT", "1st Half", "2nd Half", "Half Time"].some((x) => el.textContent.includes(x))) {
        el.textContent = "20:10 • Grand Final";
      }
    });
  } catch (err) {
    console.warn("Grand final time update failed", err);
  }
}

const oldApplyGrandFinalTeamsForTime = typeof applyGrandFinalTeams === "function" ? applyGrandFinalTeams : null;
if (oldApplyGrandFinalTeamsForTime) {
  applyGrandFinalTeams = function () {
    oldApplyGrandFinalTeamsForTime();
    applyGrandFinalTime();
  };
}

setTimeout(applyGrandFinalTime, 300);
setTimeout(applyGrandFinalTime, 1500);
