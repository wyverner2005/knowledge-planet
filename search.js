const query = document.querySelector("#query");
const category = document.querySelector("#category");
const status = document.querySelector("#status");
const articleList = document.querySelector("#notes");
const results = document.querySelector("#section-results");

const normalize = (text) => text.normalize("NFKC").toLocaleLowerCase("zh-Hant");
const compact = (text) => normalize(text).replace(/\s/gu, "");
const articles = Array.from(articleList.querySelectorAll("li"), (card) => {
  const path = card.querySelector("a").getAttribute("href");
  const { tags = [], sections = [] } = window.noteIndex?.[path] ?? {};
  return {
    card, path, title: card.querySelector("h2").textContent,
    categories: card.dataset.categories.split(" "),
    metadata: compact(card.textContent + tags.join(" ")),
    sections: sections.map((section) => ({
      ...section, titleText: compact(section.title), bodyText: compact(section.text),
    })),
  };
});

const params = new URLSearchParams(location.search);
const initialCategory = params.get("category");
if (Array.from(category.options).some((option) => option.value === initialCategory)) {
  category.value = initialCategory;
}
query.value = params.get("q") ?? "";
category.closest(".category-filter").hidden = false;

function excerpt(text, terms) {
  const clean = text.trim();
  if (!clean) return "";
  // Keep the offset tied to the visible text even when whitespace is removed.
  let normalized = "";
  const positions = [];
  for (let offset = 0; offset < clean.length;) {
    const char = String.fromCodePoint(clean.codePointAt(offset));
    const fragment = compact(char);
    normalized += fragment;
    for (let i = 0; i < fragment.length; i++) positions.push(offset);
    offset += char.length;
  }
  const hits = terms.map((term) => normalized.indexOf(term)).filter((index) => index >= 0);
  const start = hits.length ? Math.max(0, positions[Math.min(...hits)] - 32) : 0;
  const end = start + 132;
  return (start ? "…" : "") + clean.slice(start, end).trim() + (end < clean.length ? "…" : "");
}

function resultItem({ article, section, label }, terms) {
  const item = document.createElement("li");
  const link = document.createElement("a");
  link.className = "card";
  link.href = article.path + (section?.id ? "#" + encodeURIComponent(section.id) : "");
  const title = document.createElement("span");
  title.className = "tag";
  title.textContent = article.title;
  const heading = document.createElement("h2");
  heading.textContent = section?.title || label;
  const description = document.createElement("p");
  description.className = "summary";
  description.textContent = section ? excerpt(section.text, terms) :
    (article.card.querySelector(".summary")?.textContent ?? "");
  link.append(title, heading, description);
  item.append(link);
  return item;
}

function filterNotes() {
  const terms = query.value.trim().split(/\s+/u).map(compact).filter(Boolean);
  const matches = [];
  let articleCount = 0;
  for (const article of articles) {
    const inCategory = !category.value || article.categories.includes(category.value);
    article.card.hidden = !inCategory;
    if (!inCategory) continue;
    articleCount++;
    if (!terms.length) continue;

    const hits = article.sections.flatMap((section) => {
      const searchable = section.titleText + section.bodyText;
      const direct = terms.filter((term) => searchable.includes(term));
      if (!direct.length || !terms.every((term) => searchable.includes(term) || article.metadata.includes(term))) return [];
      return [{ article, section, score: direct.length * 2 +
        terms.filter((term) => section.titleText.includes(term)).length * 3 }];
    });
    if (hits.length) matches.push(...hits);
    else if (terms.every((term) => article.metadata.includes(term) ||
      article.sections.some((section) => (section.titleText + section.bodyText).includes(term)))) {
      matches.push({ article, label: "文章標題、標籤或多處命中", score: 0 });
    }
  }
  articleList.hidden = terms.length > 0;
  results.hidden = !terms.length;
  const visible = matches.sort((a, b) => b.score - a.score).slice(0, 30);
  results.replaceChildren(...visible.map((match) => resultItem(match, terms)));
  status.textContent = terms.length
    ? (matches.length ? `${matches.length} 筆搜尋結果${matches.length > 30 ? "（顯示前 30 筆）" : ""}` : "找不到符合的筆記")
    : (articleCount ? `${articleCount} 篇筆記` : "找不到符合的筆記");
}

function updateSearch() {
  const url = new URL(location.href);
  for (const [key, value] of [["q", query.value.trim()], ["category", category.value]]) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  history.replaceState(null, "", url);
  filterNotes();
}

query.addEventListener("input", updateSearch);
category.addEventListener("change", updateSearch);
window.addEventListener("pageshow", filterNotes);
filterNotes();
