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
    if (button) {
      button.textContent = dark ? "淺色模式" : "深色模式";
      // The button label describes the next action.
      button.removeAttribute("aria-pressed");
    }
  }

  function enableImageViewer() {
    const graphics = document.querySelectorAll(
      ".kp-cover > img, .kp-note img, .kp-note :is(main, header) svg[viewBox]:not(svg svg)"
    );
    if (!graphics.length) return;

    const dialog = document.createElement("dialog");
    dialog.className = "kp-image-viewer";
    dialog.setAttribute("aria-label", "圖片放大檢視");
    dialog.innerHTML = `
      <div class="kp-image-toolbar">
        <div class="kp-image-zoom" role="group" aria-label="圖片縮放">
          <button class="kp-control" type="button" data-zoom="out" aria-label="縮小圖片">−</button>
          <button class="kp-control" type="button" data-zoom="fit" aria-label="縮回適合畫面的大小">適合畫面</button>
          <button class="kp-control" type="button" data-zoom="in" aria-label="放大圖片">＋</button>
        </div>
        <form method="dialog"><button class="kp-control" autofocus>關閉</button></form>
      </div>
      <div class="kp-image-scroll" role="region" aria-label="可捲動的放大圖片" tabindex="0">
        <div class="kp-image-stage"></div>
      </div>`;
    document.body.append(dialog);

    const viewport = dialog.querySelector(".kp-image-scroll");
    const stage = dialog.querySelector(".kp-image-stage");
    const zoomOut = dialog.querySelector('[data-zoom="out"]');
    const zoomIn = dialog.querySelector('[data-zoom="in"]');
    const fit = dialog.querySelector('[data-zoom="fit"]');
    const zoomLevels = [1, 1.5, 2, 3, 4, 6, 8];
    let zoom = 0;
    let trigger;
    let preview;
    let aspectRatio;

    function renderZoom(nextZoom) {
      const ratio = zoomLevels[nextZoom] / zoomLevels[zoom];
      const centerX = viewport.scrollLeft + viewport.clientWidth / 2;
      const centerY = viewport.scrollTop + viewport.clientHeight / 2;
      zoom = nextZoom;
      const bounds = getComputedStyle(stage);
      const width = viewport.clientWidth - parseFloat(bounds.paddingLeft) - parseFloat(bounds.paddingRight);
      const height = viewport.clientHeight - parseFloat(bounds.paddingTop) - parseFloat(bounds.paddingBottom);
      preview.style.width = `${Math.min(width, height * aspectRatio) * zoomLevels[zoom]}px`;
      zoomOut.disabled = zoom === 0;
      zoomIn.disabled = zoom === zoomLevels.length - 1;
      fit.textContent = zoom === 0 ? "適合畫面" : `${zoomLevels[zoom] * 100}%`;
      viewport.scrollTo(
        zoom ? centerX * ratio - viewport.clientWidth / 2 : 0,
        zoom ? centerY * ratio - viewport.clientHeight / 2 : 0
      );
    }

    function openImage(graphic, clickedButton) {
      trigger = clickedButton;
      preview = graphic.cloneNode(true);
      preview.classList.add("kp-image-preview");
      stage.replaceChildren(preview);
      zoom = 0;

      if (graphic instanceof HTMLImageElement) {
        preview.loading = "eager";
        aspectRatio = (graphic.naturalWidth / graphic.naturalHeight) || 1;
        preview.addEventListener("load", () => {
          if (dialog.open && stage.contains(preview)) {
            aspectRatio = preview.naturalWidth / preview.naturalHeight;
            renderZoom(zoom);
          }
        }, { once: true });
      } else {
        const { width, height } = graphic.viewBox.baseVal;
        aspectRatio = width / height || 1;
      }

      dialog.showModal();
      page.classList.add("kp-viewing-image");
      renderZoom(0);
    }

    for (const graphic of graphics) {
      if (graphic.closest("button, a")) continue;
      const title = graphic.getAttribute("alt") || graphic.getAttribute("aria-label") ||
        graphic.querySelector("title")?.textContent || "圖表";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "kp-image-trigger";
      button.title = "點擊放大";
      button.setAttribute("aria-label", `放大圖片：${title}`);
      button.setAttribute("aria-haspopup", "dialog");
      button.addEventListener("click", () => openImage(graphic, button));
      graphic.before(button);
      button.append(graphic);
    }

    zoomOut.addEventListener("click", () => renderZoom(zoom - 1));
    zoomIn.addEventListener("click", () => renderZoom(zoom + 1));
    fit.addEventListener("click", () => renderZoom(0));
    window.addEventListener("resize", () => {
      if (dialog.open) renderZoom(zoom);
    });
    dialog.addEventListener("close", () => {
      page.classList.remove("kp-viewing-image");
      stage.replaceChildren();
      trigger.focus({ preventScroll: true });
    });
  }

  syncPreference();
  window.addEventListener("pageshow", syncPreference);
  window.addEventListener("storage", (event) => {
    if (event.key === storageKey || event.key === null) syncPreference();
  });
  systemTheme.addEventListener("change", applyTheme);

  // Each article can keep its own opening metrics or choose a compact guide layout.
  const articleGuides = {
    "adult-insomnia-pharmacotherapy": ["steps", [0, "先確認診斷與第一線治療"], [1, "依失眠型態選藥"], [7, "檢視換藥與減量"]],
    "baloxavir-vs-oseltamivir": ["compare", [2, "病毒清除"], [3, "症狀緩解"], [7, "重度免疫低下"]],
    "capvaxive-pcv21": ["cards", [2, "核准適應症"], [3, "台灣公費資格"], [4, "STRIDE 臨床實證"]],
    "cgvhd-manifestations-and-diagnosis": ["steps", [1, "辨識器官症狀"], [2, "比對 NIH 診斷分類"], [3, "評估嚴重度"]],
    "cgvhd-treatment-and-targeted-evidence": ["steps", [0, "確認嚴重度"], [2, "評估類固醇與減量"], [3, "查閱後線標靶"]],
    "hba1c-and-glucose-variability": ["cards", [0, "血糖 CV 門檻"], [2, "飲食、運動與作息"], [3, "門診監測工具"]],
    "inclisiran-nhi-coverage": ["steps", [0, "核對申請資格"], [1, "安排注射時程"], [2, "確認續用條件"]],
    "nhi-hepatitis-c-daa-coverage-2026-12": ["steps", [0, "先看新規重點"], [1, "比對修訂條文"], [4, "檢視臨床選藥"]],
    "nhi-lipid-lowering-coverage-2026-12": ["compare", [0, "異動品項與支付價"], [2, "ASCVD 門檻"], [3, "複方給付"]],
  };

  function applyArticleDesign(main, headings, hashes) {
    const title = document.querySelector("h1");
    const hero = title?.closest("header, .hero");
    if (hero) {
      hero.classList.add("kp-note-hero");
      const ownGuide = hero.querySelector(".dx-quick, .tri-strip, .grid-cols-2");
      const leadMetrics = hero.nextElementSibling;
      if (leadMetrics?.matches(".verdict-strip, .kpi-strip, .triad")) {
        leadMetrics.classList.add("kp-note-metrics");
        hero.append(leadMetrics);
      } else if (!ownGuide) {
        const slug = location.pathname.split("/").pop().replace(/\.html$/, "");
        const [layout, ...topics] = articleGuides[slug] ?? ["cards",
          ...headings.slice(0, 3).map((heading, index) => [index, heading.textContent.trim()])];
        const guide = document.createElement("nav");
        guide.className = "kp-note-guide";
        guide.dataset.layout = hero.dataset.guideLayout || layout;
        guide.setAttribute("aria-label", "文章重點");
        for (const [index, label] of topics) {
          if (!hashes[index]) continue;
          const link = document.createElement("a");
          link.href = "#" + encodeURIComponent(hashes[index]);
          link.textContent = label;
          guide.append(link);
        }
        if (guide.childElementCount) hero.append(guide);
      }
    }

    for (const heading of headings) {
      const section = heading.closest("section");
      if (section && !section.matches(".kp-related, .dx-card")) section.classList.add("kp-note-section");
    }

    for (const table of main.querySelectorAll("table")) {
      const next = table.parentElement;
      const frame = /auto|scroll/.test(getComputedStyle(next).overflowX) ? next : document.createElement("div");
      if (frame !== next) {
        table.before(frame);
        frame.append(table);
      }
      frame.classList.add("kp-note-table");
      if (!frame.hasAttribute("tabindex")) frame.tabIndex = 0;
      if (!frame.hasAttribute("aria-label")) {
        frame.setAttribute("aria-label", "臨床資料表，可左右滑動");
        frame.setAttribute("role", "region");
      }
    }
  }

  function addArticleContents() {
    const main = document.querySelector(".kp-note main");
    if (!main) return;
    const headings = [...main.querySelectorAll("h2")].filter(heading => !heading.closest("nav, figure"));
    if (!headings.length) return;
    const ids = new Set([...document.querySelectorAll("[id]")].map(node => node.id));
    const assigned = new Set();
    const hashes = headings.map((heading, index) => {
      let id = heading.id || (heading.parentElement.matches("section") && heading.parentElement.id);
      if (!id || assigned.has(id)) {
        id = "kp-heading-" + (index + 1);
        while (ids.has(id) || assigned.has(id)) id += "-";
        heading.id = id;
      }
      assigned.add(id);
      return id;
    });
    applyArticleDesign(main, headings, hashes);
    const existing = document.querySelector(".kp-note .toc");
    if (existing) {
      existing.setAttribute("aria-label", "文章目錄");
    } else {
      const columns = document.createElement("div");
      columns.className = "kp-article-columns";
      const contents = document.createElement("nav");
      contents.className = "kp-article-toc";
      contents.setAttribute("aria-label", "文章目錄");
      const title = document.createElement("div");
      title.className = "kp-article-toc-title";
      title.textContent = "文章目錄";
      const list = document.createElement("ul");
      headings.forEach((heading, index) => {
        const item = document.createElement("li");
        const link = document.createElement("a");
        link.href = "#" + encodeURIComponent(hashes[index]);
        link.textContent = heading.textContent.trim();
        item.append(link);
        list.append(item);
      });
      contents.append(title, list);
      columns.append(contents);

      // Keep the introduction across the full width, above both columns.
      const header = main.querySelector(":scope > header");
      if (header) {
        const articleBody = document.createElement("div");
        const bodyNodes = [...main.childNodes];
        articleBody.append(...bodyNodes.slice(bodyNodes.indexOf(header) + 1));
        columns.append(articleBody);
        main.append(columns);
      } else {
        main.before(columns);
        columns.append(main);
      }
    }

    // Generated anchors are added after parsing. Resolve direct search links now.
    if (location.hash) {
      try {
        document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
      } catch {
        // A malformed URL fragment has no matching section.
      }
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const button = document.querySelector(".kp-theme-toggle");
    if (page.matches(".kp-note")) {
      for (const link of document.querySelectorAll('a.kp-control[download][href$=".yaml"]')) {
        const parent = link.parentElement;
        if (parent.matches("p") && parent.textContent.trim() === link.textContent.trim()) {
          parent.remove();
        } else {
          link.remove();
        }
      }
    }
    addArticleContents();
    enableImageViewer();
    if (!button) return;
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
