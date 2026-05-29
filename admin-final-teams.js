(() => {
  const SCORE_KEY = "goal-diggers-cup-2026-scores";
  const STATE_KEY = "goal-diggers-cup-2026-admin-state";
  const FINAL_ID = 22;
  const FINAL_TIME = "20:10";

  function readJson(key, fallback = {}) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch { return fallback; }
  }

  function scoreNum(v) {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }

  function matchPhase(id) {
    return (readJson(STATE_KEY, {})[id] || {}).phase || "upcoming";
  }

  function isLeagueMatch(m) {
    return m && !m.isFinal && Number(m.id) !== FINAL_ID;
  }

  function leagueTeams() {
    const names = new Set();
    (window.adminMatches || adminMatches || []).filter(isLeagueMatch).forEach((m) => {
      names.add(m.home);
      names.add(m.away);
    });
    return [...names];
  }

  function standingsRows() {
    const scores = readJson(SCORE_KEY, {});
    const rows = Object.fromEntries(leagueTeams().map((team) => [team, { team, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 }]));

    (window.adminMatches || adminMatches || []).filter(isLeagueMatch).forEach((m) => {
      const phase = matchPhase(m.id);
      if (phase !== "fulltime") return;
      if (!rows[m.home] || !rows[m.away]) return;
      const sc = scores[m.id] || {};
      const h = scoreNum(sc.home);
      const a = scoreNum(sc.away);
      const home = rows[m.home];
      const away = rows[m.away];
      home.played++;
      away.played++;
      home.gf += h;
      home.ga += a;
      away.gf += a;
      away.ga += h;
      if (h > a) {
        home.won++;
        home.points += 3;
        away.lost++;
      } else if (h < a) {
        away.won++;
        away.points += 3;
        home.lost++;
      } else {
        home.drawn++;
        away.drawn++;
        home.points++;
        away.points++;
      }
    });

    return Object.values(rows)
      .map((r) => ({ ...r, gd: r.gf - r.ga }))
      .sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf || a.team.localeCompare(b.team));
  }

  function finalists() {
    const rows = standingsRows();
    if (rows.length >= 2 && rows[0].played > 0 && rows[1].played > 0) return { home: rows[0].team, away: rows[1].team };
    return { home: "Smashers FC", away: "Meem Police" };
  }

  function updateFinalMatchData() {
    const list = window.adminMatches || adminMatches;
    const final = list?.find((m) => Number(m.id) === FINAL_ID);
    if (!final) return null;
    const teams = finalists();
    final.home = teams.home;
    final.away = teams.away;
    final.time = FINAL_TIME;
    final.round = "Grand Final";
    final.day = "Grand Final — Friday, 29 May 2026";
    return final;
  }

  function applyFinalistText() {
    const final = updateFinalMatchData();
    if (!final) return;
    const select = document.getElementById("matchSelect");
    if (select) {
      [...select.options].forEach((opt) => {
        if (String(opt.value) === String(FINAL_ID)) opt.textContent = `Final — ${final.home} vs ${final.away}`;
      });
    }
    if (String(window.selectedId || select?.value) === String(FINAL_ID)) {
      const homeScoreLabel = document.getElementById("homeTeam");
      const awayScoreLabel = document.getElementById("awayTeam");
      const title = document.getElementById("currentMatchTitleAdmin");
      const info = document.getElementById("matchInfo");
      if (homeScoreLabel) homeScoreLabel.textContent = final.home;
      if (awayScoreLabel) awayScoreLabel.textContent = final.away;
      if (title) title.textContent = `${final.home} vs ${final.away}`;
      if (info) info.textContent = `${FINAL_TIME} • Grand Final`;
    }
  }

  const oldRender = window.render;
  if (typeof oldRender === "function") {
    window.render = render = function () {
      updateFinalMatchData();
      oldRender();
      applyFinalistText();
    };
  }

  updateFinalMatchData();
  setTimeout(() => {
    applyFinalistText();
    if (typeof window.render === "function") window.render();
  }, 100);
  setInterval(applyFinalistText, 1200);
})();
