function shortPlayerName(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] || "";
  if (parts.length === 2) return `${parts[0].charAt(0)}.${parts[1]}`;
  return `${parts[0].charAt(0)}.${parts[1]}.${parts[2].charAt(0)}`;
}

function applyShortPlayerNames(root = document) {
  root.querySelectorAll(".match-goals .match-goal-side span, .live-goal-scorers .goal-side span, .stats-list .stats-row strong").forEach((el) => {
    if (el.dataset.shortened === "1") return;

    el.childNodes.forEach((node) => {
      if (node.nodeType !== Node.TEXT_NODE) return;
      const original = node.textContent || "";
      const shortened = original.replace(/#(\d+)\s+([A-Za-z'’\-]+(?:\s+[A-Za-z'’\-]+){1,5})/g, (full, number, name) => {
        return `#${number} ${shortPlayerName(name)}`;
      });
      node.textContent = shortened;
    });

    el.dataset.shortened = "1";
  });
}

const shortNameObserver = new MutationObserver(() => applyShortPlayerNames());
shortNameObserver.observe(document.body, { childList: true, subtree: true });
setInterval(applyShortPlayerNames, 1500);
applyShortPlayerNames();
