# 衡研

台股投資分析與決策輔助。預設紅漲綠跌、盤後資料、繁體中文。

這不是即時看盤軟體，也不是獲利保證。沒有 AI 金鑰時，行情、圖表、指標、持股與回測仍可使用。

## 能做什麼

- 查看上市／上櫃最新可取得盤後行情與歷史日 K
- 管理自選、持股、交易、筆記與價格提醒
- 技術指標、月營收、三大法人、融資融券、除權息
- 條件選股、標的比較、均線／RSI 回測
- 依系統實際資料產生 AI 研究（可關）

## 資料

詳見 [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md)。來源、行情時間、盤後／過期狀態會顯示在畫面上。API 失敗時使用上次成功快取並標示原因。

## 開發

需要 Node 22。

```bash
npm install
npm run dev
npm test
npm run typecheck
npm run build
```

Rust 核心（可選）：

```bash
cargo test --manifest-path crates/hengyan-core/Cargo.toml
```

## 設定範例（不含密鑰）

自備 OpenAI 相容端點時，在「設定」填：

- Base URL：`https://api.x.ai/v1`
- 模型：`grok-4.5`

不要把金鑰寫進原始碼、README 或備份 JSON。網頁版金鑰不進入匯出檔。

## 授權與限制

官方開放資料僅供研究展示。第一版無即時授權、無下單、無美股。Windows 安裝包建置見 [docs/WINDOWS_BUILD.md](docs/WINDOWS_BUILD.md)。完成狀態見 [docs/STATUS.md](docs/STATUS.md)。
