(() => {
  const tabs = [...document.querySelectorAll('[role="tab"]')];

  function activateTab(active) {
    for (const tab of tabs) {
      const selected = tab === active;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      document.getElementById(tab.getAttribute("aria-controls")).hidden = !selected;
    }
  }

  for (const [index, tab] of tabs.entries()) {
    tab.addEventListener("click", () => activateTab(tab));
    tab.addEventListener("keydown", (event) => {
      const next = {
        ArrowLeft: (index + tabs.length - 1) % tabs.length,
        ArrowRight: (index + 1) % tabs.length,
        Home: 0,
        End: tabs.length - 1,
      }[event.key];
      if (next === undefined) return;
      event.preventDefault();
      activateTab(tabs[next]);
      tabs[next].focus();
    });
  }

  const filters = [...document.querySelectorAll(".eln-btn")];
  const grid = document.getElementById("eln-grid");
  const cards = [...grid.querySelectorAll("[data-risk]")];

  for (const filter of filters) {
    filter.addEventListener("click", () => {
      const risk = filter.dataset.filter;
      grid.classList.toggle("filtered", risk !== "all");
      for (const button of filters) {
        button.setAttribute("aria-pressed", String(button === filter));
      }
      for (const card of cards) card.hidden = risk !== "all" && card.dataset.risk !== risk;
    });
  }
})();
