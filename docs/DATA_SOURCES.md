# 資料來源能力表

查證日期：2026-09-06。以下皆為實測 HTTP 回應，不是文件臆測。

| 來源 | 市場 | 即時/延遲/盤後 | 歷史 | 週期 | 時區 | API Key | 費用 | 配額 | 再散布 | 已接通 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TWSE OpenAPI `STOCK_DAY_ALL` | 上市 | 盤後快照 | 僅最新日（加 `date` 無效） | 日 | Asia/Taipei | 否 | 免費 | 未公布 | 開放資料，本 APP 不轉售 | 是 |
| TWSE OpenAPI `BWIBBU_ALL` | 上市 | 盤後 | 最新日 PE/PB/殖利率 | 日 | Asia/Taipei | 否 | 免費 | 未公布 | 同上 | 是 |
| TWSE OpenAPI `t187ap03_L` | 上市 | 基本資料 | 最新 | — | Asia/Taipei | 否 | 免費 | 未公布 | 同上 | 是 |
| TWSE OpenAPI `t187ap05_L` | 上市 | 月營收 | 最新一期全市場 | 月 | Asia/Taipei | 否 | 免費 | 未公布 | 同上 | 是 |
| TWSE OpenAPI `TWT48U_ALL` | 上市 | 除權息預告 | 最新 | — | Asia/Taipei | 否 | 免費 | 未公布 | 同上 | 是 |
| TWSE rwd `STOCK_DAY` | 上市 | 盤後 | 按月日K，實測 2330 2026-09 | 日 | Asia/Taipei | 否 | 官網公開 | 未公布，已限速 | 公開查詢，本 APP 僅研究 | 是 |
| TWSE rwd `MI_INDEX` / `FMTQIK` | 上市 | 盤後 | 指數、成交、漲跌家數 | 日 | Asia/Taipei | 否 | 官網公開 | 未公布 | 同上 | 是 |
| TWSE rwd `T86` | 上市 | 盤後 | 當日三大法人 | 日 | Asia/Taipei | 否 | 官網公開 | 未公布 | 同上 | 是 |
| TWSE rwd `MI_MARGN` | 上市 | 盤後 | 融資融券 | 日 | Asia/Taipei | 否 | 官網公開 | 未公布 | 同上 | 是 |
| TPEx OpenAPI `tpex_mainboard_quotes` | 上櫃 | 盤後 | 最新 | 日 | Asia/Taipei | 否 | 免費 | 未公布 | 遵守櫃買條款 | 是 |
| TPEx OpenAPI PE / 三大法人 / 公司 | 上櫃 | 盤後 | 最新 | 日 | Asia/Taipei | 否 | 免費 | 未公布 | 同上 | 是 |
| TPEx `tradingStock?date=yyyy/mm/dd` | 上櫃 | 盤後 | 按月日K，實測 6488 | 日 | Asia/Taipei | 否 | 官網公開 | 未公布 | 同上 | 是 |
| MIS 盤中 | 上市櫃 | 延遲 | 無 | tick | Asia/Taipei | 非正式 API | 未取得轉授權 | — | **未接入** | 否 |
| FinMind | 上市櫃 | 視方案 | 視方案 | 視方案 | Asia/Taipei | 需要 | 未驗證額度 | 未驗證 | **未接入** | 否 |
| 美股 | US | — | — | — | — | — | — | — | 擴充另查 | 否 |

成交量：證交所 `TradeVolume` 為股；畫面另顯示張（÷1000）。價格為**原始價格**，未做除權息還原。

失敗時：顯示上次成功快取並標記過期與原因，不用假資料冒充最新行情。
