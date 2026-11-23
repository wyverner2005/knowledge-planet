"""Rebuild the section index from public article HTML."""
import json
from pathlib import Path

from lxml import html

ROOT = Path(__file__).resolve().parents[1]
HOME = html.parse(str(ROOT / "index.html"), parser=html.HTMLParser(encoding="utf-8"))
HOME_KEYWORDS = {
    link.get("href"): link.get("data-keywords")
    for link in HOME.xpath('//ul[@id="notes"]//a[@href and @data-keywords]')
}


def plain(text):
    return " ".join(text.split())


def article_index(path):
    page = html.document_fromstring(path.read_text(encoding="utf-8"))
    body = page.find("body")
    for node in body.xpath(".//nav | .//script | .//style | .//dialog"):
        node.drop_tree()
    for link in body.xpath('.//a[@download and contains(@href, ".yaml")]'):
        link.drop_tree()
    main = body.xpath(".//main")[0]
    headings = main.xpath(".//h2[not(ancestor::figure)]")
    sections = []
    targets = {}
    ids = {node.get("id") for node in page.xpath("//*[@id]")}
    assigned = set()
    for i, heading in enumerate(headings, 1):
        parent = heading.getparent()
        existing = heading.get("id") or (parent.get("id") if parent.tag == "section" else None)
        anchor = existing if existing not in assigned else None
        if not anchor:
            anchor = f"kp-heading-{i}"
            while anchor in ids or anchor in assigned:
                anchor += "-"
        assigned.add(anchor)
        targets[heading] = anchor

    current = None
    chunks = []

    def flush():
        if current:
            current["text"] = plain(" ".join(chunks))
            sections.append(current)
        chunks.clear()

    def visit(node):
        nonlocal current
        if node in targets:
            flush()
            current = {"id": targets[node], "title": plain(node.text_content())}
        if node.text:
            chunks.append(node.text)
        for child in node:
            if isinstance(child.tag, str):
                visit(child)
            if child.tail:
                chunks.append(child.tail)

    current = {"id": "", "title": "文章開頭"}
    visit(body)
    flush()
    keywords = page.xpath('string(./head/meta[@name="keywords"]/@content)')
    keywords = keywords or HOME_KEYWORDS.get("notes/" + path.name, "")
    tags = [tag.strip() for tag in keywords.split(",") if tag.strip()]
    return {"tags": tags, "sections": sections}


index = {"notes/" + path.name: article_index(path) for path in sorted((ROOT / "notes").glob("*.html"))}
(ROOT / "search-index.js").write_text("window.noteIndex = " + json.dumps(index, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
