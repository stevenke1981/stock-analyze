import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { c as getUniverse, s as getOverview } from "./market-v4c-0q29.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { C as saveScreener, d as getSettings, g as listScreeners } from "./router-befYNiLd.mjs";
import { a as Input, d as formatNumber, f as formatPct, n as Button, o as PageTitle, p as formatPrice, s as changeArrow, t as AppShell } from "./app-shell-Cb07mbk-.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-CY3xUbe0.mjs";
import { t as toneClass } from "./tone-BNEWv1zg.mjs";
import { t as DataStrip } from "./data-strip-RGVd89Ya.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/screener-MZkuadi5.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function applyScreener(quotes, rules) {
	return quotes.filter((q) => rules.every((rule) => matchRule(q, rule)));
}
function matchRule(q, rule) {
	const value = fieldOf(q, rule.field);
	if (typeof rule.value === "string" && (rule.op === "contains" || rule.op === "eq")) {
		const hay = String(value ?? "").toLowerCase();
		const needle = rule.value.toLowerCase();
		return rule.op === "contains" ? hay.includes(needle) : hay === needle;
	}
	const n = typeof value === "number" ? value : null;
	const target = Number(rule.value);
	if (n == null || Number.isNaN(target)) return false;
	if (rule.op === "gte") return n >= target;
	if (rule.op === "lte") return n <= target;
	return n === target;
}
function fieldOf(q, field) {
	switch (field) {
		case "close": return q.close;
		case "changePct": return q.changePct;
		case "volumeShares": return q.volumeShares;
		case "tradeValue": return q.tradeValue;
		case "peRatio": return q.peRatio;
		case "pbRatio": return q.pbRatio;
		case "dividendYield": return q.dividendYield;
		case "name": return q.name;
		case "symbol": return q.symbol;
		case "industry": return q.industry;
		case "market": return q.market;
		default: return null;
	}
}
var SCREENER_FIELDS = [
	{
		id: "close",
		label: "收盤價",
		kind: "number"
	},
	{
		id: "changePct",
		label: "漲跌幅 %",
		kind: "number"
	},
	{
		id: "volumeShares",
		label: "成交股數",
		kind: "number"
	},
	{
		id: "tradeValue",
		label: "成交金額",
		kind: "number"
	},
	{
		id: "peRatio",
		label: "本益比",
		kind: "number"
	},
	{
		id: "pbRatio",
		label: "股價淨值比",
		kind: "number"
	},
	{
		id: "dividendYield",
		label: "殖利率 %",
		kind: "number"
	},
	{
		id: "industry",
		label: "產業",
		kind: "text"
	},
	{
		id: "name",
		label: "名稱",
		kind: "text"
	},
	{
		id: "symbol",
		label: "代號",
		kind: "text"
	},
	{
		id: "market",
		label: "市場",
		kind: "text"
	}
];
function ScreenerPage() {
	const overview = useQuery({
		queryKey: ["overview"],
		queryFn: () => getOverview()
	});
	const universe = useQuery({
		queryKey: ["universe"],
		queryFn: () => getUniverse()
	});
	const settings = useQuery({
		queryKey: ["settings"],
		queryFn: getSettings
	});
	const saved = useQuery({
		queryKey: ["screeners"],
		queryFn: listScreeners
	});
	const convention = settings.data?.colorConvention ?? "tw";
	const [rules, setRules] = (0, import_react.useState)([{
		field: "changePct",
		op: "gte",
		value: 3
	}]);
	const [name, setName] = (0, import_react.useState)("漲幅大於 3%");
	const quotes = universe.data && universe.data.ok ? universe.data.data.quotes : overview.data && overview.data.ok ? overview.data.data.quotes : [];
	const asOf = overview.data && overview.data.ok ? overview.data.data.lastTradingDate : null;
	const rows = (0, import_react.useMemo)(() => applyScreener(quotes, rules).slice(0, 200), [quotes, rules]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageTitle, {
			kicker: "選股器",
			title: "條件篩選"
		}),
		overview.data && overview.data.ok ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DataStrip, { provenance: overview.data.data.provenance }) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-3 text-sm text-muted-foreground",
			children: [
				"每一項條件使用最新盤後快照，有效日期 ",
				asOf ?? "—",
				"。均線交叉需個股歷史，全市場均線篩選尚未預先下載，故不提供以免誤導。"
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 space-y-2",
			children: [rules.map((r, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: r.field,
						onValueChange: (v) => setRules((rs) => rs.map((x, j) => j === i ? {
							...x,
							field: v
						} : x)),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: SCREENER_FIELDS.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: f.id,
							children: f.label
						}, f.id)) })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: r.op,
						onValueChange: (v) => setRules((rs) => rs.map((x, j) => j === i ? {
							...x,
							op: v
						} : x)),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
							className: "w-28",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "gte",
								children: "≥"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "lte",
								children: "≤"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "eq",
								children: "="
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "contains",
								children: "包含"
							})
						] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						className: "w-32",
						value: String(r.value),
						onChange: (e) => setRules((rs) => rs.map((x, j) => j === i ? {
							...x,
							value: r.op === "contains" ? e.target.value : Number(e.target.value)
						} : x))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						onClick: () => setRules((rs) => rs.filter((_, j) => j !== i)),
						children: "刪"
					})
				]
			}, i)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "outline",
				onClick: () => setRules((rs) => [...rs, {
					field: "peRatio",
					op: "lte",
					value: 20
				}]),
				children: "加條件"
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 flex flex-wrap gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: name,
					onChange: (e) => setName(e.target.value),
					className: "max-w-xs"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					onClick: async () => {
						await saveScreener({
							id: crypto.randomUUID(),
							name,
							rules,
							sortField: "changePct",
							sortDir: "desc",
							updatedAt: (/* @__PURE__ */ new Date()).toISOString()
						});
					},
					children: "儲存條件"
				}),
				(saved.data ?? []).map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: "secondary",
					onClick: () => setRules(s.rules),
					children: s.name
				}, s.id))
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-4 text-xs text-muted-foreground",
			children: [
				"符合 ",
				rows.length,
				" 檔（最多顯示 200）"
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-2 overflow-x-auto rounded-lg border border-border",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "w-full min-w-[640px] text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
					className: "bg-secondary text-xs text-muted-foreground",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 text-left",
							children: "代號"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 text-left",
							children: "名稱"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 text-right",
							children: "收盤"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 text-right",
							children: "漲跌幅"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 text-right",
							children: "本益比"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 text-right",
							children: "殖利率"
						})
					] })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((q) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					className: "border-t border-border",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-3 py-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								className: "tabular underline-offset-4 hover:underline",
								to: "/stock/$market/$symbol",
								params: {
									market: q.market,
									symbol: q.symbol
								},
								children: q.symbol
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-3 py-2",
							children: q.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-3 py-2 text-right tabular",
							children: formatPrice(q.close)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
							className: `px-3 py-2 text-right tabular ${toneClass(q.changePct, convention)}`,
							children: [
								changeArrow(q.changePct),
								" ",
								formatPct(q.changePct)
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-3 py-2 text-right tabular",
							children: formatNumber(q.peRatio, 2)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-3 py-2 text-right tabular",
							children: formatNumber(q.dividendYield, 2)
						})
					]
				}, `${q.market}-${q.symbol}`)) })]
			})
		})
	] });
}
//#endregion
export { ScreenerPage as component };
