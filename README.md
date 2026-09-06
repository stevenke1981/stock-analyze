# 衡研 Stock Analyze

面向台灣投資人的台股研究與決策輔助工具。介面預設使用繁體中文、台灣用語與紅漲綠跌，資料以最新可取得的盤後資訊為主。

> 本專案不是即時看盤或下單系統，也不構成投資建議、獲利保證或招攬。資料、回測與 AI 內容都必須由使用者自行核對。

## 主要功能

- 上市／上櫃股票與 ETF 搜尋、盤後行情、歷史日／週／月 K
- SMA、EMA、MACD、RSI、KD、布林通道、ATR 與成交量均線
- 月營收、三大法人、融資融券、估值與除權息資料
- 自選清單、持股、交易、筆記、價格提醒與 JSON 備份還原
- 條件選股、標的比較、均線交叉與 RSI 反轉回測
- 可選的 OpenAI-compatible AI 研究；沒有金鑰時，其餘功能仍可使用
- TypeScript 分析核心，以及可獨立測試的 Rust `hengyan-core`

資料來源、時間語意與已知限制請見 [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md)；實作與驗證狀態請見 [`docs/STATUS.md`](docs/STATUS.md)。

## 快速開始

需求：Node.js 22、npm 10。Rust 核心測試另需 stable Rust toolchain。

```bash
npm ci
npm run dev
```

開發伺服器預設監聽 `0.0.0.0:8080`。提交前請執行：

```bash
npm run check
npm run build
cargo test --manifest-path crates/hengyan-core/Cargo.toml --locked
```

`npm run check` 會依序執行 ESLint、TypeScript typecheck 與所有 Node 單元測試。Pull request 與 `main` push 也會由 GitHub Actions 執行相同品質閘門和 production build。

## AI 設定與安全邊界

預設 Base URL 為 `https://api.x.ai/v1`，可由部署環境提供 `XAI_API_KEY`。伺服器端金鑰只允許送往固定的 `api.x.ai` 端點，不會因瀏覽器傳入其他 Base URL 而轉送。

使用第三方 OpenAI-compatible 端點時：

1. 在「設定」輸入公開的 HTTPS `/v1` Base URL 與模型名稱。
2. 到個股的「AI 研究」頁籤，輸入該服務自己的 API key。
3. 金鑰只存在目前頁面的記憶體並隨該次請求送出，不寫入 IndexedDB、備份檔或 AI 快取。

自訂端點會拒絕 HTTP、URL 內嵌帳密、localhost、私人／回環／鏈路本地／保留 IP、解析至私網的網域及 HTTP redirect。`AI_RATE_LIMIT_PER_MINUTE` 可調整單一執行個體的 AI 請求上限，預設為每分鐘 20 次。

更多安全設計見 [`SECURITY.md`](SECURITY.md)。

## 可選環境變數

| 變數 | 用途 | 預設 |
| --- | --- | --- |
| `XAI_API_KEY` | 固定 xAI 端點的伺服器端金鑰 | 未設定時停用伺服器端 AI |
| `AI_RATE_LIMIT_PER_MINUTE` | 單一執行個體每分鐘 AI 請求上限，限制 1–120 | `20` |
| `DATABASE_URL` | 部署時的 PostgreSQL migration 連線 | 未設定時略過；本機使用既有 PGLite 流程 |

請勿把任何 API key 寫入原始碼、README、issue、截圖或備份 JSON。

## 專案結構

```text
src/routes/                 TanStack Router 頁面與 server functions
src/lib/providers/          TWSE、TPEx 等資料來源與解析
src/lib/engine/             指標、持股與回測計算
src/lib/storage/            IndexedDB 本機持久化與備份
crates/hengyan-core/        Rust 分析核心
scripts/                    migration、啟動與 QA 工具
docs/                       資料來源、架構、狀態與 Windows 建置說明
```

架構與資料流詳見 [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)。Windows 安裝包流程見 [`docs/WINDOWS_BUILD.md`](docs/WINDOWS_BUILD.md)。

## 回測口徑

- 訊號使用當日收盤與之前資料形成，於下一交易日開盤成交，避免同根 K 線前視偏誤。
- 單筆損益納入買進與賣出手續費、賣出交易稅及設定滑價。
- 無有效開盤價或成交量為零時不成交。
- 官方日 K 為未還原價格；未提供的股利、拆併股、流動性衝擊、最低手續費與存活者偏誤不會自動補造。

因此回測只適合研究策略行為，不等於可成交的未來績效。
