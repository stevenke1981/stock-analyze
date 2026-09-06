# Windows 桌面建置（Tauri，此環境未產出安裝包）

本預覽環境是 Linux 網頁沙箱，**沒有**成功建置 Windows 安裝檔，不得宣稱已完成安裝包。

建議本機（Windows 10/11）流程：

1. 安裝 [Rust](https://rustup.rs)、WebView2、Node 22、VS Build Tools。
2. `cargo install tauri-cli --version "^2"`
3. 將 `crates/hengyan-core` 連到 Tauri 命令，UI 仍用本倉庫 React 建置產物，或改以 `tauri dev` 載入 `npm run build` 的 `dist`。
4. 本機資料改 SQLite（`docs/schema.sql`）+ SQLCipher 可選；API Key 改 Windows Credential Manager。
5. `tauri build` 產生 NSIS。

第一版**不串接真實下單**。桌面提醒需應用持續執行。

核心計算已在 `crates/hengyan-core` 與 `src/lib/engine` 對齊，不依賴 UI。
