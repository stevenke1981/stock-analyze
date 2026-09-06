import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { c as getUniverse, s as getOverview } from "./market-v4c-0q29.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { d as getSettings, i as Route$9 } from "./router-befYNiLd.mjs";
import { a as Input, d as formatNumber, f as formatPct, g as formatTwd, h as formatSigned, i as ErrorState, m as formatSharesAsLots, o as PageTitle, p as formatPrice, s as changeArrow, t as AppShell } from "./app-shell-Cb07mbk-.mjs";
import { t as toneClass } from "./tone-BNEWv1zg.mjs";
import { t as Badge } from "./badge-CAOs_68P.mjs";
import { t as DataStrip } from "./data-strip-RGVd89Ya.mjs";
import { a as TabsTrigger, i as TabsList, n as Tabs, r as TabsContent, t as Skeleton } from "./tabs-w4JJLI-R.mjs";
import { t as useVirtualizer } from "../_libs/@tanstack/react-virtual+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Q2vc8Tij.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Home() {
	const loaded = Route$9.useLoaderData();
	const overview = useQuery({
		queryKey: ["overview"],
		queryFn: () => getOverview(),
		initialData: loaded.overview
	});
	const universe = useQuery({
		queryKey: ["universe"],
		queryFn: () => getUniverse(),
		initialData: loaded.universe
	});
	const convention = useQuery({
		queryKey: ["settings"],
		queryFn: getSettings
	}).data?.colorConvention ?? "tw";
	if (overview.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageTitle, {
		kicker: "市場總覽",
		title: "台灣股市"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid gap-3 md:grid-cols-4",
		children: Array.from({ length: 4 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-28 rounded-lg" }, i))
	})] });
	if (overview.isError || !overview.data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
		title: "無法載入市場",
		body: "請稍後重試。",
		onRetry: () => overview.refetch()
	}) });
	const res = overview.data;
	if (!res.ok) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
		title: "行情來源失敗",
		body: res.message,
		onRetry: () => overview.refetch()
	}) });
	const d = res.data;
	const quotes = (universe.data && universe.data.ok ? universe.data.data.quotes : d.quotes).filter((q) => q.close != null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageTitle, {
			kicker: "市場總覽",
			title: "台灣股市",
			actions: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				className: "text-sm text-muted-foreground underline-offset-4 hover:underline",
				onClick: () => {
					overview.refetch();
					universe.refetch();
				},
				children: "重新整理"
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DataStrip, {
			provenance: d.provenance,
			error: d.error
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IndexCard, {
					title: "加權指數",
					value: d.taiex?.close ?? null,
					change: d.taiex?.change ?? null,
					pct: d.taiex?.changePct ?? null,
					convention
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IndexCard, {
					title: "櫃買指數",
					value: d.otc?.close ?? null,
					change: d.otc?.change ?? null,
					pct: d.otc?.changePct ?? null,
					convention
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
					label: "成交金額",
					value: formatTwd(d.tradeValue),
					hint: "上市市場"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
					label: "漲跌家數",
					value: `${formatNumber(d.breadth.advances)} / ${formatNumber(d.breadth.declines)}`,
					hint: `漲停 ${formatNumber(d.breadth.limitUp)} · 跌停 ${formatNumber(d.breadth.limitDown)}`
				})
			]
		}),
		d.indices.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 flex gap-2 overflow-x-auto pb-1",
			children: d.indices.slice(0, 8).map((idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-40 rounded-md border border-border bg-card px-3 py-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-[11px] text-muted-foreground",
					children: idx.name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: `tabular text-sm font-medium ${toneClass(idx.change, convention)}`,
					children: [
						formatPrice(idx.close),
						" ",
						changeArrow(idx.change),
						" ",
						formatPct(idx.changePct)
					]
				})]
			}, idx.id))
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
			defaultValue: "gainers",
			className: "mt-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
					value: "gainers",
					children: "漲幅"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
					value: "losers",
					children: "跌幅"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
					value: "volume",
					children: "成交量"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
					value: "value",
					children: "成交值"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
					value: "all",
					children: "全部"
				})
			] }), universe.isLoading && quotes.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 grid gap-2",
				children: Array.from({ length: 8 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-10 rounded-md" }, i))
			}) : universe.data && !universe.data.ok && quotes.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
				title: "個股排行失敗",
				body: universe.data.message,
				onRetry: () => universe.refetch()
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
					value: "gainers",
					className: "mt-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuoteTable, {
						quotes: top(quotes, "changePct", true, 40),
						convention
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
					value: "losers",
					className: "mt-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuoteTable, {
						quotes: top(quotes, "changePct", false, 40),
						convention
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
					value: "volume",
					className: "mt-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuoteTable, {
						quotes: top(quotes, "volumeShares", true, 40),
						convention
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
					value: "value",
					className: "mt-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuoteTable, {
						quotes: top(quotes, "tradeValue", true, 40),
						convention
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
					value: "all",
					className: "mt-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AllQuotes, {
						quotes,
						convention
					})
				})
			] })]
		})
	] });
}
function top(quotes, field, desc, n) {
	return [...quotes].filter((q) => typeof q[field] === "number").sort((a, b) => {
		const av = Number(a[field]);
		const bv = Number(b[field]);
		return desc ? bv - av : av - bv;
	}).slice(0, n);
}
function IndexCard({ title, value, change, pct, convention }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg border border-border bg-card p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-xs text-muted-foreground",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 tabular text-2xl font-medium",
				children: formatNumber(value, 2)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `mt-1 tabular text-sm ${toneClass(change, convention)}`,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "sr-only",
						children: change != null && change > 0 ? "上漲" : change != null && change < 0 ? "下跌" : "持平"
					}),
					changeArrow(change),
					" ",
					formatSigned(change, 2),
					"（",
					formatPct(pct),
					"）"
				]
			})
		]
	});
}
function StatCard({ label, value, hint }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg border border-border bg-card p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-xs text-muted-foreground",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 tabular text-2xl font-medium",
				children: value
			}),
			hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1 text-xs text-faint",
				children: hint
			}) : null
		]
	});
}
function QuoteTable({ quotes, convention }) {
	if (!quotes.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "text-sm text-muted-foreground",
		children: "沒有可排序的資料。"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "overflow-x-auto rounded-lg border border-border",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
			className: "w-full min-w-[720px] text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
				className: "bg-secondary text-left text-xs text-muted-foreground",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-3 py-2 font-medium",
						children: "代號"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-3 py-2 font-medium",
						children: "名稱"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-3 py-2 font-medium text-right",
						children: "收盤"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-3 py-2 font-medium text-right",
						children: "漲跌"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-3 py-2 font-medium text-right",
						children: "漲跌幅"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-3 py-2 font-medium text-right",
						children: "成交量"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-3 py-2 font-medium text-right",
						children: "成交值"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-3 py-2 font-medium",
						children: "市場"
					})
				] })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: quotes.map((q) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
				className: "border-t border-border hover:bg-secondary/50",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-3 py-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							className: "tabular font-medium underline-offset-4 hover:underline",
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
						className: `px-3 py-2 text-right tabular ${toneClass(q.change, convention)}`,
						children: [
							changeArrow(q.change),
							" ",
							formatSigned(q.change)
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: `px-3 py-2 text-right tabular ${toneClass(q.changePct, convention)}`,
						children: formatPct(q.changePct)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-3 py-2 text-right tabular",
						children: formatSharesAsLots(q.volumeShares)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-3 py-2 text-right tabular",
						children: formatTwd(q.tradeValue)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-3 py-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							variant: "outline",
							children: q.market === "TWSE" ? "上市" : "上櫃"
						})
					})
				]
			}, `${q.market}-${q.symbol}`)) })]
		})
	});
}
function AllQuotes({ quotes, convention }) {
	const [q, setQ] = (0, import_react.useState)("");
	const filtered = (0, import_react.useMemo)(() => {
		const s = q.trim().toLowerCase();
		if (!s) return quotes;
		return quotes.filter((x) => x.symbol.toLowerCase().includes(s) || x.name.toLowerCase().includes(s));
	}, [quotes, q]);
	const parent = (0, import_react.useRef)(null);
	const virtualizer = useVirtualizer({
		count: filtered.length,
		getScrollElement: () => parent.current,
		estimateSize: () => 44,
		overscan: 12
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
			value: q,
			onChange: (e) => setQ(e.target.value),
			placeholder: "過濾代號或名稱",
			className: "mb-3 max-w-sm"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-2 text-xs text-muted-foreground",
			children: [
				"共 ",
				filtered.length,
				" 檔 · 虛擬化清單"
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			ref: parent,
			className: "h-[560px] overflow-auto rounded-lg border border-border",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style: {
					height: virtualizer.getTotalSize(),
					position: "relative"
				},
				children: virtualizer.getVirtualItems().map((v) => {
					const row = filtered[v.index];
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/stock/$market/$symbol",
						params: {
							market: row.market,
							symbol: row.symbol
						},
						className: "absolute left-0 right-0 flex items-center gap-3 border-b border-border px-3 text-sm hover:bg-secondary/50",
						style: {
							height: v.size,
							transform: `translateY(${v.start}px)`
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "w-16 tabular font-medium",
								children: row.symbol
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "w-28 truncate",
								children: row.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "ml-auto w-20 text-right tabular",
								children: formatPrice(row.close)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: `w-24 text-right tabular ${toneClass(row.changePct, convention)}`,
								children: [
									changeArrow(row.changePct),
									" ",
									formatPct(row.changePct)
								]
							})
						]
					}, `${row.market}-${row.symbol}`);
				})
			})
		})
	] });
}
//#endregion
export { Home as component };
