import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { c as getUniverse, r as getHistory, s as getOverview, u as searchStocks } from "./market-v4c-0q29.mjs";
import { c as Plus, i as Trash2 } from "../_libs/lucide-react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { D as seedIfNeeded, E as saveWatch, d as getSettings, l as deleteWatch, m as listGroups, v as listWatch } from "./router-befYNiLd.mjs";
import { a as Input, f as formatPct, m as formatSharesAsLots, n as Button, o as PageTitle, p as formatPrice, r as EmptyState, s as changeArrow, t as AppShell } from "./app-shell-Cb07mbk-.mjs";
import { t as toneClass } from "./tone-BNEWv1zg.mjs";
import { t as Badge } from "./badge-CAOs_68P.mjs";
import { t as DataStrip } from "./data-strip-RGVd89Ya.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/watchlist-CUrxtXnf.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Sparkline({ values, up, className }) {
	if (values.length < 2) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className });
	const min = Math.min(...values);
	const span = Math.max(...values) - min || 1;
	const w = 88;
	const h = 28;
	const d = values.map((v, i) => {
		const x = i / (values.length - 1) * w;
		const y = h - (v - min) / span * h;
		return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
	}).join(" ");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		viewBox: `0 0 ${w} ${h}`,
		className,
		width: w,
		height: h,
		"aria-hidden": true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d,
			fill: "none",
			stroke: up ? "var(--hy-up)" : "var(--hy-down)",
			strokeWidth: "1.5"
		})
	});
}
function WatchlistPage() {
	const qc = useQueryClient();
	const local = useQuery({
		queryKey: ["watch-local"],
		queryFn: async () => {
			await seedIfNeeded();
			const [groups, watch, settings] = await Promise.all([
				listGroups(),
				listWatch(),
				getSettings()
			]);
			return {
				groups,
				watch,
				settings
			};
		}
	});
	const overview = useQuery({
		queryKey: ["overview"],
		queryFn: () => getOverview()
	});
	const universe = useQuery({
		queryKey: ["universe"],
		queryFn: () => getUniverse()
	});
	const [q, setQ] = (0, import_react.useState)("");
	const [noteEdit, setNoteEdit] = (0, import_react.useState)({});
	const quotes = universe.data && universe.data.ok ? universe.data.data.quotes : overview.data && overview.data.ok ? overview.data.data.quotes : [];
	const quoteMap = (0, import_react.useMemo)(() => {
		const m = /* @__PURE__ */ new Map();
		for (const x of quotes) m.set(`${x.market}:${x.symbol}`, x);
		return m;
	}, [quotes]);
	const add = useMutation({
		mutationFn: async (item) => saveWatch(item),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["watch-local"] })
	});
	const remove = useMutation({
		mutationFn: deleteWatch,
		onSuccess: () => qc.invalidateQueries({ queryKey: ["watch-local"] })
	});
	const items = local.data?.watch ?? [];
	const convention = local.data?.settings.colorConvention ?? "tw";
	const filtered = items.filter((i) => {
		const s = q.trim().toLowerCase();
		if (!s) return true;
		const quote = quoteMap.get(`${i.market}:${i.symbol}`);
		return i.symbol.toLowerCase().includes(s) || (quote?.name ?? "").toLowerCase().includes(s) || i.note.includes(s);
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageTitle, {
			kicker: "自選股",
			title: "觀察清單",
			actions: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AddSymbol, { onAdd: (market, symbol) => add.mutate({
				id: crypto.randomUUID(),
				groupId: local.data?.groups[0]?.id ?? "default",
				market,
				symbol,
				note: "",
				sort: items.length,
				createdAt: (/* @__PURE__ */ new Date()).toISOString()
			}) })
		}),
		overview.data && overview.data.ok ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DataStrip, {
			provenance: overview.data.data.provenance,
			error: overview.data.data.error
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
			value: q,
			onChange: (e) => setQ(e.target.value),
			placeholder: "搜尋自選",
			className: "my-4 max-w-sm"
		}),
		filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
			title: "尚無自選",
			body: "用上方搜尋加入台股或 ETF。清單保存在此瀏覽器。"
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "overflow-x-auto rounded-lg border border-border",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "w-full min-w-[820px] text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
					className: "bg-secondary text-left text-xs text-muted-foreground",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2",
							children: "代號"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2",
							children: "名稱"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 text-right",
							children: "最新"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 text-right",
							children: "漲跌幅"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 text-right",
							children: "成交量"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2",
							children: "走勢"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2",
							children: "備註"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "px-3 py-2" })
					] })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: filtered.map((item) => {
					const qrow = quoteMap.get(`${item.market}:${item.symbol}`);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WatchRow, {
						item,
						name: qrow?.name ?? item.symbol,
						close: qrow?.close ?? null,
						changePct: qrow?.changePct ?? null,
						volume: qrow?.volumeShares ?? null,
						convention,
						note: noteEdit[item.id] ?? item.note,
						onNote: (v) => setNoteEdit((s) => ({
							...s,
							[item.id]: v
						})),
						onNoteSave: async () => {
							await saveWatch({
								...item,
								note: noteEdit[item.id] ?? item.note
							});
							qc.invalidateQueries({ queryKey: ["watch-local"] });
						},
						onRemove: () => remove.mutate(item.id)
					}, item.id);
				}) })]
			})
		})
	] });
}
function WatchRow({ item, name, close, changePct, volume, convention, note, onNote, onNoteSave, onRemove }) {
	const hist = useQuery({
		queryKey: [
			"spark",
			item.market,
			item.symbol
		],
		queryFn: () => getHistory({ data: {
			market: item.market,
			symbol: item.symbol,
			months: 2
		} }),
		staleTime: 36e5
	});
	const values = hist.data && hist.data.ok ? hist.data.data.slice(-20).map((b) => b.close) : [];
	const up = (changePct ?? 0) >= 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
		className: "border-t border-border",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-3 py-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					className: "tabular font-medium underline-offset-4 hover:underline",
					to: "/stock/$market/$symbol",
					params: {
						market: item.market,
						symbol: item.symbol
					},
					children: item.symbol
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
				className: "px-3 py-2",
				children: [
					name,
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						variant: "outline",
						className: "ml-1",
						children: item.market === "TWSE" ? "上市" : "上櫃"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-3 py-2 text-right tabular",
				children: formatPrice(close)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
				className: `px-3 py-2 text-right tabular ${toneClass(changePct, convention)}`,
				children: [
					changeArrow(changePct),
					" ",
					formatPct(changePct)
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-3 py-2 text-right tabular",
				children: formatSharesAsLots(volume)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-3 py-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkline, {
					values,
					up
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-3 py-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: note,
					onChange: (e) => onNote(e.target.value),
					onBlur: onNoteSave,
					className: "h-9 min-h-9"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-3 py-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					size: "icon",
					onClick: onRemove,
					"aria-label": "移除",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
				})
			})
		]
	});
}
function AddSymbol({ onAdd }) {
	const [q, setQ] = (0, import_react.useState)("");
	const hits = useQuery({
		queryKey: ["search", q],
		queryFn: () => searchStocks({ data: { q } }),
		enabled: q.trim().length > 0
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative w-64",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
			value: q,
			onChange: (e) => setQ(e.target.value),
			placeholder: "加入代號"
		}), hits.data && hits.data.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute right-0 top-12 z-20 w-72 rounded-md border border-border bg-popover shadow-md",
			children: hits.data.slice(0, 8).map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				className: "flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-secondary",
				onClick: () => {
					onAdd(h.market, h.symbol);
					setQ("");
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "tabular mr-2",
					children: h.symbol
				}), h.name] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" })]
			}, `${h.market}-${h.symbol}`))
		}) : null]
	});
}
//#endregion
export { WatchlistPage as component };
