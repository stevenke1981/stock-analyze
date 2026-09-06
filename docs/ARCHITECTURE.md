# 架構與資料流

## 系統邊界

衡研是 TanStack Start + React 19 應用。市場資料由 server functions 呼叫官方或公開端點後，轉成統一 domain model；使用者資料則預設留在瀏覽器 IndexedDB，不需要登入或遠端資料庫。

```text
Browser UI
  ├─ React Query ──> TanStack server functions ──> TWSE / TPEx / MOPS-compatible sources
  ├─ IndexedDB ───> watchlist / transactions / notes / alerts / AI cache
  └─ Engine ──────> indicators / portfolio / backtest
                          └─ optional Rust hengyan-core parity target
```

## 主要層次

- `src/lib/domain/`：跨頁面共享的型別、格式化與交易日語意。
- `src/lib/providers/`：HTTP 節流、timeout、retry、來源解析與短期記憶體快取。
- `src/lib/server/`：TanStack server functions，負責聚合市場資料與代理 AI 請求。
- `src/lib/engine/`：純函式分析核心，避免 UI、網路與持久化耦合。
- `src/lib/storage/`：IndexedDB repository、備份與本機 AI 結果快取。
- `src/routes/`：頁面組合、互動與查詢狀態。
- `crates/hengyan-core/`：可獨立測試的 Rust 計算核心，作為後續桌面版／效能路徑。

## 市場資料可靠性

每筆行情或 K 線應保留 `source`、`eventTime`、`fetchedAt`、`session`、`status`、`adjustment` 與 `latency`。來源失敗時，可使用最後成功快取，但 UI 必須標示過期狀態與原因；不得用 AI 或零值補造缺失市場資料。

HTTP provider 採有限並行、請求間隔、timeout 與指數退避。401/403 不重試，429 與 5xx 才進入有限重試，避免對官方端點造成壓力。

## 回測資料流

1. 依標的取得原始日 K，按時間由舊到新排列。
2. 僅用 T 日收盤及以前資料產生訊號。
3. 在 T+1 日有效開盤價成交；成交量為零或價格無效則略過。
4. 資金曲線即時扣除買進成本；平倉損益扣除雙邊手續費、賣出稅及滑價。
5. 期末未平倉以最後收盤評價，不假裝已成交，並在結果顯示警告。

## AI 安全資料流

固定 xAI 路徑與第三方路徑分開處理：

- 未指定或明確指定 `https://api.x.ai/v1`：可使用部署環境的 `XAI_API_KEY`。
- 其他 Base URL：必須由該次瀏覽器請求附上自備 key；永遠不得 fallback 到伺服器 xAI key。
- 自訂 URL 通過 HTTPS、credentials、hostname、IP、DNS 與 redirect 檢查後才可連線。
- 上游錯誤 body 不直接回傳瀏覽器，避免洩露帳號或基礎設施細節。
- 本機 AI 快取鍵包含資料指紋、提示詞版本、端點、模型、投資期間與持股授權狀態，但不包含 API key。

## 品質閘門

GitHub Actions 對 pull request 與 `main` 執行：

1. `npm ci`
2. ESLint
3. TypeScript typecheck
4. Node 單元測試（含回測成本與 AI endpoint 安全測試）
5. production build
6. Rust `cargo test --locked`

生成物 `.vercel/`、Rust `target/`、log、測試報告與本機資料庫不得提交到 Git。
