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
