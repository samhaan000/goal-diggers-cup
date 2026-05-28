const ADMIN_PASSCODE = "2605";
const ADMIN_UNLOCK_KEY = "goal-diggers-admin-unlocked";

function injectAdminControlPanelStyles() {
  if (document.getElementById("adminControlPanelStyles")) return;
  const link = document.createElement("link");
  link.id = "adminControlPanelStyles";
  link.rel = "stylesheet";
  link.href = "admin-control-panel.css?v=control-panel-1";
  document.head.appendChild(link);
}

function loadAdminUtilityScript(src, id) {
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.src = src;
  document.body.appendChild(script);
}

function loadUnlockedAdminUtilities() {
  loadAdminUtilityScript("admin-card-history-audit.js?v=card-history-audit-1", "adminCardHistoryAuditScript");
}

injectAdminControlPanelStyles();

function isAdminUnlocked() {
  return sessionStorage.getItem(ADMIN_UNLOCK_KEY) === "yes";
}

function buildAdminLock() {
  if (isAdminUnlocked()) return;
  document.body.classList.add("admin-locked");

  const screen = document.createElement("div");
  screen.id = "adminLockScreen";
  screen.className = "admin-lock-screen";
  screen.innerHTML = `
    <div class="admin-lock-card">
      <span class="admin-lock-badge">Secure Admin</span>
      <h1>Admin Access</h1>
      <p>Enter the tournament admin passcode to control scores, match phases, scorers, and live settings.</p>
      <form id="adminLockForm" class="admin-lock-form">
        <input id="adminPasscode" class="admin-lock-input" type="password" inputmode="numeric" autocomplete="off" placeholder="Enter passcode" />
        <button class="admin-lock-btn" type="submit">Unlock Admin</button>
        <div id="adminLockError" class="admin-lock-error"></div>
      </form>
      <small class="admin-lock-hint">This is a front-end lock for quick protection. Full security should use Firebase Auth and database rules later.</small>
    </div>
  `;
  document.body.prepend(screen);

  const input = document.getElementById("adminPasscode");
  const error = document.getElementById("adminLockError");
  const form = document.getElementById("adminLockForm");

  setTimeout(() => input?.focus(), 200);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (input.value.trim() === ADMIN_PASSCODE) {
      sessionStorage.setItem(ADMIN_UNLOCK_KEY, "yes");
      document.body.classList.remove("admin-locked");
      screen.remove();
      addLockButton();
      loadUnlockedAdminUtilities();
      return;
    }
    error.textContent = "Wrong passcode. Try again.";
    input.value = "";
    input.focus();
  });
}

function addLockButton() {
  if (document.getElementById("adminLockButton")) return;
  const btn = document.createElement("button");
  btn.id = "adminLockButton";
  btn.className = "admin-lock-button";
  btn.type = "button";
  btn.textContent = "Lock Admin";
  btn.addEventListener("click", () => {
    sessionStorage.removeItem(ADMIN_UNLOCK_KEY);
    location.reload();
  });
  document.body.appendChild(btn);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    buildAdminLock();
    if (isAdminUnlocked()) {
      addLockButton();
      loadUnlockedAdminUtilities();
    }
  });
} else {
  buildAdminLock();
  if (isAdminUnlocked()) {
    addLockButton();
    loadUnlockedAdminUtilities();
  }
}
