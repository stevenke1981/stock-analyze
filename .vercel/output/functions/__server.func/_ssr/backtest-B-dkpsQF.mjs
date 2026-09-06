import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { r as getHistory } from "./market-v4c-0q29.mjs";
import { t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { a as Input, d as formatNumber, f as formatPct, g as formatTwd, n as Button, o as PageTitle, p as formatPrice, t as AppShell } from "./app-shell-Cb07mbk-.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-CY3xUbe0.mjs";
import { n as rsi, r as sma } from "./indicators-C1kmH5qJ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/backtest-B-dkpsQF.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var DEFAULTS = {
	strategy: "sma_cross",
	fast: 20,
	slow: 60,
	rsiPeriod: 14,
	rsiBuy: 30,
	rsiSell: 70,
	initialCash: 1e6,
	commissionRate: .001425,
	sellTaxRate: .003,
	slippageBps: 5,
	lotShares: 1e3
};
function runBacktest(bars, partial) {
	const params = {
		...DEFAULTS,
		...partial
	};
	const warnings = [
		"回測結果不構成未來報酬保證。",
		"官方日K為原始價格，除權息與拆併股未還原，長期績效可能失真。",
		"訊號用收盤價、成交用次日開盤，避免以同一根收盤價成交的前視偏誤。"
	];
	if (bars.length < 80) warnings.push(`K 線僅 ${bars.length} 根，統計不穩定。`);
	const closes = bars.map((b) => b.close);
	const signals = Array(bars.length).fill("hold");
	if (params.strategy === "sma_cross") {
		const fast = sma(closes, params.fast ?? 20);
		const slow = sma(closes, params.slow ?? 60);
		for (let i = 1; i < bars.length; i += 1) {
			if (fast[i] == null || slow[i] == null || fast[i - 1] == null || slow[i - 1] == null) continue;
			const prevDiff = fast[i - 1] - slow[i - 1];
			const diff = fast[i] - slow[i];
			if (prevDiff <= 0 && diff > 0) signals[i] = "buy";
			else if (prevDiff >= 0 && diff < 0) signals[i] = "sell";
		}
	} else {
		const r = rsi(closes, params.rsiPeriod ?? 14);
		const buyTh = params.rsiBuy ?? 30;
		const sellTh = params.rsiSell ?? 70;
		for (let i = 1; i < bars.length; i += 1) {
			if (r[i] == null || r[i - 1] == null) continue;
			if (r[i - 1] >= buyTh && r[i] < buyTh) signals[i] = "buy";
			else if (r[i - 1] <= sellTh && r[i] > sellTh) signals[i] = "sell";
		}
	}
	let cash = params.initialCash;
	let shares = 0;
	let entryPrice = 0;
	let entryDate = "";
	const trades = [];
	const equity = [];
	let peak = params.initialCash;
	let maxDd = 0;
	const slip = params.slippageBps / 1e4;
	for (let i = 0; i < bars.length; i += 1) {
		if (i > 0) {
			const sig = signals[i - 1];
			const bar = bars[i];
			const tradable = bar.open > 0;
			if (tradable && sig === "buy" && shares === 0) {
				const px = bar.open * (1 + slip);
				const affordable = Math.floor(cash / (px * (1 + params.commissionRate) * params.lotShares)) * params.lotShares;
				if (affordable >= params.lotShares) {
					const fee = px * affordable * params.commissionRate;
					cash -= px * affordable + fee;
					shares = affordable;
					entryPrice = px;
					entryDate = bar.time;
				}
			} else if (tradable && sig === "sell" && shares > 0) {
				const px = bar.open * (1 - slip);
				const proceeds = px * shares;
				const fee = proceeds * params.commissionRate;
				const tax = proceeds * params.sellTaxRate;
				cash += proceeds - fee - tax;
				const pnl = proceeds - fee - tax - entryPrice * shares;
				trades.push({
					entryDate,
					entryPrice,
					exitDate: bar.time,
					exitPrice: px,
					shares,
					pnl,
					returnPct: entryPrice > 0 ? pnl / (entryPrice * shares) * 100 : null,
					reason: params.strategy === "sma_cross" ? "均線死叉賣出" : "RSI 超買賣出"
				});
				shares = 0;
				entryPrice = 0;
				entryDate = "";
			}
		}
		const mtm = cash + shares * bars[i].close;
		peak = Math.max(peak, mtm);
		const dd = peak > 0 ? (peak - mtm) / peak * 100 : 0;
		maxDd = Math.max(maxDd, dd);
		equity.push({
			date: bars[i].time,
			equity: mtm,
			drawdownPct: dd
		});
	}
	if (shares > 0 && bars.length) {
		const pnl = bars[bars.length - 1].close * shares - entryPrice * shares;
		trades.push({
			entryDate,
			entryPrice,
			exitDate: null,
			exitPrice: null,
			shares,
			pnl,
			returnPct: entryPrice > 0 ? pnl / (entryPrice * shares) * 100 : null,
			reason: "期末未平倉（以最後收盤評價，非成交）"
		});
		warnings.push("期末持倉以最後收盤評價，不是真實成交。");
	}
	const startEq = params.initialCash;
	const endEq = equity.at(-1)?.equity ?? startEq;
	const totalReturnPct = startEq > 0 ? (endEq - startEq) / startEq * 100 : null;
	const start = bars[0]?.time ?? null;
	const end = bars.at(-1)?.time ?? null;
	let cagrPct = null;
	if (start && end && startEq > 0) {
		const years = ((/* @__PURE__ */ new Date(`${end}T00:00:00+08:00`)).getTime() - (/* @__PURE__ */ new Date(`${start}T00:00:00+08:00`)).getTime()) / 315576e5;
		if (years >= 1) cagrPct = (Math.pow(endEq / startEq, 1 / years) - 1) * 100;
		else warnings.push("期間未滿一年，不揭示年化報酬。");
	}
	const closed = trades.filter((t) => t.exitDate);
	const wins = closed.filter((t) => (t.pnl ?? 0) > 0).length;
	const winRate = closed.length ? wins / closed.length * 100 : null;
	const bench = bars.length >= 2 && bars[0].close > 0 ? (bars[bars.length - 1].close - bars[0].close) / bars[0].close * 100 : null;
	return {
		params,
		method: "訊號於當日收盤形成，次一交易日開盤成交；不含未提供的歷史股利與公司行動。",
		start,
		end,
		bars: bars.length,
		totalReturnPct,
		cagrPct,
		maxDrawdownPct: equity.length ? maxDd : null,
		winRate,
		tradeCount: closed.length,
		benchmarkReturnPct: bench,
		equity,
		trades,
		warnings
	};
}
function BacktestPage() {
	const [market, setMarket] = (0, import_react.useState)("TWSE");
	const [symbol, setSymbol] = (0, import_react.useState)("2330");
	const [strategy, setStrategy] = (0, import_react.useState)("sma_cross");
	const [fast, setFast] = (0, import_react.useState)("20");
	const [slow, setSlow] = (0, import_react.useState)("60");
	const [cash, setCash] = (0, import_react.useState)("1000000");
	const [result, setResult] = (0, import_react.useState)(null);
	const [netMs, setNetMs] = (0, import_react.useState)(null);
	const [cpuMs, setCpuMs] = (0, import_react.useState)(null);
	const run = useMutation({
		mutationFn: async () => {
			const t0 = performance.now();
			const hist = await getHistory({ data: {
				market,
				symbol,
				months: 24
			} });
			const t1 = performance.now();
			if (!hist.ok) throw new Error(hist.message);
			const t2 = performance.now();
			const r = runBacktest(hist.data, {
				strategy,
				fast: Number(fast),
				slow: Number(slow),
				initialCash: Number(cash)
			});
			const t3 = performance.now();
			setNetMs(t1 - t0);
			setCpuMs(t3 - t2);
			return r;
		},
		onSuccess: setResult
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageTitle, {
			kicker: "策略回測",
			title: "可解釋策略"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-4 max-w-3xl text-sm text-muted-foreground",
			children: "訊號於當日收盤形成，次一交易日開盤成交。預設手續費 0.1425%、賣出交易稅 0.3%、滑價 5 bps、整張交易。結果不是未來保證。官方日K為原始價格，未還原除權息。"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap gap-3",
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
					value: strategy,
					onValueChange: (v) => setStrategy(v),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
						className: "w-40",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
						value: "sma_cross",
						children: "均線交叉"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
						value: "rsi_reversion",
						children: "RSI 反轉"
					})] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					className: "w-20",
					value: fast,
					onChange: (e) => setFast(e.target.value),
					"aria-label": "快線"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					className: "w-20",
					value: slow,
					onChange: (e) => setSlow(e.target.value),
					"aria-label": "慢線"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					className: "w-36",
					value: cash,
					onChange: (e) => setCash(e.target.value),
					"aria-label": "本金"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: () => run.mutate(),
					disabled: run.isPending,
					children: run.isPending ? "計算中…" : "執行回測"
				})
			]
		}),
		run.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 text-sm text-up",
			children: run.error.message
		}) : null,
		result ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-3 sm:grid-cols-3 lg:grid-cols-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
							label: "總報酬",
							value: formatPct(result.totalReturnPct)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
							label: "年化",
							value: result.cagrPct == null ? "不滿一年" : formatPct(result.cagrPct)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
							label: "最大回撤",
							value: formatPct(result.maxDrawdownPct == null ? null : -Math.abs(result.maxDrawdownPct))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
							label: "勝率",
							value: formatPct(result.winRate, false)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
							label: "交易次數",
							value: formatNumber(result.tradeCount)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
							label: "買進持有",
							value: formatPct(result.benchmarkReturnPct)
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs text-muted-foreground",
					children: [
						result.method,
						" 期間 ",
						result.start,
						" – ",
						result.end,
						" · K線 ",
						result.bars,
						" 根",
						netMs != null ? ` · 網路 ${netMs.toFixed(0)} ms` : "",
						cpuMs != null ? ` · 本機 ${cpuMs.toFixed(1)} ms` : ""
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "text-xs text-muted-foreground",
					children: result.warnings.map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: w }, w))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EquitySvg, { equity: result.equity }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto rounded-lg border border-border",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full min-w-[720px] text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "bg-secondary text-xs text-muted-foreground",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-3 py-2 text-left",
									children: "進場"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-3 py-2 text-left",
									children: "出場"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-3 py-2 text-right",
									children: "股數"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-3 py-2 text-right",
									children: "損益"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-3 py-2 text-left",
									children: "原因"
								})
							] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: result.trades.map((t, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-t border-border",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "px-3 py-2",
									children: [
										t.entryDate,
										" @ ",
										formatPrice(t.entryPrice)
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2",
									children: t.exitDate ? `${t.exitDate} @ ${formatPrice(t.exitPrice)}` : "未平倉"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2 text-right tabular",
									children: formatNumber(t.shares)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2 text-right tabular",
									children: formatTwd(t.pnl)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2 text-xs",
									children: t.reason
								})
							]
						}, i)) })]
					})
				})
			]
		}) : null
	] });
}
function Tile({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg border border-border bg-card p-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-[11px] text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-1 tabular text-lg",
			children: value
		})]
	});
}
function EquitySvg({ equity }) {
	if (equity.length < 2) return null;
	const w = 800;
	const h = 180;
	const min = Math.min(...equity.map((e) => e.equity));
	const span = Math.max(...equity.map((e) => e.equity)) - min || 1;
	const d = equity.map((e, i) => {
		const x = i / (equity.length - 1) * w;
		const y = h - (e.equity - min) / span * h;
		return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
	}).join(" ");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg border border-border bg-card p-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mb-2 text-xs text-muted-foreground",
			children: "資金曲線"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
			viewBox: `0 0 ${w} ${h}`,
			className: "h-44 w-full",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d,
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.6"
			})
		})]
	});
}
//#endregion
export { BacktestPage as component };
