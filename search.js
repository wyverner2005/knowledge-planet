const query = document.querySelector("#query");
const status = document.querySelector("#status");
const cards = Array.from(document.querySelectorAll("#notes li"));
const normalize = (text) => text.normalize("NFKC").toLocaleLowerCase("zh-Hant").replace(/\s/g, "");
const indexedCards = cards.map((card) => {
  const path = card.querySelector("a").getAttribute("href");
  return { card, text: normalize(card.textContent + (window.noteIndex[path] ?? "")) };
});

query.addEventListener("input", () => {
  const terms = query.value.trim().split(/\s+/).map(normalize).filter(Boolean);
  let count = 0;
  for (const { card, text } of indexedCards) {
    const matches = terms.every((term) => text.includes(term));
    card.hidden = !matches;
    count += Number(matches);
  }
  status.textContent = count ? `${count} 篇筆記` : "找不到符合的筆記";
});
