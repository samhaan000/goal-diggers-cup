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

function renderNextMatchVisual(el, home, away) {
  if (!el || !home || !away) return;
  el.classList.add("next-match-rich");
  el.innerHTML = `
    <span class="next-team-inline next-team-home">
      ${typeof teamMark === "function" ? teamMark(home) : ""}
      <span class="next-team-name">${home}</span>
    </span>
    <span class="next-match-vs">vs</span>
    <span class="next-team-inline next-team-away">
      <span class="next-team-name">${away}</span>
      ${typeof teamMark === "function" ? teamMark(away) : ""}
    </span>
  `;
}

function applyGrandFinalTeams() {
  const finalists = grandFinalTeams();
  if (!finalists) return;

  const finalCard = document.querySelector('.match-card[data-match-id="22"]');
  if (finalCard) {
    finalCard.classList.add("grand-final-showpiece");
    const homeSlot = finalCard.querySelector(".fixture-home");
    const awaySlot = finalCard.querySelector(".fixture-away");
    const statusSlot = finalCard.querySelector(".status-pill");
    const scoreSlot = finalCard.querySelector(".score-display");
    const metaSlot = finalCard.querySelector(".match-meta");
    const homeHtml = grandFinalTeamHtml(finalists.home, "home");
    const awayHtml = grandFinalTeamHtml(finalists.away, "away");

    if (homeSlot && homeSlot.outerHTML !== homeHtml) homeSlot.outerHTML = homeHtml;
    if (awaySlot && awaySlot.outerHTML !== awayHtml) awaySlot.outerHTML = awayHtml;
    if (metaSlot) metaSlot.textContent = "Grand Final";
    if (scoreSlot && scoreSlot.textContent.trim().toLowerCase() === "vs") scoreSlot.textContent = "VS";
    if (statusSlot && ["Final", "Grand Final"].includes(statusSlot.textContent.trim())) statusSlot.textContent = "Championship Match";
  }

  const nextTitle = document.getElementById("nextMatchTitle");
  const nextMeta = document.getElementById("nextMatchMeta");
  const finalPhase = typeof phase === "function" ? phase(22) : "upcoming";
  const isFinalPending = finalPhase !== "fulltime";

  if (nextTitle && nextMeta && isFinalPending) {
    const currentNext = typeof nextUnplayed === "function" ? nextUnplayed() : null;
    if (!currentNext || currentNext.isFinal || currentNext.id === 22) {
      renderNextMatchVisual(nextTitle, finalists.home, finalists.away);
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
