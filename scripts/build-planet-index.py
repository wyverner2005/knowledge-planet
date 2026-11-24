"""Build the explorable atlas from the published catalog and real article links.

No second catalog to maintain: specialty names, topics and article metadata come
from index.html; related links come only from articles' related-reading sections.
"""
import json
import posixpath
from pathlib import Path
from urllib.parse import unquote, urlsplit

from lxml import html

ROOT = Path(__file__).resolve().parents[1]


def plain(value):
    return " ".join(value.split())


def build():
    home = html.document_fromstring((ROOT / "index.html").read_text(encoding="utf-8"))
    categories = []
    for option in home.xpath('//select[@id="category"]/option[@value!=""]'):
        label = plain(option.text_content())
        zh, _, en = label.partition(" · ")
        categories.append({"id": option.get("value"), "name": zh, "english": en})
    ids = {item["id"] for item in categories}
    articles = []
    for card in home.xpath('//ul[@id="notes"]/li[@data-categories]'):
        link = card.xpath('./a[@href]')[0]
        path = link.get("href")
        file = ROOT / path
        if not file.is_file():
            raise ValueError(f"Missing article: {path}")
        page = html.document_fromstring(file.read_text(encoding="utf-8"))
        tags = page.xpath('string(./head/meta[@name="keywords"]/@content)') or link.get("data-keywords", "")
        cats = card.get("data-categories").split()
        if not cats or set(cats) - ids:
            raise ValueError(f"Unknown specialty for {path}: {cats}")
        related = set()
        for href in page.xpath('//*[contains(concat(" ", normalize-space(@class), " "), " kp-related ")]//a/@href'):
            url = urlsplit(href)
            if not url.scheme and not url.netloc and url.path:
                target = posixpath.normpath(posixpath.join(posixpath.dirname(path), unquote(url.path)))
                if target != path:
                    related.add(target)
        articles.append({
            "id": Path(path).stem,
            "path": path,
            "title": plain(link.xpath('string(.//h2)')),
            "summary": plain(link.xpath('string(.//p[@class="summary"])')),
            "topic": plain(link.xpath('string(.//span[@class="tag"])')) or "醫學筆記",
            "categories": cats,
            "tags": [plain(tag) for tag in tags.split(",") if tag.strip()],
            "related": sorted(related),
        })
    known = {article["path"] for article in articles}
    if len(known) != len(articles):
        raise ValueError("Duplicate article in catalog")
    for article in articles:
        article["related"] = [path for path in article["related"] if path in known]
    # Shared articles define cross-specialty connections; visual proximity has
    # no clinical meaning. An article remains one record even in many planets.
    links = []
    for i, first in enumerate(categories):
        for second in categories[i + 1:]:
            shared = [a["id"] for a in articles if first["id"] in a["categories"] and second["id"] in a["categories"]]
            if shared:
                links.append({"from": first["id"], "to": second["id"], "articles": shared})
    data = {"categories": categories, "articles": articles, "links": links}
    (ROOT / "planet-data.js").write_text(
        "window.planetData = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )
    print(f"Atlas: {len(categories)} planets, {len(articles)} unique articles, {len(links)} shared-article connections")


if __name__ == "__main__":
    build()
