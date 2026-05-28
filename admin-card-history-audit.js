function historyCardCount(cards) {
  return Object.values(cards || {}).reduce((sum, matchCards) => sum + Object.keys(matchCards || {}).length, 0);
}

function cardSignature(matchId, card) {
  return [
    String(matchId || ""),
    String(card.playerTeam || ""),
    String(card.playerNumber || ""),
    String(card.playerName || ""),
    String(card.cardType || "yellow"),
    String(card.matchTime || ""),
    String(card.phase || "")
  ].join("|").toLowerCase();
}

function flattenCards(cards) {
  const rows = [];
  Object.entries(cards || {}).forEach(([matchId, matchCards]) => {
    Object.entries(matchCards || {}).forEach(([cardId, card]) => {
      rows.push({ matchId, cardId, ...card, sig: cardSignature(matchId, card) });
    });
  });
  return rows;
}

function matchTitleById(matchId) {
  const m = typeof matches !== "undefined" ? matches.find((x) => String(x.id) === String(matchId)) : null;
  return m ? `#${m.id} ${m.home} vs ${m.away}` : `Match #${matchId}`;
}

function formatBackupLabel(id, backup) {
  const reason = backup?.reason ? ` • ${backup.reason}` : "";
  const created = backup?.createdAt ? new Date(backup.createdAt).toLocaleString() : id;
  return `${created}${reason}`;
}

async function readFirebasePath(path) {
  if (!window.goalDiggersDb) return null;
  const snap = await window.goalDiggersDb.ref(path).once("value");
  return snap.val() || {};
}

function ensureCardHistoryPanel() {
  let panel = document.getElementById("cardHistoryAuditPanel");
  if (panel) return panel;
  panel = document.createElement("section");
  panel.id = "cardHistoryAuditPanel";
  panel.className = "admin-card card-history-audit-card";
  const danger = document.querySelector(".danger-zone");
  if (danger?.parentNode) danger.parentNode.insertBefore(panel, danger);
  else document.querySelector(".admin-shell")?.appendChild(panel);
  return panel;
}

function cardHistoryStyles() {
  if (document.getElementById("cardHistoryAuditStyle")) return;
  const style = document.createElement("style");
  style.id = "cardHistoryAuditStyle";
  style.textContent = `
    .card-history-audit-card{border-color:#d6bb72!important;background:linear-gradient(180deg,#fff,#fffaf0)!important}
    .card-history-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px}
    .card-history-head span{display:block;color:#8a6415;font-size:.7rem;font-weight:950;text-transform:uppercase;letter-spacing:.08em}
    .card-history-head h2{margin:3px 0 0;color:#102033;font-size:1.05rem}
    .card-history-actions{display:flex;gap:8px;flex-wrap:wrap}
    .card-history-audit-card p{margin:0 0 10px;color:#64748b;font-size:.78rem;font-weight:750;line-height:1.4}
    .card-history-list{list-style:none;margin:0;padding:0;display:grid;gap:7px}
    .card-history-list li{padding:9px 10px;border-radius:12px;font-size:.78rem;font-weight:800;line-height:1.35;border:1px solid #e8d9aa;background:#fff}
    .card-history-ok{background:#ecfdf5!important;color:#047857!important;border-color:#bbf7d0!important}
    .card-history-warn{background:#fff7ed!important;color:#9a3412!important;border-color:#fed7aa!important}
    .card-history-danger{background:#fef2f2!important;color:#991b1b!important;border-color:#fecaca!important}
    .missing-card-row{display:block;margin-top:5px;color:#1f1330;font-weight:850}
  `;
  document.head.appendChild(style);
}

function renderCardHistoryPanel(status, items = [], bestBackup = null) {
  const panel = ensureCardHistoryPanel();
  const rows = items.length
    ? items.map((x) => `<li class="card-history-${x.level || "warn"}">${x.html || x.text}</li>`).join("")
    : `<li class="card-history-ok">No missing cards found against available backups.</li>`;
  panel.innerHTML = `
    <div class="card-history-head">
      <div><span>Data History Check</span><h2>Cards Audit</h2></div>
      <div class="card-history-actions">
        <button id="scanCardHistoryBtn" class="ghost-btn" type="button">Scan History</button>
        ${bestBackup ? `<button id="mergeMissingCardsBtn" class="primary-btn" type="button">Merge Missing Cards</button>` : ""}
      </div>
    </div>
    <p>${status}</p>
    <ul class="card-history-list">${rows}</ul>
  `;
  document.getElementById("scanCardHistoryBtn")?.addEventListener("click", scanCardHistory);
  document.getElementById("mergeMissingCardsBtn")?.addEventListener("click", () => mergeMissingCardsFromBackup(bestBackup));
}

