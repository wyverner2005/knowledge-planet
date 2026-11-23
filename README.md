# knowledge-planet
知識星球｜可全文搜尋的圖文醫學筆記

## 新增醫學筆記（/med）

- `/med` 在 Notion Medical Wiki 更新原筆記與全庫目錄。原筆記保留 YAML，把內容整理成可編輯的 Markdown，按 `/learn` 版式加入彩色導讀、臨床重點、數據與證據、注意事項和一句話收尾。原圖放進對應段落的 Notion 圖片區塊，附圖說及讀圖提示。即使來源是 HTML 或另有知識星球版本，Notion 正文一律不嵌入網頁。
- 在 `notes/` 保留同檔名的 `.html` 與 `.yaml`。文章以相對連結提供 YAML 下載，首頁與搜尋索引同步收錄。
- 公開 YAML 使用 `title`、`authors`、`source`、`year`、`volume`、`issue`、`pages`、`type`、`source_type`、`categories`、`tags` 等適用欄位。只發布公開書目與主題標籤。私人檔案連結、原檔 ID 與整理狀態留在 Notion。
- `categories` 使用小寫英文的專科識別字，例如 `neurology`。文章標籤與首頁篩選使用同一分類，既有主題關鍵字放在 `tags`。

## 網站閱讀樣式

- 新增或更新 HTML 筆記時，使用 `<html lang="zh-Hant" class="kp-note">`，並在筆記原有樣式之後載入 `../theme.css`，搭配 `../theme.js` 與 `.kp-theme-toggle`。共用樣式提供炭灰與銅金色的深色模式、低亮度暖紙黃的淺色模式，以及圖片和向量圖表的放大檢視。
- 文章專用樣式用 `theme.css` 的共用色彩變數設定頁面、卡片與控制項。深色模式使用 `--kp-dark-paper`、`--kp-dark-panel`、`--kp-dark-ink` 和 `--kp-brass`。淺色模式使用 `--kp-light-paper` 與 `--kp-light-panel`。保留臨床圖例的原始色彩與含義。

## 段落搜尋、文章目錄與醫學工具

- 所有文章以 `<main>` 包住正文，並用有意義的 `h2` 標題分節。建議用唯一且固定的 `id` 放在標題或上一層的 `section`，更新既有文章時保留已發布的錨點。共用 `theme.js` 會補齊可展開的文章目錄與缺少的錨點，既有的文章目錄繼續使用。
- 新增或更新 HTML／YAML 後，執行 `python3 scripts/build-search-index.py`（需 `lxml`、`PyYAML`），將更新的 `search-index.js` 與文章一起發布。驗證首頁的搜尋結果會顯示命中段落和摘要，並可直接跳到正確章節。
- 共用計算器集中在 `medical-tools.html`。新文章與工具有關時可以連到對應段落，並保留公式來源、單位與適用範圍。
