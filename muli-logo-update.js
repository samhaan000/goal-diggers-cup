// Use the updated Muli Blues logo uploaded to assets.
// Loaded after clean.js so it can safely update the existing team logo map and refresh the UI.
try {
  if (typeof teamLogos !== "undefined") {
    teamLogos["Muli Blues"] = "assets/muli_blues_updated_no_bg.webp";
  }
  if (typeof refreshAll === "function") refreshAll();
} catch (e) {
  console.warn("Muli Blues logo update failed", e);
}

function addFooterSponsorLogos(){
  const footer = document.querySelector(".site-footer");
  if (!footer || document.querySelector(".footer-sponsor-row")) return;

  const sponsors = [
    ["assets/AN.sponsor-01.png", "AN sponsor logo"],
    ["assets/BML.sponsor-01.png", "BML sponsor logo"],
    ["assets/Daimyo.sponsor-01.png", "Daimyo sponsor logo"],
    ["assets/doozi.sponsor-01.png", "Doozi sponsor logo"],
    ["assets/dynamic%20foundation.sponsor-01.png", "Dynamic Foundation sponsor logo"],
    ["assets/police.sponsor-01.png", "Police sponsor logo"],
    ["assets/teddy.sponsor-01.png", "Teddy sponsor logo"],
    ["assets/skate.sponsor-01.png", "Skate sponsor logo"]
  ];

  const row = document.createElement("div");
  row.className = "footer-sponsor-row";
  row.setAttribute("aria-label", "Sponsor logos");

  sponsors.forEach(([src, alt]) => {
    const img = document.createElement("img");
    img.src = src;
    img.alt = alt;
    img.loading = "lazy";
    img.decoding = "async";
    row.appendChild(img);
  });

  footer.appendChild(row);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", addFooterSponsorLogos);
} else {
  addFooterSponsorLogos();
}
