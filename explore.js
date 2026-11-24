(() => {
  "use strict";
  const data = window.planetData;
  const $ = (selector) => document.querySelector(selector);
  if (!data?.categories?.length) {
    $("#reading-status").textContent = "星圖暫時無法載入，請到文章總覽閱讀。";
    return;
  }
  const appearance = {
    "endocrinology": { color: "#ddb47a", x: 600, y: 148, ring: true },
    "nutrition": { color: "#b0c89b", x: 1000, y: 185 },
    "rheumatology": { color: "#d69c94", x: 210, y: 780 },
    "geriatrics": { color: "#a4b9a3", x: 176, y: 548 },
    "neurology": { color: "#a4afdc", x: 194, y: 170 },
    "cardiology": { color: "#d68d77", x: 378, y: 305 },
    "infectious-diseases": { color: "#73b8be", x: 1040, y: 500 },
    "sleep-medicine": { color: "#b4a2c9", x: 140, y: 354 },
    "clinical-pharmacology": { color: "#d8bd88", x: 630, y: 475, ring: true },
    "hematology": { color: "#b4828f", x: 570, y: 820 },
    "gastroenterology": { color: "#89b1cd", x: 960, y: 795, ring: true },
  };
  // Additional specialties get a stable slot on an outer ring without editing JS.
  let extraIndex = 0;
  for (const category of data.categories) {
    if (!appearance[category.id]) {
      const angle = extraIndex++ * 2.39996;
      appearance[category.id] = { color: "#9cb8c9", x: 600 + Math.cos(angle) * 510, y: 480 + Math.sin(angle) * 385 };
    }
  }
  const byId = new Map(data.categories.map(category => [category.id, category]));
  const byPath = new Map(data.articles.map(article => [article.path, article]));
  const viewport = $("#map-viewport");
  const world = $("#map-world");
  const nodes = $("#map-nodes");
  const lines = $("#map-lines");
  const query = $("#atlas-query");
  const reading = $("#reading-panel");
  const camera = { x: 0, y: 0, scale: 1, min: .2 };
  const state = { planet: "", topic: "", note: "", query: "", mode: matchMedia("(max-width: 760px)").matches ? "list" : "map" };
  let suppressClick = false;

  const normalize = text => text.normalize("NFKC").toLocaleLowerCase("zh-Hant").replace(/\s/gu, "");
  const matching = article => state.query.trim().split(/\s+/u).filter(Boolean).every(term =>
    normalize([article.title, article.summary, article.topic, ...article.tags,
      ...article.categories.map(id => byId.get(id)?.name + " " + byId.get(id)?.english)].join(" ")).includes(normalize(term)));
  const inPlanet = (article, planet = state.planet) => !planet || article.categories.includes(planet);
  const visibleArticles = () => data.articles.filter(article => matching(article) && inPlanet(article) &&
    (!state.topic || article.topic === state.topic) && (!state.note || article.id === state.note));
  const planetArticles = (id, filtered = true) => data.articles.filter(article => inPlanet(article, id) && (!filtered || matching(article)));
  const topicsFor = id => [...new Set(planetArticles(id).map(article => article.topic))];

  function element(tag, className, text) {
    const result = document.createElement(tag);
    if (className) result.className = className;
    if (text !== undefined) result.textContent = text;
    return result;
  }
  function button(className, text, action) {
    const result = element("button", className, text);
    result.type = "button";
    result.addEventListener("click", event => { if (!suppressClick) action(event); });
    return result;
  }
  function sphere(parent, color, size) {
    const body = element("span", "planet-sphere");
    body.setAttribute("aria-hidden", "true");
    parent.style.setProperty("--planet-color", color);
    body.style.setProperty("--planet-size", `${size}px`);
    parent.append(body);
    return body;
  }
  function readURL() {
    const params = new URLSearchParams(location.search);
    state.query = params.get("q") || "";
    state.planet = byId.has(params.get("planet")) ? params.get("planet") : "";
    state.topic = state.planet && topicsFor(state.planet).includes(params.get("topic")) ? params.get("topic") : "";
    state.note = data.articles.some(article => article.id === params.get("note") && inPlanet(article) &&
      (!state.topic || article.topic === state.topic)) ? params.get("note") : "";
    if (["map", "list"].includes(params.get("view"))) state.mode = params.get("view");
    query.value = state.query;
  }
  function saveURL(replace = false) {
    const url = new URL(location.href);
    const values = { planet: state.planet, topic: state.topic, note: state.note, q: state.query.trim(), view: state.mode };
    for (const [key, value] of Object.entries(values)) value ? url.searchParams.set(key, value) : url.searchParams.delete(key);
    if (url.href !== location.href) history[replace ? "replaceState" : "pushState"](null, "", url);
  }
  function navigate(planet = "", topic = "", note = "") {
    const changePlanet = state.planet !== planet;
    Object.assign(state, { planet, topic, note });
    saveURL();
    render(changePlanet);
  }
  function revealReading() {
    if (matchMedia("(max-width: 1050px)").matches) reading.scrollIntoView({ behavior: "instant", block: "start" });
    reading.focus({ preventScroll: true });
  }

  function renderDirectory() {
    $("#all-count").textContent = data.articles.filter(matching).length;
    $("#all-planets").setAttribute("aria-pressed", String(!state.planet));
    $("#planet-directory").replaceChildren(...data.categories.map(category => {
      const count = planetArticles(category.id).length;
      const item = button("directory-planet" + (count ? "" : " dimmed"), "", () => navigate(category.id));
      item.dataset.planet = category.id;
      item.style.setProperty("--planet-color", appearance[category.id].color);
      item.setAttribute("aria-pressed", String(state.planet === category.id));
      const dot = element("span", "mini-planet");
      dot.setAttribute("aria-hidden", "true");
      item.append(dot, element("span", "", category.name.split("／")[0]), element("span", "planet-count", String(count)));
      return item;
    }));
  }
  function renderBreadcrumbs() {
    const crumbs = [button("", "全部星球", () => navigate())];
    if (state.planet) crumbs.push(element("span", "crumb-separator", "/"), button("", byId.get(state.planet).name.split("／")[0], () => navigate(state.planet)));
    if (state.topic) crumbs.push(element("span", "crumb-separator", "/"), button("", state.topic, () => navigate(state.planet, state.topic)));
    $("#breadcrumbs").replaceChildren(...crumbs);
  }
  function renderArticles() {
    const articles = visibleArticles();
    $("#reading-title").textContent = state.topic || (state.planet ? byId.get(state.planet).name : "星際筆記");
    $("#reading-status").textContent = `${articles.length} 篇筆記${state.query.trim() ? "符合搜尋" : "可探索"}${state.note ? " · 已選文章" : ""}`;
    const topicControls = [];
    if (state.planet) {
      const topicNames = topicsFor(state.planet);
      const all = button("topic-filter", "全部主題", () => navigate(state.planet));
      all.dataset.topic = "";
      all.setAttribute("aria-pressed", String(!state.topic && !state.note));
      topicControls.push(all, ...topicNames.map(topic => {
        const item = button("topic-filter", topic, () => navigate(state.planet, topic));
        item.dataset.topic = topic;
        item.setAttribute("aria-pressed", String(state.topic === topic));
        return item;
      }));
    }
    $("#topic-filters").replaceChildren(...topicControls);
    if (!articles.length) {
      const empty = element("div", "empty-state");
      empty.append(element("p", "", "這個範圍沒有符合的文章。換個關鍵字，或回到全部星球繼續探索。"), button("", "清除篩選", () => {
        state.query = ""; query.value = ""; navigate();
      }));
      $("#article-list").replaceChildren(empty);
      return;
    }
    $("#article-list").replaceChildren(...articles.map(article => {
      const card = element("article", "article-card");
      const heading = element("h3");
      const title = element("a", "", article.title);
      title.href = article.path;
      heading.append(title);
      card.append(element("span", "article-topic", article.topic), heading, element("p", "", article.summary));
      const categories = element("div", "article-categories");
      categories.append(...article.categories.map(id => button("", byId.get(id).name.split("／")[0], () => navigate(id, article.topic))));
      card.append(categories);
      const related = article.related.map(path => byPath.get(path)).filter(Boolean);
      if (related.length) {
        const details = element("details");
        details.append(element("summary", "", `相關閱讀 · ${related.length} 篇`));
        const list = element("ul");
        for (const other of related) {
          const item = element("li");
          const link = element("a", "", other.title);
          link.href = other.path;
          item.append(link); list.append(item);
        }
        details.append(list); card.append(details);
      }
      const open = element("a", "reading-link", "閱讀筆記");
      open.href = article.path;
      open.setAttribute("aria-label", `閱讀筆記：${article.title}`);
      card.append(open);
      return card;
    }));
  }
  function svgNode(tag, attributes) {
    const result = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [key, value] of Object.entries(attributes)) result.setAttribute(key, value);
    return result;
  }
  function crossLines() {
    for (const link of data.links) {
      if (!link.articles.some(id => data.articles.some(article => article.id === id && matching(article)))) continue;
      const a = appearance[link.from], b = appearance[link.to];
      const path = svgNode("path", { d: `M${a.x},${a.y} Q${(a.x + b.x) / 2 + (a.y - b.y) * .12},${(a.y + b.y) / 2 + (b.x - a.x) * .12} ${b.x},${b.y}`, class: "cross-line", "data-from": link.from, "data-to": link.to, "stroke-width": 1 + Math.min(link.articles.length, 5) * .5 });
      const title = svgNode("title", {});
      title.textContent = `${byId.get(link.from).name} × ${byId.get(link.to).name}：${link.articles.length} 篇共同文章`;
      path.append(title); lines.append(path);
    }
  }
  function mapNode(className, x, y, label, action) {
    const node = action ? button("map-node " + className, "", action) : element("div", "map-node " + className);
    node.style.left = `${x}px`; node.style.top = `${y}px`;
    if (action) node.setAttribute("aria-label", label);
    nodes.append(node);
    return node;
  }
  function highlightLinks(id) {
    for (const line of lines.querySelectorAll(".cross-line")) {
      const connected = line.dataset.from === id || line.dataset.to === id;
      line.classList.toggle("active", Boolean(id && connected));
      line.classList.toggle("faded", Boolean(id && !connected));
    }
  }
  function overviewMap() {
    crossLines();
    for (const category of data.categories) {
      const style = appearance[category.id];
      const count = planetArticles(category.id).length;
      const allCount = planetArticles(category.id, false).length;
      const node = mapNode(`planet-node${style.ring ? " ringed" : ""}${count ? "" : " dimmed"}`, style.x, style.y,
        `${category.name}，${count} 篇筆記，探索主題`, () => navigate(category.id));
      sphere(node, style.color, 52 + Math.sqrt(allCount) * 17);
      node.append(element("span", "node-label", category.name.split("／")[0]), element("span", "node-subtitle", `${count} 篇筆記`));
      node.addEventListener("mouseenter", () => highlightLinks(category.id));
      node.addEventListener("mouseleave", () => highlightLinks(""));
      node.addEventListener("focus", () => highlightLinks(category.id));
      node.addEventListener("blur", () => highlightLinks(""));
    }
    $("#map-context").textContent = "點選星球，展開它的主題與筆記。連線代表共同收錄的文章。";
  }
  function focusedMap() {
    const category = byId.get(state.planet);
    const style = appearance[state.planet];
    const topics = topicsFor(state.planet);
    const count = planetArticles(state.planet).length;
    lines.append(svgNode("ellipse", { cx: 600, cy: 465, rx: 367, ry: 300, class: "orbit-line" }),
      svgNode("ellipse", { cx: 600, cy: 465, rx: 450, ry: 370, class: "orbit-line" }));
    const center = mapNode("planet-center" + (style.ring ? " ringed" : ""), 600, 465, category.name);
    sphere(center, style.color, 145);
    center.append(element("span", "node-label", category.name.split("／")[0]), element("span", "node-subtitle", `${topics.length} 個主題 · ${count} 篇筆記`));
    topics.forEach((topic, index) => {
      const angle = -Math.PI / 2 + index * Math.PI * 2 / Math.max(topics.length, 1);
      const x = 600 + Math.cos(angle) * 367, y = 465 + Math.sin(angle) * 300;
      const articles = planetArticles(state.planet).filter(article => article.topic === topic);
      const selected = !state.topic || state.topic === topic;
      const node = mapNode("topic-node" + (selected ? "" : " dimmed"), x, y, `${topic}，${articles.length} 篇筆記`, () => {
        navigate(state.planet, state.topic === topic && !state.note ? "" : topic);
        revealReading();
      });
      sphere(node, style.color, 34 + Math.sqrt(articles.length) * 10);
      node.setAttribute("aria-pressed", String(state.topic === topic));
      node.append(element("span", "node-label", topic), element("span", "node-subtitle", `${articles.length} 篇`));
      articles.forEach((article, articleIndex) => {
        const offsetAngle = angle + (articleIndex - (articles.length - 1) / 2) * .3;
        const px = 600 + Math.cos(offsetAngle) * 465, py = 465 + Math.sin(offsetAngle) * 390;
        lines.append(svgNode("line", { x1: x, y1: y - 18, x2: px, y2: py, class: "moon-line" }));
        const dot = mapNode("article-node" + (selected ? "" : " dimmed"), px, py, `選取文章：${article.title}`, () => {
          navigate(state.planet, topic, article.id); revealReading();
        });
        dot.title = article.title;
        dot.setAttribute("aria-pressed", String(state.note === article.id));
        const marker = element("span"); marker.setAttribute("aria-hidden", "true"); dot.append(marker);
      });
    });
    $("#map-context").textContent = topics.length ? "衛星是主題，方點是文章。點選後，在筆記清單閱讀摘要與關聯。" : "目前沒有符合搜尋的主題。清除關鍵字即可繼續探索。";
  }
  function renderGrid() {
    const children = [];
    if (!state.planet) {
      for (const category of data.categories) {
        const count = planetArticles(category.id).length;
        if (!count && state.query.trim()) continue;
        const style = appearance[category.id];
        const tile = button("planet-tile" + (style.ring ? " ringed" : ""), "", () => navigate(category.id));
        sphere(tile, style.color, 54);
        tile.append(element("strong", "", category.name.split("／")[0]), element("small", "", `${count} 篇筆記`));
        children.push(tile);
      }
    } else {
      for (const topic of topicsFor(state.planet)) {
        const count = planetArticles(state.planet).filter(article => article.topic === topic).length;
        const tile = button("planet-tile", "", () => {
          navigate(state.planet, topic); revealReading();
        });
        sphere(tile, appearance[state.planet].color, 40);
        tile.append(element("strong", "", topic), element("small", "", `${count} 篇筆記`));
        tile.setAttribute("aria-pressed", String(state.topic === topic));
        children.push(tile);
      }
    }
    if (!children.length) children.push(element("p", "empty-state", "沒有符合的星球或主題，請調整搜尋關鍵字。"));
    $("#planet-grid").replaceChildren(...children);
  }
  function applyCamera() {
    world.style.transform = `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`;
    world.style.setProperty("--map-label-size", `${Math.max(25, 14 / camera.scale)}px`);
    world.style.setProperty("--map-subtitle-size", `${Math.max(20, 12 / camera.scale)}px`);
    $("#zoom-in").disabled = camera.scale >= 2;
    $("#zoom-out").disabled = camera.scale <= camera.min + .001;
  }
  function fitCamera() {
    if (viewport.hidden) return;
    camera.min = Math.min((viewport.clientWidth - 20) / 1200, (viewport.clientHeight - 80) / 960, 1);
    camera.scale = camera.min;
    camera.x = (viewport.clientWidth - 1200 * camera.scale) / 2;
    camera.y = (viewport.clientHeight - 960 * camera.scale) / 2 + 8;
    applyCamera();
  }
  function zoom(factor) {
    const old = camera.scale;
    camera.scale = Math.min(2, Math.max(camera.min, camera.scale * factor));
    const cx = viewport.clientWidth / 2, cy = viewport.clientHeight / 2;
    camera.x = cx - (cx - camera.x) * camera.scale / old;
    camera.y = cy - (cy - camera.y) * camera.scale / old;
    applyCamera();
  }
  function setMode(mode, record = true) {
    const wasHidden = viewport.hidden;
    state.mode = mode;
    viewport.hidden = mode !== "map";
    $("#planet-grid").hidden = mode !== "list";
    $("#map-view").setAttribute("aria-pressed", String(mode === "map"));
    $("#list-view").setAttribute("aria-pressed", String(mode === "list"));
    $(".zoom-controls").hidden = mode !== "map";
    $(".connections").hidden = mode !== "map" || Boolean(state.planet);
    $("#map-help").textContent = mode === "map" ? "拖曳移動 · 用按鈕縮放" : "點選星球或主題，展開筆記";
    if (record) saveURL();
    if (mode === "map" && wasHidden) fitCamera();
  }
  function render(resetCamera = false) {
    const previous = document.activeElement;
    const directoryFocus = previous?.closest("#planet-directory") ? previous.dataset.planet : null;
    const topicFocus = previous?.closest("#topic-filters") ? previous.dataset.topic : null;
    renderDirectory(); renderBreadcrumbs(); renderArticles(); renderGrid();
    const focusedLabel = document.activeElement?.closest("#map-nodes") ? document.activeElement.getAttribute("aria-label") : null;
    nodes.replaceChildren(); lines.replaceChildren();
    state.planet ? focusedMap() : overviewMap();
    lines.toggleAttribute("hidden", !state.planet && !$("#show-connections").checked);
    setMode(state.mode, false);
    if (resetCamera) fitCamera();
    if (focusedLabel) {
      const next = [...nodes.querySelectorAll("button")].find(node => node.getAttribute("aria-label") === focusedLabel);
      (next || $("#breadcrumbs button:last-child"))?.focus({ preventScroll: true });
    }
    if (directoryFocus !== null) {
      [...$("#planet-directory").children].find(node => node.dataset.planet === directoryFocus)?.focus({ preventScroll: true });
    }
    if (topicFocus !== null) {
      [...$("#topic-filters").children].find(node => node.dataset.topic === topicFocus)?.focus({ preventScroll: true });
    }
  }

  const census = $("#atlas-census");
  census.innerHTML = `<strong>${data.categories.length}</strong> 顆專科星球　<strong>${data.articles.length}</strong> 篇筆記`;
  $("#all-planets").addEventListener("click", () => navigate());
  $("#map-view").addEventListener("click", () => setMode("map"));
  $("#list-view").addEventListener("click", () => setMode("list"));
  $("#show-connections").addEventListener("change", event => { lines.toggleAttribute("hidden", !event.target.checked); });
  $("#zoom-in").addEventListener("click", () => zoom(1.3));
  $("#zoom-out").addEventListener("click", () => zoom(1 / 1.3));
  $("#zoom-reset").addEventListener("click", fitCamera);
  query.addEventListener("input", () => {
    state.query = query.value; state.note = "";
    if (state.topic && !topicsFor(state.planet).includes(state.topic)) state.topic = "";
    saveURL(true); render();
  });
  let drag = null;
  viewport.addEventListener("pointerdown", event => {
    if (event.button !== 0 || event.target.closest("button")) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, cx: camera.x, cy: camera.y, moved: false };
    viewport.setPointerCapture(event.pointerId);
  });
  viewport.addEventListener("pointermove", event => {
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (Math.hypot(dx, dy) > 5) drag.moved = true;
    if (!drag.moved) return;
    viewport.classList.add("dragging");
    camera.x = drag.cx + dx; camera.y = drag.cy + dy;
    applyCamera();
  });
  function endDrag() {
    if (drag?.moved) { suppressClick = true; setTimeout(() => { suppressClick = false; }, 0); }
    drag = null; viewport.classList.remove("dragging");
  }
  viewport.addEventListener("pointerup", endDrag);
  viewport.addEventListener("pointercancel", endDrag);
  viewport.addEventListener("keydown", event => {
    if (event.target !== viewport) return;
    if (["+", "="].includes(event.key)) zoom(1.3);
    else if (event.key === "-") zoom(1 / 1.3);
    else if (event.key === "0") fitCamera();
    else if (event.key === "Escape") navigate();
    else if (event.key.startsWith("Arrow")) {
      camera.x += event.key === "ArrowLeft" ? 45 : event.key === "ArrowRight" ? -45 : 0;
      camera.y += event.key === "ArrowUp" ? 45 : event.key === "ArrowDown" ? -45 : 0;
      applyCamera();
    } else return;
    event.preventDefault();
  });
  window.addEventListener("popstate", () => { readURL(); render(true); });
  window.addEventListener("pageshow", () => { if (state.mode === "map") fitCamera(); });
  new ResizeObserver(() => { if (state.mode === "map") fitCamera(); }).observe(viewport);
  readURL(); render(true);
})();