async function scanCardHistory() {
  cardHistoryStyles();
  renderCardHistoryPanel("Scanning current cards and backup history...", [{ level: "warn", text: "Please wait — checking Firebase backups." }]);

  try {
    if (!window.goalDiggersDb) throw new Error("Firebase is not ready yet. Open admin again or wait a few seconds.");

    const currentCards = await readFirebasePath("cards");
    const history = await readFirebasePath("backups/history");
    const rounds = await readFirebasePath("backups/rounds");
    const latest = await readFirebasePath("backups/latest");

    const backups = [];
    Object.entries(history || {}).forEach(([id, backup]) => backups.push({ id, backup, source: "history" }));
    Object.entries(rounds || {}).forEach(([id, backup]) => backups.push({ id, backup, source: "rounds" }));
    if (latest && Object.keys(latest).length) backups.push({ id: "latest", backup: latest, source: "latest" });

    const currentRows = flattenCards(currentCards);
    const currentSigs = new Set(currentRows.map((x) => x.sig));
    const validBackups = backups
      .filter((b) => b.backup && b.backup.cards)
      .map((b) => ({ ...b, cardCount: historyCardCount(b.backup.cards), rows: flattenCards(b.backup.cards) }))
      .sort((a, b) => b.cardCount - a.cardCount);

    if (!validBackups.length) {
      renderCardHistoryPanel(`Current cards found: ${currentRows.length}. No backup card history found yet.`, [{ level: "warn", text: "No card backups are available to compare." }]);
      return;
    }

    const best = validBackups[0];
    const missing = best.rows.filter((card) => !currentSigs.has(card.sig));
    const items = [
      { level: missing.length ? "warn" : "ok", text: `Current cards: ${currentRows.length}. Best backup: ${best.cardCount} cards (${formatBackupLabel(best.id, best.backup)}).` }
    ];

    if (missing.length) {
      items.push({ level: "danger", text: `${missing.length} card(s) exist in backup history but are missing from current cards.` });
      missing.slice(0, 12).forEach((card) => {
        items.push({
          level: "warn",
          html: `<strong>${card.cardType === "red" ? "Red" : "Yellow"} card</strong> — ${card.playerName || "Unknown Player"} (${card.playerTeam || "Unknown Team"}) <span class="missing-card-row">${matchTitleById(card.matchId)} • ${card.matchTime || "no time"}</span>`
        });
      });
      if (missing.length > 12) items.push({ level: "warn", text: `+ ${missing.length - 12} more missing card(s).` });
      best.missingCards = missing;
      best.currentCards = currentCards;
    }

    renderCardHistoryPanel(
      missing.length ? "I found card data in history that is not in the current live data. Use Merge Missing Cards to add only the missing cards back." : "Current card data matches the largest available backup history.",
      items,
      missing.length ? best : null
    );
  } catch (err) {
    renderCardHistoryPanel("Could not scan card history.", [{ level: "danger", text: err.message || String(err) }]);
  }
}

async function mergeMissingCardsFromBackup(bestBackup) {
  if (!bestBackup?.missingCards?.length || !window.goalDiggersDb) return;
  const ok = confirm(`Merge ${bestBackup.missingCards.length} missing card(s) from backup history into current cards? This will not delete existing cards.`);
  if (!ok) return;

  const updates = {};
  bestBackup.missingCards.forEach((card) => {
    const id = card.cardId || `restored_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const { sig, cardId, ...payload } = card;
    updates[`cards/${card.matchId}/${id}`] = payload;
  });

  await window.goalDiggersDb.ref().update(updates);
  renderCardHistoryPanel("Missing cards merged. Scanning again...", [{ level: "ok", text: "Restore complete. Rechecking data now." }]);
  setTimeout(scanCardHistory, 1200);
}

cardHistoryStyles();
const cardHistoryInit = setInterval(() => {
  if (window.goalDiggersDb) {
    clearInterval(cardHistoryInit);
    scanCardHistory();
  }
}, 800);
setTimeout(() => clearInterval(cardHistoryInit), 20000);
