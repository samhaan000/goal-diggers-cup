function resultStatusLabel(phase) {
  if (phase === "fulltime") return "Full Time";
  if (phase === "first_half" || phase === "second_half" || phase === "halftime") return "Live / In Progress";
  if (phase === "cancelled") return "Cancelled";
  return "Upcoming";
}

function makeMatchResultRows(data) {
  if (typeof matches === "undefined") return [];
  return matches
    .map((m) => {
      const homeScore = scoreValue(data, m.id, "home");
      const awayScore = scoreValue(data, m.id, "away");
      const ph = phaseValue(data, m.id);
      const hasResult = ph === "fulltime" || ph === "cancelled" || homeScore > 0 || awayScore > 0;
      let winner = "";
      if (homeScore > awayScore) winner = m.home;
      else if (awayScore > homeScore) winner = m.away;
      else if (hasResult) winner = "Draw";

      return {
        id: m.id,
        day: m.day || "",
        round: m.round || "",
        time: m.time || "",
        match: `${m.home} vs ${m.away}`,
        home: m.home,
        away: m.away,
        homeScore,
        awayScore,
        result: hasResult ? `${m.home} ${homeScore} - ${awayScore} ${m.away}` : "Not played",
        winner,
        status: resultStatusLabel(ph),
        final: m.isFinal ? "Yes" : "No"
      };
    })
    .filter((row) => row.status !== "Upcoming" || row.homeScore > 0 || row.awayScore > 0);
}

function exportReportHtml(data) {
  const leagueRows = makeLeagueTableRows(data).map((r, i) => ({ pos: i + 1, ...r }));
  const resultRows = makeMatchResultRows(data);
  const matchRows = makeMatchRows(data);
  const goalRows = makeGoalRows(data);
  const cardRows = makeCardRows(data);
  const topRows = makeTopScorerRows(data).map((r, i) => ({ pos: i + 1, ...r }));
  const cleanRows = makeCleanSheetRows(data).map((r, i) => ({ pos: i + 1, ...r }));
  const cardSummaryRows = makeCardSummaryRows(data).map((r, i) => ({ pos: i + 1, ...r }));

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Goal Diggers Cup Export</title><style>body{font-family:Arial,sans-serif;color:#111827;padding:24px}h1{margin:0 0 4px;color:#1f1330}p{margin:0 0 18px;color:#64748b}h2{margin:22px 0 8px;color:#8a6415;font-size:18px}table{width:100%;border-collapse:collapse;margin-bottom:18px;font-size:12px}th{background:#1f1330;color:#fff;text-align:left}th,td{border:1px solid #d7c58f;padding:7px 8px;vertical-align:top}tr:nth-child(even){background:#fff8e6}.result-cell{font-weight:bold;color:#1f1330}@media print{body{padding:10mm}h2{break-after:avoid}table{break-inside:auto}tr{break-inside:avoid}}</style></head><body><h1>Goal Diggers Cup 2026 — Data Export</h1><p>Generated: ${escapeExport(new Date(data.createdAt || Date.now()).toLocaleString())}</p>${htmlTable("Match Results", resultRows, [{ key: "id", label: "ID" }, { key: "round", label: "Round" }, { key: "time", label: "Time" }, { key: "match", label: "Match" }, { key: "homeScore", label: "Home Score" }, { key: "awayScore", label: "Away Score" }, { key: "result", label: "Result" }, { key: "winner", label: "Winner" }, { key: "status", label: "Status" }])}${htmlTable("League Table", leagueRows, [{ key: "pos", label: "Pos" }, { key: "team", label: "Team" }, { key: "played", label: "PL" }, { key: "won", label: "W" }, { key: "drawn", label: "D" }, { key: "lost", label: "L" }, { key: "gf", label: "GF" }, { key: "ga", label: "GA" }, { key: "gd", label: "GD" }, { key: "points", label: "PTS" }])}${htmlTable("All Matches", matchRows, [{ key: "id", label: "ID" }, { key: "day", label: "Day" }, { key: "round", label: "Round" }, { key: "time", label: "Time" }, { key: "home", label: "Home" }, { key: "homeScore", label: "HS" }, { key: "awayScore", label: "AS" }, { key: "away", label: "Away" }, { key: "phase", label: "Status" }])}${htmlTable("Top Scorers", topRows, [{ key: "pos", label: "Pos" }, { key: "playerNumber", label: "No" }, { key: "playerName", label: "Player" }, { key: "playerTeam", label: "Team" }, { key: "goals", label: "Goals" }])}${htmlTable("Clean Sheets", cleanRows, [{ key: "pos", label: "Pos" }, { key: "team", label: "Team" }, { key: "played", label: "Played" }, { key: "cleanSheets", label: "Clean Sheets" }])}${htmlTable("Cards Summary", cardSummaryRows, [{ key: "pos", label: "Pos" }, { key: "playerNumber", label: "No" }, { key: "playerName", label: "Player" }, { key: "playerTeam", label: "Team" }, { key: "yellow", label: "Yellow" }, { key: "red", label: "Red" }])}${htmlTable("Goal Events", goalRows, [{ key: "matchId", label: "Match ID" }, { key: "match", label: "Match" }, { key: "time", label: "Time" }, { key: "goalForTeam", label: "Goal For" }, { key: "playerNumber", label: "No" }, { key: "playerName", label: "Player" }, { key: "playerTeam", label: "Team" }, { key: "ownGoal", label: "OG" }, { key: "phase", label: "Phase" }])}${htmlTable("Card Events", cardRows, [{ key: "matchId", label: "Match ID" }, { key: "match", label: "Match" }, { key: "time", label: "Time" }, { key: "cardType", label: "Card" }, { key: "playerNumber", label: "No" }, { key: "playerName", label: "Player" }, { key: "playerTeam", label: "Team" }, { key: "phase", label: "Phase" }])}</body></html>`;
}
