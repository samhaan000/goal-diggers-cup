function grandFinalTeams() {
  if (typeof table !== "function") return null;
  const rows = table();
  if (!rows || rows.length < 2) return null;
  return { home: rows[0].team, away: rows[1].team };
}

function grandFinalTeamHtml(team, side) {
  if (typeof teamMark !== "function") return `<div class="fixture-team fixture-${side}"><span>${team}</span></div>`;
  return `<div class="fixture-team fixture-${side}">${side === "home" ? `${teamMark(team)}<span>${team}</span>` : `<span>${team}</span>${teamMark(team)}`}</div>`;
}

function applyGrandFinalTeams() {
  const finalists = grandFinalTeams();
  if (!finalists) return;

  const finalCard = document.querySelector('.match-card[data-match-id="22"]');
  if (finalCard) {
    const homeSlot = finalCard.querySelector(".fixture-home");
    const awaySlot = finalCard.querySelector(".fixture-away");
    const statusSlot = finalCard.querySelector(".status-pill");
    const homeHtml = grandFinalTeamHtml(finalists.home, "home");
    const awayHtml = grandFinalTeamHtml(finalists.away, "away");

    if (homeSlot && homeSlot.outerHTML !== homeHtml) homeSlot.outerHTML = homeHtml;
    if (awaySlot && awaySlot.outerHTML !== awayHtml) awaySlot.outerHTML = awayHtml;
    if (statusSlot && statusSlot.textContent.trim() === "Final") statusSlot.textContent = "Grand Final";
  }

  const nextTitle = document.getElementById("nextMatchTitle");
  const nextMeta = document.getElementById("nextMatchMeta");
  const finalPhase = typeof phase === "function" ? phase(22) : "upcoming";
  const isFinalPending = finalPhase !== "fulltime";

  if (nextTitle && nextMeta && isFinalPending) {
    const currentNext = typeof nextUnplayed === "function" ? nextUnplayed() : null;
    if (!currentNext || currentNext.isFinal || currentNext.id === 22) {
      nextTitle.textContent = `${finalists.home} vs ${finalists.away}`;
      nextMeta.textContent = "Grand Final • After league stage";
    }
  }
}

const oldRenderMatchesForGrandFinal = renderMatches;
renderMatches = function () {
  oldRenderMatchesForGrandFinal();
  applyGrandFinalTeams();
};

const oldRenderTableForGrandFinal = renderTable;
renderTable = function () {
  oldRenderTableForGrandFinal();
  applyGrandFinalTeams();
};

const oldUpdateMatchCardsForGrandFinal = updateMatchCards;
updateMatchCards = function () {
  oldUpdateMatchCardsForGrandFinal();
  applyGrandFinalTeams();
};

setTimeout(applyGrandFinalTeams, 300);
