const backupLocalKeys = {
  scores: "goal-diggers-cup-2026-scores",
  state: "goal-diggers-cup-2026-admin-state",
  settings: "goal-diggers-cup-2026-settings",
  goals: "goal-diggers-cup-2026-goals",
  cards: "goal-diggers-cup-2026-cards"
};

const backupFirebasePaths = Object.keys(backupLocalKeys);
let backupTimer = null;
let backupStarted = false;
let lastBackupSignature = "";
let lastBackupAt = 0;

function readBackupLocal(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch {
    return {};
  }
}

function backupStamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function backupFileName() {
  return `goal-diggers-backup-${backupStamp()}.json`;
}

async function collectBackupData() {
  const data = {
    createdAt: new Date().toISOString(),
    source: "Goal Diggers Cup Admin",
    version: "backup-v1",
    scores: {},
    state: {},
    settings: {},
    goals: {},
    cards: {}
  };

  if (window.goalDiggersDb) {
    await Promise.all(
      backupFirebasePaths.map(async (path) => {
        try {
          const snap = await window.goalDiggersDb.ref(path).once("value");
          data[path] = snap.val() || {};
        } catch {
          data[path] = readBackupLocal(backupLocalKeys[path]);
        }
      })
    );
  } else {
    backupFirebasePaths.forEach((path) => {
      data[path] = readBackupLocal(backupLocalKeys[path]);
    });
  }

  return data;
}

function downloadBackupObject(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = backupFileName();
  a.click();
  URL.revokeObjectURL(url);
}

async function saveBackupToFirebase(reason = "manual") {
  if (!window.goalDiggersDb) throw new Error("Firebase is not ready yet.");
  const data = await collectBackupData();
  data.reason = reason;
  data.backupId = backupStamp();

  await window.goalDiggersDb.ref("backups/latest").set(data);
  await window.goalDiggersDb.ref(`backups/history/${data.backupId}`).set(data);
  localStorage.setItem("goal-diggers-cup-2026-last-backup", JSON.stringify({ at: data.createdAt, reason }));
  updateBackupStatus(`Last backup: ${new Date(data.createdAt).toLocaleString()}`);
  return data;
}

function updateBackupStatus(text) {
  const el = document.getElementById("backupStatusText");
  if (el) el.textContent = text;
}

function scheduleAutoBackup(reason = "auto") {
  clearTimeout(backupTimer);
  backupTimer = setTimeout(async () => {
    try {
      const data = await collectBackupData();
      const signature = JSON.stringify({ scores: data.scores, state: data.state, settings: data.settings, goals: data.goals, cards: data.cards });
      const now = Date.now();
      if (signature === lastBackupSignature || now - lastBackupAt < 12000) return;
      lastBackupSignature = signature;
      lastBackupAt = now;
      data.reason = reason;
      data.backupId = backupStamp();
      await window.goalDiggersDb.ref("backups/latest").set(data);
      await window.goalDiggersDb.ref(`backups/history/${data.backupId}`).set(data);
      localStorage.setItem("goal-diggers-cup-2026-last-backup", JSON.stringify({ at: data.createdAt, reason }));
      updateBackupStatus(`Auto backup: ${new Date(data.createdAt).toLocaleTimeString()}`);
    } catch (err) {
      console.warn("Auto backup failed", err);
      updateBackupStatus("Auto backup waiting for Firebase...");
    }
  }, 2500);
}

function startAutoBackupWatch() {
  if (backupStarted || !window.goalDiggersDb) return;
  backupStarted = true;
  backupFirebasePaths.forEach((path) => {
    window.goalDiggersDb.ref(path).on("value", () => scheduleAutoBackup(path));
  });
  scheduleAutoBackup("admin-opened");
}

function insertBackupPanel() {
  if (document.getElementById("backupPanel")) return;
  const danger = document.querySelector(".danger-zone");
  const panel = document.createElement("section");
  panel.id = "backupPanel";
  panel.className = "admin-card backup-card";
  panel.innerHTML = `
    <div class="backup-head">
      <div>
        <span>Data Backup</span>
        <h2>Protect Tournament Data</h2>
      </div>
      <strong id="backupStatusText">Auto backup ready</strong>
    </div>
    <p>Backs up scores, match status, settings, goals, and cards to Firebase. You can also download a JSON copy to your phone.</p>
    <div class="backup-actions">
      <button id="manualFirebaseBackupBtn" class="primary-btn" type="button">Save Backup Now</button>
      <button id="downloadBackupBtn" class="ghost-btn" type="button">Download JSON</button>
    </div>
  `;

  if (danger?.parentNode) danger.parentNode.insertBefore(panel, danger);
  else document.querySelector(".admin-shell")?.appendChild(panel);

  document.getElementById("manualFirebaseBackupBtn")?.addEventListener("click", async () => {
    const btn = document.getElementById("manualFirebaseBackupBtn");
    try {
      btn.textContent = "Saving...";
      await saveBackupToFirebase("manual");
      btn.textContent = "Saved";
      setTimeout(() => (btn.textContent = "Save Backup Now"), 1200);
    } catch (err) {
      console.error(err);
      alert("Could not save backup yet. Try again after Firebase loads.");
      btn.textContent = "Save Backup Now";
    }
  });

  document.getElementById("downloadBackupBtn")?.addEventListener("click", async () => {
    const data = await collectBackupData();
    downloadBackupObject(data);
  });
}

insertBackupPanel();
const backupInit = setInterval(() => {
  if (window.goalDiggersDb) {
    clearInterval(backupInit);
    startAutoBackupWatch();
  }
}, 800);
setTimeout(() => clearInterval(backupInit), 15000);
