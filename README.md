# knowledge-planet
知識星球｜可全文搜尋的圖文醫學筆記

## 新增醫學筆記（/med）

- `/med` 在 Notion Medical Wiki 更新原筆記與全庫目錄。原筆記保留 YAML，把內容整理成可編輯的 Markdown，按 `/learn` 版式加入彩色導讀、臨床重點、數據與證據、注意事項和一句話收尾。原圖放進對應段落的 Notion 圖片區塊，附圖說及讀圖提示。即使來源是 HTML 或另有知識星球版本，Notion 正文一律不嵌入網頁。

## 發布知識星球文章（/web）

- 每篇文章在 `notes/` 維護一份 HTML。標題、來源、作者及卷期頁碼依原文保留在 HTML。網站不建立文章 YAML 或下載入口。
- 文章搜尋關鍵字填在 `<meta name="keywords" content="…">`，以半形逗號分隔。首頁卡片使用 `data-categories` 填入小寫英文專科識別字，例如 `neurology`。文章的分類標籤連回對應的首頁篩選。
- 在配對文章的正文「相關文章」區塊加入雙向 HTML 連結。

## 網站閱讀樣式

- 新增或更新 HTML 筆記時，使用 `<html lang="zh-Hant" class="kp-note">`，並在筆記原有樣式之後載入 `../theme.css`，搭配 `../theme.js` 與 `.kp-theme-toggle`。共用樣式提供炭灰與銅金色的深色模式、低亮度暖紙黃的淺色模式，以及圖片和向量圖表的放大檢視。
- 文章專用樣式用 `theme.css` 的共用色彩變數設定頁面、卡片與控制項。深色模式使用 `--kp-dark-paper`、`--kp-dark-panel`、`--kp-dark-ink` 和 `--kp-brass`。淺色模式使用 `--kp-light-paper` 與 `--kp-light-panel`。保留臨床圖例的原始色彩與含義。

## 段落搜尋、文章目錄與醫學工具

- 所有文章以 `<main>` 包住正文，並用有意義的 `h2` 標題分節。建議用唯一且固定的 `id` 放在標題或上一層的 `section`，更新既有文章時保留已發布的錨點。共用 `theme.js` 會補齊文章目錄與缺少的錨點，既有的文章目錄繼續使用。目錄沿用 cGVHD 臨床表現與診斷篇的位置：寬螢幕在標題與導讀下方、正文左側，並在捲動時固定；窄螢幕在正文上方，隨頁面捲動。文章開場使用 `<main>` 內的直屬 `<header>`，也支援緊接在 `<header>` 後的 `<main>`。
- 新增或更新文章 HTML 後，執行 `python3 scripts/build-search-index.py`（需 `lxml`），將更新的 `search-index.js` 與文章一起發布。驗證首頁的搜尋結果會顯示命中段落和摘要，並可直接跳到正確章節。
- 共用計算器集中在 `medical-tools.html`。新文章與工具有關時可以連到對應段落，並保留公式來源、單位與適用範圍。
