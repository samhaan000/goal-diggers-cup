const CUSTOM_EVENT_ICON_SOURCES = {
  ball: ["assets/ball.svg", "assets/ball.png", "assets/ball.webp", "assets/ball"],
  yellow: ["assets/yellow%20card.svg", "assets/yellow card.svg", "assets/yellow%20card.png", "assets/yellow card.png", "assets/yellow%20card.webp", "assets/yellow card.webp", "assets/yellow%20card", "assets/yellow card"],
  red: ["assets/red%20card.svg", "assets/red card.svg", "assets/red%20card.png", "assets/red card.png", "assets/red%20card.webp", "assets/red card.webp", "assets/red%20card", "assets/red card"],
  clean: ["assets/cleansheet-01.svg", "assets/cleansheet-01.png", "assets/cleansheet-01.webp", "assets/cleansheet-01"]
};

function customIconType(el) {
  if (el.classList.contains("ball-icon")) return "ball";
  if (el.classList.contains("yellow-card-icon")) return "yellow";
  if (el.classList.contains("red-card-icon")) return "red";
  if (el.classList.contains("clean-sheet-icon")) return "clean";
  return null;
}

function setIconImage(img, sources, index = 0) {
  if (!sources[index]) return;
  if (img.dataset.currentSrc === sources[index]) return;
  img.dataset.iconIndex = String(index);
  img.dataset.currentSrc = sources[index];
  img.src = sources[index];
}

function replaceEventIcons(root = document) {
  root.querySelectorAll(".event-icon").forEach((icon) => {
    if (icon.dataset.customIconReady === "1") return;
    const type = customIconType(icon);
    const sources = CUSTOM_EVENT_ICON_SOURCES[type];
    if (!sources) return;

    icon.dataset.customIconReady = "1";
    icon.textContent = "";
    icon.setAttribute("aria-hidden", "true");

    const img = document.createElement("img");
    img.className = `custom-event-icon custom-event-icon-${type}`;
    img.alt = "";
    img.decoding = "async";
    img.loading = "lazy";
    img.onerror = () => {
      const next = Number(img.dataset.iconIndex || 0) + 1;
      setIconImage(img, sources, next);
    };

    icon.appendChild(img);
    setIconImage(img, sources, 0);
  });
}

const customIconObserver = new MutationObserver(() => replaceEventIcons());
customIconObserver.observe(document.body, { childList: true, subtree: true });
replaceEventIcons();
