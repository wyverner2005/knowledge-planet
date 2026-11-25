for (const group of document.querySelectorAll("[data-dx-table]")) {
  const table = document.getElementById(group.dataset.dxTable);
  const rows = [...table.querySelectorAll("tbody tr")];
  const filters = [...group.querySelectorAll("[data-dx-filter]")];

  for (const button of filters) {
    button.addEventListener("click", () => {
      const category = button.dataset.dxFilter;
      for (const row of rows) {
        row.hidden = category !== "all" && !row.dataset.dxCategory.split(" ").includes(category);
      }
      for (const filter of filters) {
        filter.setAttribute("aria-pressed", String(filter === button));
      }
    });
  }
  group.hidden = false;
}
