(() => {
  const STATE_KEY = "goal-diggers-cup-2026-admin-state";
  const SCORE_KEY = "goal-diggers-cup-2026-scores";
  const SECOND_HALF_START_SECONDS = 6 * 60;
  let timerInterval = null;

  const phaseLabels = {
    upcoming: "Upcoming",
    first_half: "1st Half",
    halftime: "Half Time",
    second_half: "2nd Half",
    fulltime: "Full Time",
    paused: "Paused",
    cancelled: "Cancelled"
  };

  function readJson(key, fallback = {}) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch { return fallback; }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value || {}));
    if (window.goalDiggersDb) {
      const path = key === STATE_KEY ? "state" : key === SCORE_KEY ? "scores" : null;
      if (path) window.goalDiggersDb.ref(path).set(value || {});
    }
  }

  function selectedMatchId() {
    const select = document.getElementById("matchSelect");
    return select?.value || "1";
  }

  function currentState() {
    const all = readJson(STATE_KEY, {});
    const id = selectedMatchId();
    all[id] = all[id] || {};
    return { all, id, st: all[id] };
  }

  function pad(n) { return String(Math.max(0, Math.floor(n))).padStart(2, "0"); }

  function formatSeconds(total) {
    const t = Math.max(0, Math.floor(Number(total) || 0));
    return `${pad(t / 60)}:${pad(t % 60)}`;
  }

  function secondsFromInput(value) {
    const raw = String(value || "").trim();
    if (!raw) return 0;
    if (raw.includes(":")) {
      const [m, s] = raw.split(":").map((v) => Number(v) || 0);
      return Math.max(0, m * 60 + s);
    }
    return Math.max(0, Math.round((Number(raw) || 0) * 60));
  }

  function defaultStartSecondsForPhase(phase, st) {
    if (phase === "second_half") return SECOND_HALF_START_SECONDS;
    return Number(st.timerOffsetSeconds || 0);
  }

  function elapsedFor(st) {
    const offset = Number(st.timerOffsetSeconds || 0);
    if (!st.phaseStartedAt || st.timerPaused) return offset;
    if (!["first_half", "second_half"].includes(st.phase)) return offset;
    return offset + Math.max(0, (Date.now() - new Date(st.phaseStartedAt).getTime()) / 1000);
  }

  function timerText(st) {
    if (st.phase === "cancelled") return "Cancelled";
    if (st.timerPaused) return `Paused • ${phaseLabels[st.pausedPhase || st.phase] || "Match"} • ${formatSeconds(st.timerOffsetSeconds || 0)}`;
    if (st.phase === "first_half" || st.phase === "second_half") return `${phaseLabels[st.phase]} • ${formatSeconds(elapsedFor(st))}`;
    return phaseLabels[st.phase || "upcoming"] || "Upcoming";
  }

  function syncScoreboardTimer() {
    const { st } = currentState();
    const timer = document.getElementById("adminTimerDisplay");
    const scoreBadge = document.getElementById("scorePhaseBadge");
    const phaseLabel = document.getElementById("phaseLabel");
    const currentStatus = document.getElementById("currentMatchStatus");
    const text = timerText(st);
    [timer, scoreBadge, phaseLabel, currentStatus].forEach((el) => {
      if (!el) return;
      el.textContent = text;
      el.classList.toggle("paused-admin-badge", !!st.timerPaused);
      el.classList.toggle("cancelled-admin-badge", st.phase === "cancelled");
    });
  }

  function patchSetPhaseButtons() {
    document.querySelectorAll(".phase-buttons [data-phase]").forEach((btn) => {
      btn.addEventListener("click", () => {
        setTimeout(() => {
          const { all, id, st } = currentState();
          const phase = btn.dataset.phase;
          const wasCancelled = st.phase === "cancelled";
          if (["first_half", "second_half"].includes(phase)) {
            if (st.phase === "fulltime" || wasCancelled) {
              const keep = confirm(`Resume ${phaseLabels[phase]}?\n\nYou can set the timer start point next. Press OK to continue.`);
              if (!keep) return;
            }
            const defaultOffset = defaultStartSecondsForPhase(phase, st);
            const value = prompt(`Start ${phaseLabels[phase]} timer from what time?\nUse MM:SS or minutes.`, formatSeconds(defaultOffset));
            if (value === null) return;
            st.timerOffsetSeconds = secondsFromInput(value);
            st.phaseStartedAt = new Date().toISOString();
            st.timerPaused = false;
            st.pausedPhase = null;
            st.phase = phase;
          }
          if (phase === "halftime" || phase === "fulltime") {
            st.timerOffsetSeconds = elapsedFor(st);
            st.timerPaused = false;
            st.pausedPhase = null;
            st.phase = phase;
          }
          all.currentMatchId = id;
          writeJson(STATE_KEY, all);
          if (typeof window.render === "function") window.render();
          syncScoreboardTimer();
        }, 30);
      }, true);
    });
  }

  function pauseMatch() {
    const { all, id, st } = currentState();
    if (!["first_half", "second_half"].includes(st.phase) || st.timerPaused) {
      alert("Only a running 1st Half or 2nd Half timer can be paused.");
      return;
    }
    st.timerOffsetSeconds = elapsedFor(st);
    st.timerPaused = true;
    st.pausedPhase = st.phase;
    st.phaseStartedAt = null;
    all.currentMatchId = id;
    writeJson(STATE_KEY, all);
    if (typeof window.render === "function") window.render();
    syncScoreboardTimer();
  }

  function resumeMatch() {
    const { all, id, st } = currentState();
    const phase = st.pausedPhase || st.phase;
    if (!st.timerPaused || !["first_half", "second_half"].includes(phase)) {
      alert("No paused running timer found for this match.");
      return;
    }
    const defaultOffset = phase === "second_half" ? Math.max(SECOND_HALF_START_SECONDS, Number(st.timerOffsetSeconds || 0)) : Number(st.timerOffsetSeconds || 0);
    const value = prompt("Resume timer from what time?\nUse MM:SS or minutes.", formatSeconds(defaultOffset));
    if (value === null) return;
    st.timerOffsetSeconds = secondsFromInput(value);
    st.phase = phase;
    st.timerPaused = false;
    st.pausedPhase = null;
    st.phaseStartedAt = new Date().toISOString();
    all.currentMatchId = id;
    writeJson(STATE_KEY, all);
    if (typeof window.render === "function") window.render();
    syncScoreboardTimer();
  }

  function adjustTimer() {
    const { all, id, st } = currentState();
    const value = prompt("Set match timer to what time?\nUse MM:SS or minutes.", formatSeconds(elapsedFor(st)));
    if (value === null) return;
    st.timerOffsetSeconds = secondsFromInput(value);
    if (["first_half", "second_half"].includes(st.phase) && !st.timerPaused) st.phaseStartedAt = new Date().toISOString();
    all.currentMatchId = id;
    writeJson(STATE_KEY, all);
    if (typeof window.render === "function") window.render();
    syncScoreboardTimer();
  }

  function setAwardedScore(home, away) {
    const id = selectedMatchId();
    const scores = readJson(SCORE_KEY, {});
    scores[id] = { home: String(Math.max(0, Number(home) || 0)), away: String(Math.max(0, Number(away) || 0)) };
    writeJson(SCORE_KEY, scores);
  }

  function showDecisionModal() {
    const { all, id, st } = currentState();
    const scores = readJson(SCORE_KEY, {})[id] || { home: "0", away: "0" };
    const modal = document.createElement("div");
    modal.className = "match-decision-modal";
    modal.innerHTML = `
      <div class="match-decision-panel" role="dialog" aria-modal="true">
        <h3>Match Decision</h3>
        <p>Use this for cancelled, abandoned, postponed, or awarded-result situations.</p>
        <div class="decision-grid">
          <label>Decision Type
            <select id="decisionType">
              <option value="cancelled">Cancelled</option>
              <option value="abandoned">Abandoned</option>
              <option value="postponed">Postponed / Replay Later</option>
              <option value="awarded">Awarded Result</option>
            </select>
          </label>
          <label>Reason
            <input id="decisionReason" type="text" placeholder="Weather, injury, dispute, technical issue..." value="${st.cancellationReason || ""}">
          </label>
          <label>Public Note
            <textarea id="decisionNote" placeholder="Example: Match cancelled due to rain. Result awarded according to tournament rules.">${st.publicNote || ""}</textarea>
          </label>
          <div class="decision-score-row">
            <label>Home Score
              <input id="decisionHomeScore" type="number" min="0" value="${scores.home || 0}">
            </label>
            <label>Away Score
              <input id="decisionAwayScore" type="number" min="0" value="${scores.away || 0}">
            </label>
          </div>
          <label class="decision-check-row"><input id="decisionCountTable" type="checkbox" ${st.countInTable ? "checked" : ""}> Count this result in league table</label>
        </div>
        <div class="match-decision-note">If the match is only postponed/replay later, leave “Count this result” unticked.</div>
        <div class="decision-actions">
          <button class="cancel-decision" type="button">Close</button>
          <button class="save-decision" type="button">Save Decision</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector(".cancel-decision").addEventListener("click", () => modal.remove());
    modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); });
    modal.querySelector(".save-decision").addEventListener("click", () => {
      const type = modal.querySelector("#decisionType").value;
      const reason = modal.querySelector("#decisionReason").value.trim();
      const note = modal.querySelector("#decisionNote").value.trim();
      const home = modal.querySelector("#decisionHomeScore").value;
      const away = modal.querySelector("#decisionAwayScore").value;
      const count = modal.querySelector("#decisionCountTable").checked;
      if (!confirm(`Save match decision as ${type.toUpperCase()}?`)) return;
      st.phase = type === "awarded" ? "fulltime" : "cancelled";
      st.decisionType = type;
      st.cancellationReason = reason;
      st.publicNote = note;
      st.awardedResult = type === "awarded" || count;
      st.countInTable = count;
      st.timerPaused = false;
      st.phaseStartedAt = null;
      st.timerOffsetSeconds = elapsedFor(st);
      all.currentMatchId = id;
      writeJson(STATE_KEY, all);
      setAwardedScore(home, away);
      modal.remove();
      if (typeof window.render === "function") window.render();
      syncScoreboardTimer();
    });
  }

  function attach() {
    document.getElementById("pauseMatchBtn")?.addEventListener("click", pauseMatch);
    document.getElementById("resumeMatchBtn")?.addEventListener("click", resumeMatch);
    document.getElementById("adjustTimerBtn")?.addEventListener("click", adjustTimer);
    document.getElementById("matchDecisionBtn")?.addEventListener("click", showDecisionModal);
    patchSetPhaseButtons();
    clearInterval(timerInterval);
    timerInterval = setInterval(syncScoreboardTimer, 1000);
    syncScoreboardTimer();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", attach);
  else attach();
})();