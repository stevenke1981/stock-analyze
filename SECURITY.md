# Security Policy

## 支援範圍

安全修正以 `main` 分支為準。舊 commit、fork、第三方部署與使用者自行修改的版本不保證獲得修補。

## 回報漏洞

請優先使用 GitHub 的 private vulnerability reporting。若儲存庫未開啟此功能，請先建立不含利用細節、API key、個資或內部網址的 issue，要求維護者提供私人聯絡方式。

請勿在公開 issue、pull request、截圖、log 或備份檔中張貼：

- API key、access token、cookie 或 Authorization header
- 可識別個人的持股、交易與筆記內容
- 可直接利用的未修補漏洞步驟

## 金鑰與外部端點

- `XAI_API_KEY` 只允許送往固定的 `https://api.x.ai/v1/chat/completions`。
- 瀏覽器指定第三方 Base URL 時，必須同時提供該端點自己的 request-scoped key。
- 第三方金鑰不寫入 IndexedDB、AI 快取或匯出備份。
- 自訂端點只允許 HTTPS，禁止 URL 內嵌帳密、redirect、localhost、私人／回環／鏈路本地／保留 IP，並在連線前檢查 DNS 結果。
- 上述檢查是防禦層，不取代部署平台的 egress firewall、secret rotation、帳務上限與供應商端 rate limit。

若曾把伺服器金鑰暴露給不受信任的自訂端點，應立即在供應商後台撤銷並重新產生金鑰，再檢查使用紀錄與帳務。

## 本機資料

自選、持股、交易、筆記與提醒主要儲存在瀏覽器 IndexedDB。使用共用電腦時，請使用獨立作業系統帳號／瀏覽器 profile，並妥善保管匯出的 JSON 備份。
