(() => {
  const STATE_KEY = "goal-diggers-cup-2026-admin-state";
  const RUNNING_FINAL_PHASES = ["extra_first_half", "extra_second_half"];
  const FINAL_ACTIVE_PHASES = ["fulltime", "extra_break", "extra_first_half", "extra_halftime", "extra_second_half", "penalty_shootout"];
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
    end_match: "Match Ended",
    cancelled: "Cancelled"
  };

  function readState() {
    try { return JSON.parse(localStorage.getItem(STATE_KEY)) || {}; }
    catch { return {}; }
  }

  function writeState(value) {
    localStorage.setItem(STATE_KEY, JSON.stringify(value || {}));
    if (window.goalDiggersDb) window.goalDiggersDb.ref("state").set(value || {});
  }

  function currentMatchId() {
    return String(window.selectedId || document.getElementById("matchSelect")?.value || "1");
  }

  function currentAdminMatch() {
    const id = currentMatchId();
    return (window.adminMatches || adminMatches || []).find((m) => String(m.id) === id) || null;
  }

  function isGrandFinalSelected() {
    const m = currentAdminMatch();
    return !!(m && m.isFinal);
  }

  function secondsFromInput(value) {
    const raw = String(value || "").trim();
    if (!raw) return 0;
    if (raw.includes(":")) {
      const [min, sec] = raw.split(":").map((v) => Number(v) || 0);
      return Math.max(0, min * 60 + sec);
    }
    return Math.max(0, Math.round((Number(raw) || 0) * 60));
  }

  function pad(n) { return String(Math.max(0, Math.floor(n))).padStart(2, "0"); }
  function formatSeconds(total) {
    const t = Math.max(0, Math.floor(Number(total) || 0));
    return `${pad(t / 60)}:${pad(t % 60)}`;
  }

  function elapsedFor(st) {
    const offset = Number(st.timerOffsetSeconds || 0);
    if (!st.phaseStartedAt || st.timerPaused) return offset;
    if (!RUNNING_FINAL_PHASES.includes(st.phase)) return offset;
    return offset + Math.max(0, (Date.now() - new Date(st.phaseStartedAt).getTime()) / 1000);
  }

  function setFinalPhase(nextPhase) {
    if (!isGrandFinalSelected()) return;
    const all = readState();
    const id = currentMatchId();
    all[id] = all[id] || {};
    const st = all[id];

    if (RUNNING_FINAL_PHASES.includes(nextPhase)) {
      const defaultOffset = Number(st.timerOffsetSeconds || 0);
      const value = prompt(`Start ${LABELS[nextPhase]} timer from what time?\nUse MM:SS or minutes.`, formatSeconds(defaultOffset));
      if (value === null) return;
      st.timerOffsetSeconds = secondsFromInput(value);
      st.phaseStartedAt = new Date().toISOString();
      st.timerPaused = false;
      st.pausedPhase = null;
    } else {
      st.timerOffsetSeconds = elapsedFor(st);
      st.phaseStartedAt = null;
      st.timerPaused = false;
      st.pausedPhase = null;
    }

    st.phase = nextPhase;
    if (nextPhase === "end_match") {
      st.endedAt = new Date().toISOString();
    }
    all.currentMatchId = nextPhase === "end_match" ? null : id;
    writeState(all);
    if (typeof window.render === "function") window.render();
    updateFinalControls();
  }

  function injectFinalControls() {
    const phaseBox = document.querySelector(".phase-buttons");
    if (!phaseBox || document.getElementById("finalExtraPhaseControls")) return;
    const wrap = document.createElement("div");
    wrap.id = "finalExtraPhaseControls";
    wrap.className = "final-extra-phase-controls";
    wrap.innerHTML = `
      <button data-final-phase="extra_break" type="button">Break Before Extra</button>
      <button data-final-phase="extra_first_half" type="button">Extra 1st Half</button>
      <button data-final-phase="extra_halftime" type="button">Extra Half Time</button>
      <button data-final-phase="extra_second_half" type="button">Extra 2nd Half</button>
      <button data-final-phase="penalty_shootout" type="button">Penalty Shootout</button>
      <button data-final-phase="end_match" class="end-match-btn" type="button">End Match</button>
    `;
    phaseBox.insertAdjacentElement("afterend", wrap);
    wrap.querySelectorAll("[data-final-phase]").forEach((btn) => {
      btn.addEventListener("click", () => setFinalPhase(btn.dataset.finalPhase));
    });
  }

  function injectStyles() {
    if (document.getElementById("finalPhaseAdminStyle")) return;
    const style = document.createElement("style");
    style.id = "finalPhaseAdminStyle";
    style.textContent = `
      .final-extra-phase-controls{display:none;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px;padding-top:10px;border-top:1px solid rgba(38,16,47,.08)}
      .final-extra-phase-controls.show{display:grid}
      .final-extra-phase-controls button{min-height:42px;border:0;border-radius:12px;background:#f6ecd0;color:#7c5712;font-size:.72rem;font-weight:950;text-transform:uppercase;letter-spacing:.035em;padding:8px}
      .final-extra-phase-controls button.active{background:#1f1330;color:#fff}
      .final-extra-phase-controls .end-match-btn{grid-column:1/-1;background:#26102f;color:#fff}
      .final-extra-note{margin-top:8px;color:#81788a;font-size:.72rem;font-weight:800;line-height:1.35}
    `;
    document.head.appendChild(style);
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function updateFinalControls() {
    injectFinalControls();
    const wrap = document.getElementById("finalExtraPhaseControls");
    if (!wrap) return;
    const show = isGrandFinalSelected();
    wrap.classList.toggle("show", show);
    const st = readState()[currentMatchId()] || {};
    wrap.querySelectorAll("[data-final-phase]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.finalPhase === st.phase);
    });

    if (show) {
      const label = LABELS[st.phase || "upcoming"] || "Upcoming";
      setText("phaseLabel", label);
      setText("scorePhaseBadge", label);
      setText("currentMatchStatus", label);
    }
  }

  const oldPhaseText = window.phaseText;
  window.phaseText = phaseText = function (p) {
    return LABELS[p] || oldPhaseText?.(p) || "Upcoming";
  };

  const oldFilteredMatches = window.filteredMatches;
  if (typeof oldFilteredMatches === "function") {
    window.filteredMatches = filteredMatches = function () {
      return adminMatches.filter((m) => {
        const p = matchPhase(m.id);
        if (activeAdminFilter === "upcoming") return p === "upcoming";
        if (activeAdminFilter === "progress") return m.isFinal ? FINAL_ACTIVE_PHASES.includes(p) : ["first_half", "halftime", "second_half"].includes(p);
        if (activeAdminFilter === "completed") return m.isFinal ? p === "end_match" : p === "fulltime";
        return true;
      });
    };
  }

  const oldRender = window.render;
  if (typeof oldRender === "function") {
    window.render = render = function () {
      oldRender();
      updateFinalControls();
    };
  }

  injectStyles();
  injectFinalControls();
  updateFinalControls();
  document.getElementById("matchSelect")?.addEventListener("change", () => setTimeout(updateFinalControls, 0));
  document.querySelectorAll(".admin-tab,.mini-nav-btn").forEach((el) => el.addEventListener("click", () => setTimeout(updateFinalControls, 80)));
  setInterval(updateFinalControls, 1000);
})();
