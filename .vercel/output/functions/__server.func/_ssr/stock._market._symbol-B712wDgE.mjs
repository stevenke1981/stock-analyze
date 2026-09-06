import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { t as createServerFn } from "./ssr.mjs";
import { t as PROMPT_VERSION } from "./types-crMHyLS4.mjs";
import { a as object, n as boolean, o as string } from "../_libs/zod.mjs";
import { a as getMargin, c as getUniverse, i as getInstitution, n as getActions, o as getMonthlyRevenue, r as getHistory, s as getOverview, t as createSsrRpc } from "./market-v4c-0q29.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { D as seedIfNeeded, E as saveWatch, d as getSettings, n as Route, o as cacheAi, v as listWatch, y as readAi } from "./router-befYNiLd.mjs";
import { a as Input, d as formatNumber, f as formatPct, g as formatTwd, h as formatSigned, i as ErrorState, m as formatSharesAsLots, n as Button, o as PageTitle, p as formatPrice, s as changeArrow, t as AppShell, u as formatDateTimeTaipei } from "./app-shell-Cb07mbk-.mjs";
import { i as snapshot, r as sma, t as resample } from "./indicators-C1kmH5qJ.mjs";
import { t as CandleChart } from "./candle-chart-Xo168UFp.mjs";
import { t as Textarea } from "./textarea-JIAiD--g.mjs";
import { t as toneClass } from "./tone-BNEWv1zg.mjs";
import { t as Badge } from "./badge-CAOs_68P.mjs";
import { t as DataStrip } from "./data-strip-RGVd89Ya.mjs";
import { a as TabsTrigger, i as TabsList, n as Tabs, r as TabsContent, t as Skeleton } from "./tabs-w4JJLI-R.mjs";
import { t as Switch } from "./switch-C97rUqAF.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/stock._market._symbol-B712wDgE.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var inputSchema = object({
	symbol: string(),
	name: string(),
	market: string(),
	horizon: string().optional(),
	includeHoldings: boolean().optional(),
	holdingSummary: string().optional(),
	payload: string().max(24e3),
	provider: object({
		baseUrl: string().url().optional(),
		model: string().optional(),
		apiKey: string().optional()
	}).optional()
});
var runResearch = createServerFn({ method: "POST" }).validator(inputSchema).handler(createSsrRpc("2a67c71cb58541b125f59ad2895e354d2188d16fa7a4591e2cc82063af0f5f61"));
function StockPage() {
	const { market, symbol } = Route.useParams();
	const m = market;
	const overview = useQuery({
		queryKey: ["overview"],
		queryFn: () => getOverview()
	});
	const universe = useQuery({
		queryKey: ["universe"],
		queryFn: () => getUniverse()
	});
	const history = useQuery({
		queryKey: [
			"history",
			m,
			symbol
		],
		queryFn: () => getHistory({ data: {
			market: m,
			symbol,
			months: 18
		} })
	});
	const convention = useQuery({
		queryKey: ["settings"],
		queryFn: getSettings
	}).data?.colorConvention ?? "tw";
	const quote = (universe.data && universe.data.ok ? universe.data.data.quotes : overview.data && overview.data.ok ? overview.data.data.quotes : []).find((q) => q.market === m && q.symbol === symbol);
	const [tf, setTf] = (0, import_react.useState)("1D");
	const bars = history.data && history.data.ok ? history.data.data : [];
	const shown = (0, import_react.useMemo)(() => {
		if (tf === "1W") return resample(bars, "1W");
		if (tf === "1M") return resample(bars, "1M");
		return bars;
	}, [bars, tf]);
	const closes = shown.map((b) => b.close);
	const s20 = sma(closes, 20);
	const s60 = sma(closes, 60);
	const snap = snapshot(bars);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageTitle, {
			kicker: m === "TWSE" ? "上市" : "上櫃",
			title: `${symbol} ${quote?.name ?? ""}`,
			actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WatchButton, {
					market: m,
					symbol
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					className: "inline-flex h-11 items-center rounded-sm border border-border px-3 text-sm",
					to: "/compare",
					search: { a: `${m}:${symbol}` },
					children: "比較"
				})]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap items-end gap-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: `tabular text-4xl font-medium ${toneClass(quote?.change, convention)}`,
					children: formatPrice(quote?.close ?? bars.at(-1)?.close ?? null)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: `tabular text-lg ${toneClass(quote?.change, convention)}`,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "sr-only",
							children: (quote?.change ?? 0) > 0 ? "上漲" : (quote?.change ?? 0) < 0 ? "下跌" : "持平"
						}),
						changeArrow(quote?.change),
						" ",
						formatSigned(quote?.change),
						"（",
						formatPct(quote?.changePct),
						"）"
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					variant: "outline",
					children: quote ? "盤後" : "歷史"
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DataStrip, {
				provenance: quote ?? (history.data && history.data.ok ? history.data.provenance : null),
				error: history.data && !history.data.ok ? history.data.message : overview.data && !overview.data.ok ? overview.data.message : null
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 lg:grid-cols-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meta, {
					label: "開",
					value: formatPrice(quote?.open ?? null)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meta, {
					label: "高",
					value: formatPrice(quote?.high ?? null)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meta, {
					label: "低",
					value: formatPrice(quote?.low ?? null)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meta, {
					label: "量",
					value: formatSharesAsLots(quote?.volumeShares ?? null)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meta, {
					label: "本益比",
					value: formatNumber(quote?.peRatio, 2)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meta, {
					label: "殖利率",
					value: quote?.dividendYield == null ? "—" : `${formatNumber(quote.dividendYield, 2)}%`
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-6 flex gap-2",
			children: [
				"1D",
				"1W",
				"1M"
			].map((x) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: tf === x ? "default" : "outline",
				onClick: () => setTf(x),
				children: x === "1D" ? "日K" : x === "1W" ? "週K" : "月K"
			}, x))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3 rounded-lg border border-border bg-card p-2",
			children: history.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-[420px]" }) : history.data && !history.data.ok ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
				title: "歷史K線失敗",
				body: history.data.message,
				onRetry: () => history.refetch()
			}) : shown.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "p-8 text-sm text-muted-foreground",
				children: "沒有K線。可能是新上市或來源該月無資料。"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CandleChart, {
				bars: shown,
				sma20: s20,
				sma60: s60,
				convention
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
			defaultValue: "tech",
			className: "mt-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
						value: "tech",
						children: "技術"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
						value: "fund",
						children: "財務"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
						value: "flow",
						children: "籌碼"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
						value: "events",
						children: "事件"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
						value: "ai",
						children: "AI 研究"
					})
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
					value: "tech",
					className: "mt-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TechPanel, {
						snap,
						barCount: bars.length
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
					value: "fund",
					className: "mt-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FundPanel, {
						symbol,
						quote
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
					value: "flow",
					className: "mt-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FlowPanel, {
						symbol,
						asOf: overview.data && overview.data.ok ? overview.data.data.lastTradingDate ?? void 0 : void 0
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
					value: "events",
					className: "mt-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EventPanel, { symbol })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
					value: "ai",
					className: "mt-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AiPanel, {
						market: m,
						symbol,
						name: quote?.name ?? symbol,
						payload: {
							quote,
							snapshot: snap,
							lastBars: bars.slice(-40)
						}
					})
				})
			]
		})
	] });
}
function Meta({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-md border border-border bg-card px-3 py-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-[11px] text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "tabular",
			children: value
		})]
	});
}
function TechPanel({ snap, barCount }) {
	const rows = [
		[
			"SMA 5 / 20 / 60",
			`${fmt(snap.sma5)} / ${fmt(snap.sma20)} / ${fmt(snap.sma60)}`,
			"算術平均；不足窗長則顯示不足"
		],
		[
			"EMA 12 / 26",
			`${fmt(snap.ema12)} / ${fmt(snap.ema26)}`,
			"k=2/(n+1)，SMA 種子"
		],
		[
			"MACD",
			`${fmt(snap.macd)} / 訊號 ${fmt(snap.macdSignal)} / 柱 ${fmt(snap.macdHist)}`,
			"12-26-9"
		],
		[
			"RSI 14",
			fmt(snap.rsi14),
			"Wilder 平滑"
		],
		[
			"KD 9",
			`K ${fmt(snap.k)} / D ${fmt(snap.d)}`,
			"初始 50"
		],
		[
			"布林 20,2",
			`${fmt(snap.bbLower)} – ${fmt(snap.bbMid)} – ${fmt(snap.bbUpper)}`,
			"母體標準差"
		],
		[
			"ATR 14",
			fmt(snap.atr14),
			"真實波幅"
		],
		[
			"成交量均線 20",
			snap.volSma20 == null ? "不足" : formatSharesAsLots(snap.volSma20),
			"股數 SMA"
		],
		[
			"均線排列",
			snap.alignment === "bullish" ? "多頭（5>20>60）" : snap.alignment === "bearish" ? "空頭（5<20<60）" : snap.alignment === "mixed" ? "糾結" : "資料不足",
			""
		]
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg border border-border bg-card",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "border-b border-border px-4 py-3 text-sm text-muted-foreground",
			children: [
				snap.note,
				" 使用 ",
				barCount,
				" 根原始日K。"
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("table", {
			className: "w-full text-sm",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
				className: "border-t border-border",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-4 py-3 text-muted-foreground",
						children: r[0]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-4 py-3 tabular",
						children: r[1]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "hidden px-4 py-3 text-xs text-faint md:table-cell",
						children: r[2]
					})
				]
			}, r[0])) })
		})]
	});
}
function fmt(n) {
	return n == null ? "不足" : formatNumber(n, 2);
}
function FundPanel({ symbol, quote }) {
	const rev = useQuery({
		queryKey: ["rev", symbol],
		queryFn: () => getMonthlyRevenue({ data: { symbol } })
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meta, {
						label: "本益比",
						value: formatNumber(quote?.peRatio, 2)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meta, {
						label: "股價淨值比",
						value: formatNumber(quote?.pbRatio, 2)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meta, {
						label: "殖利率",
						value: quote?.dividendYield == null ? "—" : `${formatNumber(quote.dividendYield, 2)}%`
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs text-muted-foreground",
				children: [
					"估值取自證交所／櫃買當日估值表，有效日期 ",
					quote?.eventTime?.slice(0, 10) ?? "—",
					"。損益表完整科目（毛利率、ROE、自由現金流）需財務報表來源，第一版尚未接通 MOPS 歷史財報 API。"
				]
			}),
			rev.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-40" }) : rev.data && !rev.data.ok ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
				title: "月營收失敗",
				body: rev.data.message
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "overflow-x-auto rounded-lg border border-border",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full min-w-[640px] text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "bg-secondary text-left text-xs text-muted-foreground",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2",
								children: "所屬期間"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2",
								children: "公布"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 text-right",
								children: "當月營收"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 text-right",
								children: "年增"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 text-right",
								children: "月增"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 text-right",
								children: "累計年增"
							})
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: (rev.data && rev.data.ok ? rev.data.data : []).slice(0, 18).map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-t border-border",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2 tabular",
								children: r.period
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2 text-xs",
								children: r.publishedAt?.slice(0, 10) ?? "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2 text-right tabular",
								children: formatTwd(r.revenue)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2 text-right tabular",
								children: formatPct(r.revenueYoyPct)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2 text-right tabular",
								children: formatPct(r.revenueMomPct)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2 text-right tabular",
								children: formatPct(r.ytdYoyPct)
							})
						]
					}, r.period)) })]
				}), rev.data && rev.data.ok && rev.data.data.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "px-3 py-6 text-sm text-muted-foreground",
					children: "此代號不在上市月營收表（可能為 ETF 或上櫃）。來源：t187ap05_L。"
				}) : null]
			})
		]
	});
}
function FlowPanel({ symbol, asOf }) {
	const inst = useQuery({
		queryKey: [
			"inst",
			symbol,
			asOf
		],
		queryFn: () => getInstitution({ data: {
			symbol,
			date: asOf
		} })
	});
	const margin = useQuery({
		queryKey: [
			"margin",
			symbol,
			asOf
		],
		queryFn: () => getMargin({ data: {
			symbol,
			date: asOf
		} })
	});
	const instRow = inst.data && inst.data.ok ? inst.data.data : null;
	const mRow = margin.data && margin.data.ok ? margin.data.data : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			inst.data && !inst.data.ok ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: inst.data.message
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meta, {
						label: "外資買賣超（股）",
						value: formatNumber(instRow?.foreignNetShares ?? null)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meta, {
						label: "投信買賣超（股）",
						value: formatNumber(instRow?.investmentTrustNetShares ?? null)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meta, {
						label: "自營商買賣超（股）",
						value: formatNumber(instRow?.dealerNetShares ?? null)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meta, {
						label: "三大法人合計",
						value: formatNumber(instRow?.totalNetShares ?? null)
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs text-muted-foreground",
				children: [
					"籌碼日期 ",
					instRow?.asOf ?? "無此代號紀錄",
					" · 來源 ",
					instRow?.source ?? "TWSE T86 / TPEx"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meta, {
					label: "融資餘額（張）",
					value: formatNumber(mRow?.marginBuyBalance ?? null)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meta, {
					label: "融券餘額（張）",
					value: formatNumber(mRow?.shortSellBalance ?? null)
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs text-muted-foreground",
				children: [
					"融資融券來源 TWSE MI_MARGN，日期 ",
					mRow?.asOf ?? "無",
					"。缺少即顯示無資料，不以 AI 填補。"
				]
			})
		]
	});
}
function EventPanel({ symbol }) {
	const actions = useQuery({
		queryKey: ["actions"],
		queryFn: () => getActions()
	});
	const mine = actions.data && actions.data.ok ? actions.data.data.filter((a) => a.symbol === symbol) : [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mb-3 text-sm text-muted-foreground",
		children: "第一版事件來自除權息預告（TWT48U_ALL），不是新聞快訊。即時新聞供應商尚未授權接入。"
	}), mine.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "rounded-lg border border-border bg-card px-4 py-8 text-sm text-muted-foreground",
		children: "此標的近期無除權息資料。"
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "space-y-2",
		children: mine.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
			className: "rounded-md border border-border bg-card px-4 py-3 text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "font-medium",
				children: [
					a.date,
					" · ",
					a.kind
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "text-muted-foreground",
				children: [
					"現金股利 ",
					formatNumber(a.cashDividend, 4),
					" · 來源 ",
					a.source
				]
			})]
		}, `${a.symbol}-${a.date}`))
	})] });
}
function AiPanel({ market, symbol, name, payload }) {
	const [horizon, setHorizon] = (0, import_react.useState)("3 至 6 個月");
	const [includeHoldings, setIncludeHoldings] = (0, import_react.useState)(false);
	const [text, setText] = (0, import_react.useState)(null);
	const [meta, setMeta] = (0, import_react.useState)("");
	const run = useMutation({
		mutationFn: async () => {
			const settings = await getSettings();
			const cacheKey = `${market}:${symbol}:${JSON.stringify(payload).length + ":" + payload.snapshot?.asOf}:${PROMPT_VERSION}:${settings.aiModel || "grok-4.5"}`;
			const cached = await readAi(cacheKey);
			if (cached) return {
				...cached,
				cached: true
			};
			const res = await runResearch({ data: {
				symbol,
				name,
				market,
				horizon,
				includeHoldings,
				payload: JSON.stringify(payload),
				provider: {
					baseUrl: settings.aiBaseUrl || void 0,
					model: settings.aiModel || void 0
				}
			} });
			if (!res.ok) throw new Error(res.error);
			await cacheAi(cacheKey, {
				text: res.text,
				model: res.model,
				analyzedAt: res.analyzedAt
			});
			return {
				text: res.text,
				model: res.model,
				analyzedAt: res.analyzedAt,
				cached: false
			};
		},
		onSuccess: (r) => {
			setText(r.text);
			setMeta(`${r.model} · ${formatDateTimeTaipei(r.analyzedAt)} · ${r.cached ? "快取" : "新分析"} · 提示詞 ${PROMPT_VERSION}`);
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4 rounded-lg border border-border bg-card p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "AI 只解釋系統已取得的資料，不保證獲利。沒有金鑰時，其餘功能仍可使用。分析前不會把持股送出，除非你開啟授權。"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 md:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mb-1 block text-xs text-muted-foreground",
						children: "投資期間"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: horizon,
						onChange: (e) => setHorizon(e.target.value)
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "flex items-center gap-3 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
						checked: includeHoldings,
						onCheckedChange: setIncludeHoldings
					}), "授權把持股摘要傳給 AI"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				onClick: () => run.mutate(),
				disabled: run.isPending,
				children: run.isPending ? "分析中…" : "產生研究"
			}),
			run.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-up",
				children: run.error.message
			}) : null,
			meta ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-faint",
				children: meta
			}) : null,
			text ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", {
				className: "prose-none whitespace-pre-wrap text-sm leading-relaxed",
				children: text
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
				readOnly: true,
				placeholder: "研究報告會顯示在這裡。數值以畫面指標為準，不以模型重算。"
			})
		]
	});
}
function WatchButton({ market, symbol }) {
	const qc = useQueryClient();
	const q = useQuery({
		queryKey: ["watch-local"],
		queryFn: async () => {
			await seedIfNeeded();
			return listWatch();
		}
	});
	const exists = q.data?.some((w) => w.market === market && w.symbol === symbol);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
		variant: "outline",
		onClick: async () => {
			if (exists) return;
			await saveWatch({
				id: crypto.randomUUID(),
				groupId: "default",
				market,
				symbol,
				note: "",
				sort: (q.data?.length ?? 0) + 1,
				createdAt: (/* @__PURE__ */ new Date()).toISOString()
			});
			qc.invalidateQueries({ queryKey: ["watch-local"] });
		},
		children: exists ? "已在自選" : "加入自選"
	});
}
//#endregion
export { StockPage as component };
