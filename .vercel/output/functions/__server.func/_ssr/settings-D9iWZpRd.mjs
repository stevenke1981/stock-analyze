import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { l as pingSources } from "./market-v4c-0q29.mjs";
import { i as useQueryClient, n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { a as applyTheme, d as getSettings, f as importAll, u as exportAll, w as saveSettings } from "./router-befYNiLd.mjs";
import { a as Input, n as Button, o as PageTitle, t as AppShell } from "./app-shell-Cb07mbk-.mjs";
import { t as Badge } from "./badge-CAOs_68P.mjs";
import { t as Switch } from "./switch-C97rUqAF.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/settings-D9iWZpRd.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var SOURCE_CATALOG = [
	{
		id: "twse-openapi",
		name: "臺灣證券交易所 OpenAPI",
		officialUrl: "https://openapi.twse.com.tw/",
		markets: ["TWSE"],
		products: [
			"上市股票",
			"ETF",
			"估值",
			"月營收",
			"公司基本資料",
			"除權息"
		],
		latency: "after_hours",
		history: "多數端點僅最新一期快照，無歷史區間參數（2026-09-06 實測 STOCK_DAY_ALL 加 date 無效）",
		timeframes: ["1D"],
		timezone: "Asia/Taipei",
		update: "盤後批次；OpenAPI 有時較官網 JSON 晚一日",
		apiKey: "不需要",
		fee: "免費開放資料",
		quota: "未公布固定額度；實務需自律限速",
		redistribution: "公開開放資料，商用再散布仍應遵守證交所開放資料條款，本 APP 僅供研究展示、不轉售行情",
		verifiedAt: "2026-09-06",
		wired: true,
		notes: "已接通 STOCK_DAY_ALL、BWIBBU_ALL、t187ap03_L、t187ap05_L、TWT48U_ALL。"
	},
	{
		id: "twse-rwd",
		name: "臺灣證券交易所官網盤後 JSON（rwd）",
		officialUrl: "https://www.twse.com.tw/",
		markets: ["TWSE"],
		products: [
			"加權指數",
			"個股日成交（可按月）",
			"三大法人",
			"融資融券",
			"漲跌家數",
			"成交量排行",
			"休市日"
		],
		latency: "after_hours",
		history: "STOCK_DAY 可按年月回溯個股日 K；FMTQIK 當月市場成交；MI_INDEX 指定日期",
		timeframes: ["1D"],
		timezone: "Asia/Taipei",
		update: "收盤後當日下午起可取得",
		apiKey: "不需要",
		fee: "官網公開查詢",
		quota: "未公布；需限速與快取，禁止高頻輪詢",
		redistribution: "取自公開網頁查詢 API，僅供本機研究，不得偽裝為即時行情商用轉售",
		verifiedAt: "2026-09-06",
		wired: true,
		notes: "歷史日 K 主來源。2026-09-06 實測 2330 2026-09 回傳 ROC 日期欄。"
	},
	{
		id: "tpex-openapi",
		name: "證券櫃檯買賣中心 OpenAPI",
		officialUrl: "https://www.tpex.org.tw/openapi/",
		markets: ["TPEX"],
		products: [
			"上櫃收盤",
			"本益比／殖利率",
			"三大法人",
			"公司基本資料"
		],
		latency: "after_hours",
		history: "OpenAPI 多為最新快照",
		timeframes: ["1D"],
		timezone: "Asia/Taipei",
		update: "盤後",
		apiKey: "不需要",
		fee: "免費開放資料",
		quota: "未公布；自律限速",
		redistribution: "遵守櫃買中心開放資料使用條款；本 APP 不轉售",
		verifiedAt: "2026-09-06",
		wired: true,
		notes: "tpex_mainboard_quotes、tpex_mainboard_peratio_analysis、tpex_3insti_daily_trading、mopsfin_t187ap03_O。"
	},
	{
		id: "tpex-rwd",
		name: "櫃買中心官網個股日成交 JSON",
		officialUrl: "https://www.tpex.org.tw/",
		markets: ["TPEX"],
		products: ["上櫃個股日 K（按月）"],
		latency: "after_hours",
		history: "tradingStock?code=&date=yyyy/mm/01 可取該月日 K（2026-09-06 實測 6488）",
		timeframes: ["1D"],
		timezone: "Asia/Taipei",
		update: "盤後",
		apiKey: "不需要",
		fee: "官網公開查詢",
		quota: "未公布；需限速",
		redistribution: "公開查詢資料，僅供研究",
		verifiedAt: "2026-09-06",
		wired: true,
		notes: "date 必須為該月任一日 yyyy/mm/dd；yyyy/mm 會回參數錯誤。"
	},
	{
		id: "mis",
		name: "證交所 MIS 盤中報價",
		officialUrl: "https://mis.twse.com.tw/",
		markets: ["TWSE", "TPEX"],
		products: ["盤中延遲報價"],
		latency: "delayed",
		history: "無",
		timeframes: ["tick"],
		timezone: "Asia/Taipei",
		update: "盤中",
		apiKey: "非正式開放 API",
		fee: "未取得轉授權",
		quota: "—",
		redistribution: "第一版未接入；未驗證商用授權",
		verifiedAt: "2026-09-06",
		wired: false,
		notes: "尚未具備即時來源授權，畫面固定標示盤後／延遲模式。"
	},
	{
		id: "finmind",
		name: "FinMind",
		officialUrl: "https://finmindtrade.com/",
		markets: ["TWSE", "TPEX"],
		products: ["歷史價、財報、籌碼、新聞（視方案）"],
		latency: "after_hours",
		history: "依方案",
		timeframes: ["1D", "部分分 K"],
		timezone: "Asia/Taipei",
		update: "依方案",
		apiKey: "需要 token",
		fee: "免費額度 + 付費方案，未在本環境驗證額度",
		quota: "未驗證",
		redistribution: "依 FinMind 條款，禁止臆測",
		verifiedAt: "2026-09-06",
		wired: false,
		notes: "Adapter 預留於設定，未宣稱已連線。"
	},
	{
		id: "us-equities",
		name: "美股行情",
		officialUrl: "",
		markets: ["US"],
		products: ["美股"],
		latency: "delayed",
		history: "未查證",
		timeframes: [],
		timezone: "America/New_York",
		update: "—",
		apiKey: "—",
		fee: "—",
		quota: "—",
		redistribution: "擴充階段另行查證",
		verifiedAt: "2026-09-06",
		wired: false,
		notes: "架構預留 Market 型別擴充，第一版不提供。"
	}
];
function SettingsPage() {
	const qc = useQueryClient();
	const settings = useQuery({
		queryKey: ["settings"],
		queryFn: getSettings
	});
	const [ping, setPing] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const s = settings.data;
	if (!s) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageTitle, { title: "設定" }) });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageTitle, {
			kicker: "資料中心",
			title: "設定"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "space-y-4 rounded-lg border border-border bg-card p-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-medium",
					children: "顯示"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
					label: "紅漲綠跌（台灣習慣）",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
						checked: s.colorConvention === "tw",
						onCheckedChange: async (v) => {
							await saveSettings({ colorConvention: v ? "tw" : "us" });
							qc.invalidateQueries({ queryKey: ["settings"] });
						}
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
					label: "深色主題",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
						checked: s.theme !== "light",
						onCheckedChange: async (v) => {
							const theme = v ? "dark" : "light";
							await saveSettings({ theme });
							applyTheme(theme);
							qc.invalidateQueries({ queryKey: ["settings"] });
						}
					})
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mt-4 space-y-4 rounded-lg border border-border bg-card p-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-medium",
					children: "AI"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: "預設使用伺服器端模型，金鑰不會出現在瀏覽器。若填自備相容端點，金鑰只在每次分析請求傳送到伺服器，不會寫入匯出檔。沒有金鑰時核心功能仍可用。"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mb-1 block text-xs text-muted-foreground",
						children: "Base URL（可空）"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: s.aiBaseUrl,
						onChange: async (e) => {
							await saveSettings({ aiBaseUrl: e.target.value });
							qc.invalidateQueries({ queryKey: ["settings"] });
						},
						placeholder: "https://api.x.ai/v1"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mb-1 block text-xs text-muted-foreground",
						children: "模型"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: s.aiModel,
						onChange: async (e) => {
							await saveSettings({ aiModel: e.target.value });
							qc.invalidateQueries({ queryKey: ["settings"] });
						}
					})]
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mt-4 space-y-3 rounded-lg border border-border bg-card p-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-medium",
						children: "資料來源連線測試"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						disabled: busy,
						onClick: async () => {
							setBusy(true);
							try {
								setPing(await pingSources());
							} finally {
								setBusy(false);
							}
						},
						children: busy ? "測試中…" : "測試連線"
					})]
				}),
				ping?.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: p.id }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "tabular text-muted-foreground",
						children: [
							p.ok ? "成功" : "失敗",
							" · ",
							p.ms,
							" ms · ",
							p.detail
						]
					})]
				}, p.id)),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full min-w-[720px] text-left text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "text-muted-foreground",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2",
									children: "來源"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "延遲" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "金鑰" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "狀態" })
							] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: SOURCE_CATALOG.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-t border-border",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "py-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: c.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-faint",
										children: c.notes
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: c.latency === "after_hours" ? "盤後" : c.latency === "delayed" ? "延遲" : "即時" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: c.apiKey }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: c.wired ? "outline" : "warn",
									children: c.wired ? "已接通" : "未驗證"
								}) })
							]
						}, c.id)) })]
					})
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mt-4 space-y-3 rounded-lg border border-border bg-card p-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-medium",
					children: "備份"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: "匯出不含行情快取與任何金鑰。還原會寫入本機自選、持股、筆記與提醒。"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						onClick: async () => {
							const json = await exportAll();
							const blob = new Blob([json], { type: "application/json" });
							const a = document.createElement("a");
							a.href = URL.createObjectURL(blob);
							a.download = "hengyan-backup.json";
							a.click();
						},
						children: "匯出備份"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "inline-flex h-11 cursor-pointer items-center rounded-sm border border-border px-4 text-sm",
						children: ["還原", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "file",
							accept: "application/json",
							className: "hidden",
							onChange: async (e) => {
								const file = e.target.files?.[0];
								if (!file) return;
								await importAll(await file.text());
								qc.invalidateQueries();
							}
						})]
					})]
				})
			]
		})
	] });
}
function Row({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-between gap-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-sm",
			children: label
		}), children]
	});
}
//#endregion
export { SettingsPage as component };
