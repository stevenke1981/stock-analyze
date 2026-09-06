import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { c as getUniverse, r as getHistory, s as getOverview } from "./market-v4c-0q29.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { d as getSettings, r as Route$6 } from "./router-befYNiLd.mjs";
import { a as Input, f as formatPct, o as PageTitle, p as formatPrice, t as AppShell } from "./app-shell-Cb07mbk-.mjs";
import { r as sma } from "./indicators-C1kmH5qJ.mjs";
import { t as CandleChart } from "./candle-chart-Xo168UFp.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/compare-ssKzk-U5.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function parse(s) {
	const [market, symbol] = (s ?? "TWSE:2330").split(":");
	return {
		market: market === "TPEX" ? "TPEX" : "TWSE",
		symbol: symbol || "2330"
	};
}
function ComparePage() {
	const search = Route$6.useSearch();
	const [a, setA] = (0, import_react.useState)(search.a ?? "TWSE:2330");
	const [b, setB] = (0, import_react.useState)(search.b ?? "TWSE:2317");
	const pa = parse(a);
	const pb = parse(b);
	const ha = useQuery({
		queryKey: [
			"history",
			pa.market,
			pa.symbol
		],
		queryFn: () => getHistory({ data: {
			...pa,
			months: 12
		} })
	});
	const hb = useQuery({
		queryKey: [
			"history",
			pb.market,
			pb.symbol
		],
		queryFn: () => getHistory({ data: {
			...pb,
			months: 12
		} })
	});
	const overview = useQuery({
		queryKey: ["overview"],
		queryFn: () => getOverview()
	});
	const universe = useQuery({
		queryKey: ["universe"],
		queryFn: () => getUniverse()
	});
	const convention = useQuery({
		queryKey: ["settings"],
		queryFn: getSettings
	}).data?.colorConvention ?? "tw";
	const quotes = universe.data && universe.data.ok ? universe.data.data.quotes : overview.data && overview.data.ok ? overview.data.data.quotes : [];
	const qa = quotes.find((q) => q.market === pa.market && q.symbol === pa.symbol);
	const qb = quotes.find((q) => q.market === pb.market && q.symbol === pb.symbol);
	const barsA = ha.data && ha.data.ok ? ha.data.data : [];
	const barsB = hb.data && hb.data.ok ? hb.data.data : [];
	const ret = (bars) => bars.length >= 2 && bars[0].close ? (bars[bars.length - 1].close - bars[0].close) / bars[0].close * 100 : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageTitle, {
			kicker: "比較",
			title: "標的對照"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-4 text-sm text-muted-foreground",
			children: "比較期間為各自近 12 個月日K（原始價格）。格式：TWSE:2330"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				value: a,
				onChange: (e) => setA(e.target.value),
				className: "max-w-xs"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				value: b,
				onChange: (e) => setB(e.target.value),
				className: "max-w-xs"
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 grid gap-6 lg:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Side, {
				title: `${pa.symbol} ${qa?.name ?? ""}`,
				price: qa?.close ?? null,
				periodRet: ret(barsA),
				bars: barsA,
				convention
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Side, {
				title: `${pb.symbol} ${qb?.name ?? ""}`,
				price: qb?.close ?? null,
				periodRet: ret(barsB),
				bars: barsB,
				convention
			})]
		})
	] });
}
function Side({ title, price, periodRet, bars, convention }) {
	const s20 = sma(bars.map((b) => b.close), 20);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg border border-border bg-card p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-1 text-sm font-medium",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-3 text-sm text-muted-foreground",
				children: [
					"最新 ",
					formatPrice(price),
					" · 期間報酬 ",
					formatPct(periodRet)
				]
			}),
			bars.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CandleChart, {
				bars,
				sma20: s20,
				convention
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "p-8 text-sm text-muted-foreground",
				children: "沒有K線"
			})
		]
	});
}
//#endregion
export { ComparePage as component };
