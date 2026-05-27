function makeBackupPanelDropdown() {
  const panel = document.getElementById("backupPanel");
  if (!panel || panel.tagName.toLowerCase() === "details" || panel.dataset.dropdownReady === "1") return;

  const title = panel.querySelector(".backup-head h2")?.textContent || "Data Backup & Export";
  const status = panel.querySelector("#backupStatusText")?.textContent || "Auto backup ready";
  const content = panel.innerHTML;

  const details = document.createElement("details");
  details.id = "backupPanel";
  details.className = "admin-card backup-card backup-details";
  details.dataset.dropdownReady = "1";
  details.innerHTML = `
    <summary class="backup-summary">
      <span>
        <small>Data Section</small>
        <strong>${title}</strong>
      </span>
      <em id="backupStatusText">${status}</em>
    </summary>
    <div class="backup-details-body">${content}</div>
  `;

  panel.replaceWith(details);
}

function injectBackupDropdownStyle() {
  if (document.getElementById("backupDropdownStyle")) return;
  const style = document.createElement("style");
  style.id = "backupDropdownStyle";
  style.textContent = `
    .backup-details{padding:0!important;overflow:hidden;border-color:#bfdbfe!important;background:linear-gradient(180deg,#fff,#f8fbff)!important}
    .backup-details[open]{padding-bottom:14px!important}
    .backup-summary{list-style:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 16px;background:linear-gradient(180deg,#ffffff,#eff6ff);border-radius:inherit;color:#102033}
    .backup-summary::-webkit-details-marker{display:none}
    .backup-summary span{display:grid;gap:3px;min-width:0}
    .backup-summary small{font-size:.68rem;font-weight:950;text-transform:uppercase;letter-spacing:.07em;color:#1d4ed8}
    .backup-summary strong{font-size:1rem;font-weight:950;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .backup-summary em{font-style:normal;padding:6px 9px;border-radius:999px;background:#dbeafe;border:1px solid #bfdbfe;color:#1d4ed8;font-size:.64rem;font-weight:950;white-space:nowrap}
    .backup-summary:after{content:"⌄";font-size:1.25rem;font-weight:950;color:#1d4ed8;transition:transform .2s ease}
    .backup-details[open] .backup-summary:after{transform:rotate(180deg)}
    .backup-details-body{padding:0 16px 2px}
    .backup-details-body>.backup-head{display:none!important}
    .backup-details-body p{margin:12px 0;color:#64748b;font-size:.8rem;font-weight:750;line-height:1.4}
    .backup-actions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important;margin-top:10px!important}
    @media(max-width:540px){.backup-summary{padding:14px}.backup-summary{align-items:flex-start}.backup-summary em{max-width:135px;white-space:normal;text-align:right}.backup-actions{grid-template-columns:1fr!important}}
  `;
  document.head.appendChild(style);
}

injectBackupDropdownStyle();
const backupDropdownWatcher = setInterval(() => {
  makeBackupPanelDropdown();
  if (document.getElementById("backupPanel")?.dataset.dropdownReady === "1") clearInterval(backupDropdownWatcher);
}, 300);
setTimeout(() => clearInterval(backupDropdownWatcher), 8000);
