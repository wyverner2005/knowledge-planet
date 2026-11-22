(() => {
  const page = document.documentElement;
  const storageKey = "knowledge-planet-theme";
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
  let preference;

  function syncPreference() {
    try {
      preference = localStorage.getItem(storageKey);
    } catch {
      // The theme is still selectable when storage is unavailable.
    }
    applyTheme();
  }

  function applyTheme() {
    const dark = preference === "dark" ||
      (preference !== "light" && systemTheme.matches);
    page.dataset.theme = dark ? "dark" : "light";
    const button = document.querySelector(".kp-theme-toggle");
    if (button) button.setAttribute("aria-pressed", String(dark));
  }

  syncPreference();
  window.addEventListener("pageshow", syncPreference);
  window.addEventListener("storage", (event) => {
    if (event.key === storageKey || event.key === null) syncPreference();
  });
  systemTheme.addEventListener("change", applyTheme);

  document.addEventListener("DOMContentLoaded", () => {
    const button = document.querySelector(".kp-theme-toggle");
    button.hidden = false;
    applyTheme();
    button.addEventListener("click", () => {
      preference = page.dataset.theme === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(storageKey, preference);
      } catch {
        // Apply the choice on the current page even without storage.
      }
      applyTheme();
    });
  });
})();
