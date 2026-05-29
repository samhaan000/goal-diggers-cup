(() => {
  const FINAL_LIVE_PHASES = ["first_half", "halftime", "second_half", "fulltime", "extra_break", "extra_first_half", "extra_halftime", "extra_second_half", "penalty_shootout"];
  const LABELS = {
    upcoming: "Upcoming",
    first_half: "1st Half",
    halftime: "Half Time",
    second_half: "2nd Half",
    fulltime: "Full Time",
    extra_break: "Break Before Extra",
    extra_first_half: "Extra 1st Half",
    extra_halftime: "Extra Half Time",
    extra_second_half: "Extra 2nd Half",
    penalty_shootout: "Penalty Shootout",
    end_match: "Match Ended"
  };

  function isFinalMatch(m) {
    return !!(m && m.isFinal);
  }

  function finalPhaseText(p) {
    return LABELS[p] || (typeof window.phaseText === "function" ? window.phaseText(p) : "Upcoming");
  }

  const oldIsFullTime = window.isFullTime || (typeof isFullTime === "function" ? isFullTime : null);
  if (oldIsFullTime) {
    window.isFullTime = isFullTime = function (m) {
      if (isFinalMatch(m)) return phase(m.id) === "end_match";
      return oldIsFullTime(m);
    };
  }

  const oldIsLivePhase = window.isLivePhase || (typeof isLivePhase === "function" ? isLivePhase : null);
  if (oldIsLivePhase) {
    window.isLivePhase = isLivePhase = function (p) {
      return oldIsLivePhase(p) || FINAL_LIVE_PHASES.includes(p);
    };
  }

  const oldPhaseText = window.phaseText || (typeof phaseText === "function" ? phaseText : null);
  window.phaseText = phaseText = function (p) {
    return LABELS[p] || oldPhaseText?.(p) || "Upcoming";
  };

  const oldPhaseTimer = window.phaseTimer || (typeof phaseTimer === "function" ? phaseTimer : null);
  if (oldPhaseTimer) {
    window.phaseTimer = phaseTimer = function (id) {
      const p = phase(id);
      const match = typeof matches !== "undefined" ? matches.find((m) => String(m.id) === String(id)) : null;
      if (isFinalMatch(match) && LABELS[p]) return finalPhaseText(p);
      return oldPhaseTimer(id);
    };
  }

  const oldLiveMatch = window.liveMatch || (typeof liveMatch === "function" ? liveMatch : null);
  if (oldLiveMatch) {
    window.liveMatch = liveMatch = function () {
      const st = state();
      const id = st.currentMatchId;
      const m = typeof matches !== "undefined" ? matches.find((x) => String(x.id) === String(id)) : null;
      if (isFinalMatch(m) && FINAL_LIVE_PHASES.includes(phase(m.id))) return m;
      return oldLiveMatch();
    };
  }

  const oldNextUnplayed = window.nextUnplayed || (typeof nextUnplayed === "function" ? nextUnplayed : null);
  if (oldNextUnplayed) {
    window.nextUnplayed = nextUnplayed = function () {
      return matches.find((m) => phase(m.id) === "upcoming") || matches.find((m) => !isFullTime(m));
    };
  }

  const oldUpdateMatchCards = window.updateMatchCards || (typeof updateMatchCards === "function" ? updateMatchCards : null);
  if (oldUpdateMatchCards) {
    window.updateMatchCards = updateMatchCards = function () {
      oldUpdateMatchCards();
      document.querySelectorAll(".match-card[data-match-id]").forEach((card) => {
        const id = card.dataset.matchId;
        const m = typeof matches !== "undefined" ? matches.find((x) => String(x.id) === String(id)) : null;
        if (!isFinalMatch(m)) return;
        const st = state()[id] || {};
        const p = st.phase || "upcoming";
        const status = card.querySelector(".status-pill");
        if (status && LABELS[p]) status.textContent = finalPhaseText(p);
      });
    };
  }
})();
