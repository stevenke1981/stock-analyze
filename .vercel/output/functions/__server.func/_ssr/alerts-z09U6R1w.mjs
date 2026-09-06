import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { c as getUniverse, s as getOverview } from "./market-v4c-0q29.mjs";
import { i as useQueryClient, n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { p as listAlerts, x as saveAlert } from "./router-befYNiLd.mjs";
import { a as Input, n as Button, o as PageTitle, p as formatPrice, r as EmptyState, t as AppShell } from "./app-shell-Cb07mbk-.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-CY3xUbe0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/alerts-z09U6R1w.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AlertsPage() {
	const qc = useQueryClient();
	const alerts = useQuery({
		queryKey: ["alerts"],
		queryFn: listAlerts
	});
	const overview = useQuery({
		queryKey: ["overview"],
		queryFn: () => getOverview()
	});
	const universe = useQuery({
		queryKey: ["universe"],
		queryFn: () => getUniverse()
	});
	const [symbol, setSymbol] = (0, import_react.useState)("2330");
	const [market, setMarket] = (0, import_react.useState)("TWSE");
	const [op, setOp] = (0, import_react.useState)("gte");
	const [price, setPrice] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		if ((!overview.data || !overview.data.ok) && (!universe.data || !universe.data.ok)) return;
		if (!alerts.data) return;
		const quotes = (universe.data && universe.data.ok ? universe.data.data.quotes : null) ?? (overview.data && overview.data.ok ? overview.data.data.quotes : []);
		for (const a of alerts.data) {
			if (!a.enabled || a.triggeredAt) continue;
			const q = quotes.find((x) => x.market === a.market && x.symbol === a.symbol);
			if (q?.close == null) continue;
			if (a.op === "gte" ? q.close >= a.price : q.close <= a.price) saveAlert({
				...a,
				triggeredAt: (/* @__PURE__ */ new Date()).toISOString()
			}).then(() => qc.invalidateQueries({ queryKey: ["alerts"] }));
		}
	}, [
		overview.data,
		universe.data,
		alerts.data,
		qc
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageTitle, {
			kicker: "提醒",
			title: "價格條件"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-4 text-sm text-muted-foreground",
			children: "站內提醒：重新整理行情時檢查。桌面系統通知需要應用持續開啟，此網頁版不會在背景推播。"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
					value: market,
					onValueChange: (v) => setMarket(v),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
						className: "w-28",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
						value: "TWSE",
						children: "上市"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
						value: "TPEX",
						children: "上櫃"
					})] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					className: "w-28",
					value: symbol,
					onChange: (e) => setSymbol(e.target.value)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
					value: op,
					onValueChange: (v) => setOp(v),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
						className: "w-28",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
						value: "gte",
						children: "≥"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
						value: "lte",
						children: "≤"
					})] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					className: "w-28",
					value: price,
					onChange: (e) => setPrice(e.target.value),
					placeholder: "價格"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: async () => {
						await saveAlert({
							id: crypto.randomUUID(),
							market,
							symbol,
							op,
							price: Number(price),
							note: "",
							enabled: true,
							triggeredAt: null
						});
						qc.invalidateQueries({ queryKey: ["alerts"] });
					},
					children: "新增"
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-6 space-y-2",
			children: (alerts.data ?? []).length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				title: "沒有提醒",
				body: "設定價格條件後，載入盤後行情時會標記觸發。"
			}) : (alerts.data ?? []).map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between rounded-md border border-border bg-card px-4 py-3 text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					a.symbol,
					" ",
					a.op === "gte" ? "≥" : "≤",
					" ",
					formatPrice(a.price)
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-xs text-muted-foreground",
					children: a.triggeredAt ? `已觸發 ${a.triggeredAt.slice(0, 16)}` : "監聽中"
				})]
			}, a.id))
		})
	] });
}
//#endregion
export { AlertsPage as component };
