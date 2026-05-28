function isCountableForLiveTable(m) {
  if (!m || m.isFinal) return false;

  const allState = state();
  const st = allState[m.id] || {};
  const p = st.phase || "upcoming";

  if (p === "cancelled") return st.countInTable === true;
  if (p === "fulltime") return true;

  const currentLiveId = allState.currentMatchId;
  const isCurrentMatch = String(currentLiveId || "") === String(m.id);
  return isCurrentMatch && isLivePhase(p);
}

setTimeout(() => {
  if (typeof renderTable === "function") renderTable();
}, 300);
