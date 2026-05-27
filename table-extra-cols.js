function updateLeagueTableColumns() {
  const head = document.querySelector(".league-head");
  const body = document.getElementById("standingsList");
  if (!head || !body || typeof table !== "function" || typeof teamMark !== "function") return;

  head.innerHTML = `<span>Pos</span><span class="team-label">Team</span><span>Pl</span><span>W</span><span>D</span><span>L</span><span>GD</span><span>Pts</span>`;

  const rows = table().map((r, i) => `
    <div class="league-row ${i < 2 ? "top-two" : ""}">
      <span>${i + 1}</span>
      <div class="team-cell">${teamMark(r.team)}<strong>${r.team}</strong></div>
      <span>${r.played}</span>
      <span>${r.won}</span>
      <span>${r.drawn}</span>
      <span>${r.lost}</span>
      <span>${r.gd > 0 ? "+" : ""}${r.gd}</span>
      <b>${r.points}</b>
    </div>
  `).join("");

  if (body.dataset.extraColsMarkup !== rows) {
    body.innerHTML = rows;
    body.dataset.extraColsMarkup = rows;
  }
}

const originalRenderTableWithExtraCols = window.renderTable || renderTable;
renderTable = function () {
  originalRenderTableWithExtraCols();
  updateLeagueTableColumns();
};

setInterval(updateLeagueTableColumns, 1500);
setTimeout(updateLeagueTableColumns, 300);
