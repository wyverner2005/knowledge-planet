const query = document.querySelector("#query");
const category = document.querySelector("#category");
const status = document.querySelector("#status");
const cards = Array.from(document.querySelectorAll("#notes li"));
const normalize = (text) => text.normalize("NFKC").toLocaleLowerCase("zh-Hant").replace(/\s/g, "");
const indexedCards = cards.map((card) => {
  const path = card.querySelector("a").getAttribute("href");
  return {
    card,
    categories: card.dataset.categories.split(" "),
    text: normalize(card.textContent + (window.noteIndex?.[path] ?? "")),
  };
});

const initialCategory = new URLSearchParams(window.location.search).get("category");
if (Array.from(category.options).some((option) => option.value === initialCategory)) {
  category.value = initialCategory;
}
category.closest(".category-filter").hidden = false;

function filterNotes() {
  const terms = query.value.trim().split(/\s+/).map(normalize).filter(Boolean);
  let count = 0;
  for (const { card, categories, text } of indexedCards) {
    const matchesCategory = !category.value || categories.includes(category.value);
    const matches = matchesCategory && terms.every((term) => text.includes(term));
    card.hidden = !matches;
    count += Number(matches);
  }
  status.textContent = count ? `${count} 篇筆記` : "找不到符合的筆記";
}

query.addEventListener("input", filterNotes);
category.addEventListener("change", filterNotes);
window.addEventListener("pageshow", filterNotes);
filterNotes();
