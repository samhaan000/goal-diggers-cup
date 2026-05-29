(() => {
  const FINAL_ID = 22;
  const FINAL_TIME = "20:10";
  const STATE_KEY = "goal-diggers-cup-2026-admin-state";
  const SCORE_KEY = "goal-diggers-cup-2026-scores";
  const FINAL_ACTIVE_PHASES = ["first_half", "halftime", "second_half", "fulltime", "extra_break", "extra_first_half", "extra_halftime", "extra_second_half", "penalty_shootout"];

  function readJson(key, fallback = {}) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch { return fallback; }
  }

  function scoreNum(v) {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }

  function phaseOf(id) {
    return (readJson(STATE_KEY, {})[id] || {}).phase || "upcoming";
  }

  function isLeagueMatch(m) {
    return m && !m.isFinal && Number(m.id) !== FINAL_ID;
  }

  function fallbackFinalists() {
    return { home: "Smashers FC", away: "Meem Police" };
  }

  function standingsRows() {
    if (typeof matches === "undefined") return [];
    const teamNames = new Set();
    matches.filter(isLeagueMatch).forEach((m) => {
      teamNames.add(m.home);
      teamNames.add(m.away);
    });

    const rows = Object.fromEntries([...teamNames].map((team) => [team, { team, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 }]));
    const scores = readJson(SCORE_KEY, {});

    matches.filter(isLeagueMatch).forEach((m) => {
      if (phaseOf(m.id) !== "fulltime") return;
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
    const existing = window.goalDiggersFinalists;
    if (existing?.home && existing?.away && !/^\d/.test(existing.home) && !/^\d/.test(existing.away)) return existing;

    try {
      if (typeof table === "function") {
        const rows = table();
        if (rows && rows.length >= 2 && !/^\d/.test(rows[0].team) && !/^\d/.test(rows[1].team)) return { home: rows[0].team, away: rows[1].team };
      }
    } catch {}

    const rows = standingsRows();
    if (rows.length >= 2 && rows[0].played > 0 && rows[1].played > 0) return { home: rows[0].team, away: rows[1].team };
    return fallbackFinalists();
  }

  function applyPublicFinalists() {
    if (typeof matches === "undefined") return null;
    const finalMatch = matches.find((m) => Number(m.id) === FINAL_ID);
    if (!finalMatch) return null;
    const teams = finalists();
    finalMatch.home = teams.home;
    finalMatch.away = teams.away;
    finalMatch.time = FINAL_TIME;
    finalMatch.round = "Grand Final";
    finalMatch.day = "Grand Final — Friday, 29 May 2026";
    finalMatch.isFinal = true;
    window.goalDiggersFinalists = teams;
    return finalMatch;
  }

  function nextMatchCard() {
    const title = document.getElementById("nextMatchTitle");
    return title ? title.closest("article") : null;
  }

  function hideNextMatchCard(hidden) {
    const card = nextMatchCard();
    if (!card) return;
    card.hidden = hidden;
    card.style.display = hidden ? "none" : "";
  }

  function ensureFinalLiveStyles() {
    if (document.getElementById("finalLiveTagStyle")) return;
    const style = document.createElement("style");
    style.id = "finalLiveTagStyle";
    style.textContent = `
      .final-live-action-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:14px}
      .final-live-action-row .watch-live-btn{margin-top:0!important}
      .final-live-tag{display:inline-flex;align-items:center;color:#8a6517;font-size:.72rem;font-weight:1000;letter-spacing:.11em;text-transform:uppercase;line-height:1;background:transparent!important;border:0!important;box-shadow:none!important;padding:0!important;margin:0!important}
      @media(max-width:540px){.final-live-action-row{gap:10px;margin-top:12px}.final-live-tag{font-size:.62rem;letter-spacing:.09em}}
    `;
    document.head.appendChild(style);
  }

  function updateFinalLiveTag(isCurrentFinal) {
    ensureFinalLiveStyles();
    const card = document.getElementById("currentMatchCard");
    const watch = card?.querySelector(".watch-live-btn");
    if (!card || !watch) return;

    let row = card.querySelector(".final-live-action-row");
    if (!row) {
      row = document.createElement("div");
      row.className = "final-live-action-row";
      watch.parentNode.insertBefore(row, watch);
      row.appendChild(watch);
    }

    let tag = row.querySelector(".final-live-tag");
    if (!tag) {
      tag = document.createElement("span");
      tag.className = "final-live-tag";
      row.appendChild(tag);
    }

    tag.textContent = isCurrentFinal ? "Grand Finale" : "";
    tag.hidden = !isCurrentFinal;
  }

  function updateLiveFinalBoard() {
    const finalMatch = applyPublicFinalists();
    if (!finalMatch) return;
    const st = readJson(STATE_KEY, {});
    const finalPhase = phaseOf(FINAL_ID);
    const isCurrentFinal = String(st.currentMatchId) === String(FINAL_ID) && FINAL_ACTIVE_PHASES.includes(finalPhase);

    hideNextMatchCard(isCurrentFinal);
    updateFinalLiveTag(isCurrentFinal);
    if (!isCurrentFinal) return;

    const homeName = document.getElementById("liveHomeName");
    const awayName = document.getElementById("liveAwayName");
    const homeImg = document.getElementById("liveHomeLogo");
    const awayImg = document.getElementById("liveAwayLogo");
    const meta = document.getElementById("currentMatchMeta");
    const title = document.getElementById("currentMatchTitle");

    if (homeName) homeName.textContent = finalMatch.home;
    if (awayName) awayName.textContent = finalMatch.away;
    if (homeImg && typeof teamLogos !== "undefined") {
      homeImg.src = teamLogos[finalMatch.home] || "";
      homeImg.alt = `${finalMatch.home} logo`;
    }
    if (awayImg && typeof teamLogos !== "undefined") {
      awayImg.src = teamLogos[finalMatch.away] || "";
      awayImg.alt = `${finalMatch.away} logo`;
    }
    if (meta && typeof phaseTimer === "function") meta.textContent = phaseTimer(FINAL_ID);
    if (title) title.textContent = `${finalMatch.home} vs ${finalMatch.away}`;
  }

  const oldRenderLiveBoard = window.renderLiveBoard || (typeof renderLiveBoard === "function" ? renderLiveBoard : null);
  if (oldRenderLiveBoard) {
    window.renderLiveBoard = renderLiveBoard = function (match) {
      applyPublicFinalists();
      if (match && Number(match.id) === FINAL_ID) match = matches.find((m) => Number(m.id) === FINAL_ID) || match;
      oldRenderLiveBoard(match);
      updateLiveFinalBoard();
    };
  }

  const oldUpdateMatchCards = window.updateMatchCards || (typeof updateMatchCards === "function" ? updateMatchCards : null);
  if (oldUpdateMatchCards) {
    window.updateMatchCards = updateMatchCards = function () {
      applyPublicFinalists();
      oldUpdateMatchCards();
      updateLiveFinalBoard();
    };
  }

  applyPublicFinalists();
  setTimeout(() => {
    applyPublicFinalists();
    if (typeof window.render === "function") window.render();
    updateLiveFinalBoard();
  }, 100);
  setInterval(() => {
    applyPublicFinalists();
    updateLiveFinalBoard();
  }, 1200);
})();
