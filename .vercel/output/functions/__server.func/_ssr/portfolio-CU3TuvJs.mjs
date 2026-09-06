import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { c as getUniverse, s as getOverview } from "./market-v4c-0q29.mjs";
import { t as X } from "../_libs/lucide-react.mjs";
import { i as useQueryClient, n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { T as saveTxn, _ as listTxns, b as replaceTxns, c as deleteTxn, d as getSettings } from "./router-befYNiLd.mjs";
import { a as Input, d as formatNumber, f as formatPct, g as formatTwd, h as formatSigned, l as cn, n as Button, o as PageTitle, p as formatPrice, r as EmptyState, s as changeArrow, t as AppShell } from "./app-shell-Cb07mbk-.mjs";
import { a as DialogPortal, i as DialogOverlay, n as DialogClose, o as DialogTitle$1, r as DialogContent$1, t as Dialog$1 } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-CY3xUbe0.mjs";
import { t as Textarea } from "./textarea-JIAiD--g.mjs";
import { t as toneClass } from "./tone-BNEWv1zg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/portfolio-CU3TuvJs.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Dialog = Dialog$1;
function DialogContent({ className, children, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, { className: "fixed inset-0 z-50 bg-black/50" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent$1, {
		className: cn("fixed left-1/2 top-1/2 z-50 w-[min(560px,calc(100vw-1.5rem))] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card p-5 shadow-lg", className),
		...props,
		children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogClose, {
			className: "absolute right-3 top-3 rounded-sm p-2 text-muted-foreground hover:bg-secondary",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "sr-only",
				children: "關閉"
			})]
		})]
	})] });
}
function DialogTitle({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle$1, {
		className: cn("text-base font-semibold", className),
		...props
	});
}
/**
* Cost method: moving average (加權平均成本).
*
* Buy: cost += price * shares + fee + tax; shares += shares.
* Sell: realized += (net proceeds − avgCost * shares); shares −= shares;
*       remaining cost = avgCost * remaining shares.
* Dividend (cash): realized += cash (price field * shares field, or price as cash amount
*       if shares === 0). Does not reduce cost basis.
* Split: shares *= price (ratio), avgCost /= ratio. price field stores the split factor.
* Fee-only: realized -= fee.
*
* Shares are actual shares (股), not lots (張).
*/
var COST_METHOD_LABEL = "加權平均成本";
function applyTransactions(txns) {
	const sorted = [...txns].sort((a, b) => {
		const d = a.tradeDate.localeCompare(b.tradeDate);
		if (d !== 0) return d;
		return a.createdAt.localeCompare(b.createdAt);
	});
	const map = /* @__PURE__ */ new Map();
	for (const t of sorted) {
		const key = `${t.market}:${t.symbol}`;
		const pos = map.get(key) ?? {
			market: t.market,
			symbol: t.symbol,
			name: t.name,
			shares: 0,
			cost: 0,
			realized: 0
		};
		pos.name = t.name || pos.name;
		switch (t.side) {
			case "buy":
				pos.cost += t.price * t.shares + t.fee + t.tax;
				pos.shares += t.shares;
				break;
			case "sell": {
				const sellShares = Math.min(t.shares, pos.shares);
				const avg = pos.shares > 0 ? pos.cost / pos.shares : 0;
				const proceeds = t.price * sellShares - t.fee - t.tax;
				pos.realized += proceeds - avg * sellShares;
				pos.shares -= sellShares;
				pos.cost = avg * pos.shares;
				if (pos.shares <= 1e-9) {
					pos.shares = 0;
					pos.cost = 0;
				}
				break;
			}
			case "dividend": {
				const cash = t.shares > 0 ? t.price * t.shares : t.price;
				pos.realized += cash - t.fee - t.tax;
				break;
			}
			case "split": {
				const ratio = t.price;
				if (ratio > 0) pos.shares *= ratio;
				break;
			}
			case "fee": pos.realized -= t.fee;
		}
		map.set(key, pos);
	}
	return map;
}
function holdingsFrom(txns, marks) {
	const positions = applyTransactions(txns);
	const holdings = [];
	let totalCost = 0;
	let totalMtm = 0;
	let cashflowRealized = 0;
	for (const pos of positions.values()) {
		cashflowRealized += pos.realized;
		if (pos.shares <= 0) continue;
		const mark = marks.get(`${pos.market}:${pos.symbol}`);
		const marketPrice = mark?.price ?? null;
		const avgCost = pos.shares > 0 ? pos.cost / pos.shares : 0;
		const marketValue = marketPrice == null ? null : marketPrice * pos.shares;
		const unrealized = marketValue == null ? null : marketValue - pos.cost;
		const unrealizedPct = unrealized == null || pos.cost === 0 ? null : unrealized / pos.cost * 100;
		totalCost += pos.cost;
		if (marketValue != null) totalMtm += marketValue;
		holdings.push({
			market: pos.market,
			symbol: pos.symbol,
			name: mark?.name || pos.name,
			shares: pos.shares,
			avgCost,
			marketPrice,
			marketValue,
			cost: pos.cost,
			unrealized,
			unrealizedPct,
			realized: pos.realized,
			weight: null
		});
	}
	const denom = totalMtm > 0 ? totalMtm : totalCost;
	for (const h of holdings) {
		const v = h.marketValue ?? h.cost;
		h.weight = denom > 0 ? v / denom * 100 : null;
	}
	holdings.sort((a, b) => (b.marketValue ?? b.cost) - (a.marketValue ?? a.cost));
	return {
		holdings,
		cashflowRealized,
		totalCost,
		totalMtm
	};
}
var SIDE_MAP = {
	buy: "buy",
	買: "buy",
	買進: "buy",
	sell: "sell",
	賣: "sell",
	賣出: "sell",
	dividend: "dividend",
	股息: "dividend",
	股利: "dividend",
	split: "split",
	分割: "split",
	拆股: "split",
	fee: "fee",
	費用: "fee"
};
function parsePortfolioCsv(text) {
	const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
	if (lines.length === 0) return {
		rows: [],
		issues: [{
			row: 0,
			message: "檔案是空的"
		}]
	};
	const header = splitCsv(lines[0]).map((h) => h.trim().toLowerCase());
	const idx = (names) => header.findIndex((h) => names.includes(h));
	const iDate = idx([
		"date",
		"trade_date",
		"日期",
		"成交日"
	]);
	const iMarket = idx(["market", "市場"]);
	const iSymbol = idx([
		"symbol",
		"code",
		"代號",
		"股票代號"
	]);
	const iName = idx(["name", "名稱"]);
	const iSide = idx([
		"side",
		"買賣",
		"方向",
		"類型"
	]);
	const iShares = idx([
		"shares",
		"qty",
		"股數",
		"數量"
	]);
	const iPrice = idx([
		"price",
		"價格",
		"成交價"
	]);
	const iFee = idx(["fee", "手續費"]);
	const iTax = idx([
		"tax",
		"交易稅",
		"稅"
	]);
	const iNote = idx(["note", "備註"]);
	const issues = [];
	if (iDate < 0 || iSymbol < 0 || iSide < 0 || iShares < 0 || iPrice < 0) {
		issues.push({
			row: 1,
			message: "缺少必要欄位。需要：日期, 代號, 方向, 股數, 價格（可用中英欄名）。"
		});
		return {
			rows: [],
			issues
		};
	}
	const rows = [];
	for (let r = 1; r < lines.length; r += 1) {
		const cols = splitCsv(lines[r]);
		const sideRaw = (cols[iSide] ?? "").trim();
		const side = SIDE_MAP[sideRaw.toLowerCase()] ?? SIDE_MAP[sideRaw];
		if (!side) {
			issues.push({
				row: r + 1,
				message: `無法辨識方向「${sideRaw}」`
			});
			continue;
		}
		const symbol = (cols[iSymbol] ?? "").trim();
		if (!symbol) {
			issues.push({
				row: r + 1,
				message: "缺少代號"
			});
			continue;
		}
		const shares = Number(String(cols[iShares] ?? "").replace(/,/g, ""));
		const price = Number(String(cols[iPrice] ?? "").replace(/,/g, ""));
		if (!Number.isFinite(shares) || !Number.isFinite(price)) {
			issues.push({
				row: r + 1,
				message: "股數或價格不是數字"
			});
			continue;
		}
		const marketRaw = iMarket >= 0 ? (cols[iMarket] ?? "").trim().toUpperCase() : "TWSE";
		const market = marketRaw === "TPEX" || marketRaw === "OTC" || marketRaw === "上櫃" ? "TPEX" : "TWSE";
		rows.push({
			tradeDate: normalizeDate(cols[iDate] ?? ""),
			market,
			symbol,
			name: iName >= 0 ? (cols[iName] ?? "").trim() : "",
			side,
			shares,
			price,
			fee: numOr0(iFee >= 0 ? cols[iFee] : "0"),
			tax: numOr0(iTax >= 0 ? cols[iTax] : "0"),
			note: iNote >= 0 ? (cols[iNote] ?? "").trim() : ""
		});
	}
	return {
		rows,
		issues
	};
}
function numOr0(v) {
	const n = Number(String(v ?? "0").replace(/,/g, ""));
	return Number.isFinite(n) ? n : 0;
}
function normalizeDate(raw) {
	const s = raw.trim().replace(/\./g, "-").replace(/\//g, "-");
	const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
	if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
	return s;
}
function splitCsv(line) {
	const out = [];
	let cur = "";
	let q = false;
	for (let i = 0; i < line.length; i += 1) {
		const ch = line[i];
		if (ch === "\"") {
			if (q && line[i + 1] === "\"") {
				cur += "\"";
				i += 1;
			} else q = !q;
		} else if (ch === "," && !q) {
			out.push(cur);
			cur = "";
		} else cur += ch;
	}
	out.push(cur);
	return out;
}
function toCsv(txns) {
	return ["date,market,symbol,name,side,shares,price,fee,tax,note", ...txns.map((t) => [
		t.tradeDate,
		t.market,
		t.symbol,
		csvEscape(t.name),
		t.side,
		t.shares,
		t.price,
		t.fee,
		t.tax,
		csvEscape(t.note)
	].join(","))].join("\n");
}
function csvEscape(s) {
	if (/[",\n]/.test(s)) return `"${s.replace(/"/g, "\"\"")}"`;
	return s;
}
function PortfolioPage() {
	const qc = useQueryClient();
	const txnsQ = useQuery({
		queryKey: ["txns"],
		queryFn: listTxns
	});
	const settings = useQuery({
		queryKey: ["settings"],
		queryFn: getSettings
	});
	const overview = useQuery({
		queryKey: ["overview"],
		queryFn: () => getOverview()
	});
	const universe = useQuery({
		queryKey: ["universe"],
		queryFn: () => getUniverse()
	});
	const convention = settings.data?.colorConvention ?? "tw";
	const quotes = universe.data && universe.data.ok ? universe.data.data.quotes : overview.data && overview.data.ok ? overview.data.data.quotes : [];
	const marks = (0, import_react.useMemo)(() => {
		const m = /* @__PURE__ */ new Map();
		for (const q of quotes) m.set(`${q.market}:${q.symbol}`, {
			price: q.close,
			name: q.name
		});
		return m;
	}, [quotes]);
	const model = (0, import_react.useMemo)(() => holdingsFrom(txnsQ.data ?? [], marks), [txnsQ.data, marks]);
	const [open, setOpen] = (0, import_react.useState)(false);
	const [csvOpen, setCsvOpen] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageTitle, {
			kicker: "投資組合",
			title: "持股與損益",
			actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					onClick: () => setCsvOpen(true),
					children: "CSV"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: () => setOpen(true),
					children: "新增紀錄"
				})]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mb-4 text-sm text-muted-foreground",
			children: [
				"成本算法：",
				COST_METHOD_LABEL,
				"。買進成本含手續費與交易稅；賣出淨額扣除費用後計算已實現損益；現金股利計入已實現、不降低成本。幣別 TWD，未接匯率。第一版不串接下單。"
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3 sm:grid-cols-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: "市值",
					value: formatTwd(model.totalMtm)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: "成本",
					value: formatTwd(model.totalCost)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: "未實現損益",
					value: formatSigned(model.totalMtm - model.totalCost, 0),
					tone: model.totalMtm - model.totalCost,
					convention
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-2 text-sm text-muted-foreground",
			children: ["已實現損益 ", formatTwd(model.cashflowRealized)]
		}),
		model.holdings.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-6",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				title: "尚無持股",
				body: "新增買進紀錄或匯入 CSV。重啟瀏覽器後資料仍在。"
			})
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-6 overflow-x-auto rounded-lg border border-border",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "w-full min-w-[800px] text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
					className: "bg-secondary text-left text-xs text-muted-foreground",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2",
							children: "標的"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 text-right",
							children: "股數"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 text-right",
							children: "均價"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 text-right",
							children: "市價"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 text-right",
							children: "未實現"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 text-right",
							children: "權重"
						})
					] })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: model.holdings.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					className: "border-t border-border",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-3 py-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								className: "underline-offset-4 hover:underline",
								to: "/stock/$market/$symbol",
								params: {
									market: h.market,
									symbol: h.symbol
								},
								children: [
									h.symbol,
									" ",
									h.name
								]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-3 py-2 text-right tabular",
							children: formatNumber(h.shares)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-3 py-2 text-right tabular",
							children: formatPrice(h.avgCost)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-3 py-2 text-right tabular",
							children: formatPrice(h.marketPrice)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
							className: `px-3 py-2 text-right tabular ${toneClass(h.unrealized, convention)}`,
							children: [
								changeArrow(h.unrealized),
								" ",
								formatTwd(h.unrealized),
								" (",
								formatPct(h.unrealizedPct),
								")"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-3 py-2 text-right tabular",
							children: formatPct(h.weight, false)
						})
					]
				}, `${h.market}-${h.symbol}`)) })]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mt-8 mb-3 text-sm font-medium",
			children: "交易明細"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TxnTable, {
			rows: txnsQ.data ?? [],
			onDelete: async (id) => {
				await deleteTxn(id);
				qc.invalidateQueries({ queryKey: ["txns"] });
			}
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TradeDialog, {
			open,
			onOpenChange: setOpen,
			onSave: async (t) => {
				await saveTxn(t);
				qc.invalidateQueries({ queryKey: ["txns"] });
				setOpen(false);
			}
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CsvDialog, {
			open: csvOpen,
			onOpenChange: setCsvOpen,
			existing: txnsQ.data ?? [],
			onReplace: async (rows) => {
				await replaceTxns(rows);
				qc.invalidateQueries({ queryKey: ["txns"] });
				setCsvOpen(false);
			}
		})
	] });
}
function Stat({ label, value, tone, convention }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg border border-border bg-card p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-xs text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: `mt-2 tabular text-xl font-medium ${tone != null ? toneClass(tone, convention ?? "tw") : ""}`,
			children: value
		})]
	});
}
function TxnTable({ rows, onDelete }) {
	if (!rows.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted-foreground",
		children: "尚無交易。"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "overflow-x-auto rounded-lg border border-border",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
			className: "w-full min-w-[720px] text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
				className: "bg-secondary text-xs text-muted-foreground",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-3 py-2 text-left",
						children: "日期"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-3 py-2 text-left",
						children: "方向"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-3 py-2 text-left",
						children: "代號"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-3 py-2 text-right",
						children: "股數"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-3 py-2 text-right",
						children: "價格"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-3 py-2 text-right",
						children: "費用"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {})
				] })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
				className: "border-t border-border",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-3 py-2 tabular",
						children: t.tradeDate
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-3 py-2",
						children: sideLabel(t.side)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-3 py-2 tabular",
						children: t.symbol
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-3 py-2 text-right tabular",
						children: formatNumber(t.shares)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-3 py-2 text-right tabular",
						children: formatPrice(t.price)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-3 py-2 text-right tabular",
						children: formatNumber(t.fee + t.tax)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-3 py-2 text-right",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "text-xs text-muted-foreground underline",
							onClick: () => onDelete(t.id),
							children: "刪除"
						})
					})
				]
			}, t.id)) })]
		})
	});
}
function sideLabel(s) {
	return {
		buy: "買進",
		sell: "賣出",
		dividend: "股息",
		split: "拆併股",
		fee: "費用"
	}[s];
}
function TradeDialog({ open, onOpenChange, onSave }) {
	const [side, setSide] = (0, import_react.useState)("buy");
	const [market, setMarket] = (0, import_react.useState)("TWSE");
	const [symbol, setSymbol] = (0, import_react.useState)("2330");
	const [name, setName] = (0, import_react.useState)("");
	const [shares, setShares] = (0, import_react.useState)("1000");
	const [price, setPrice] = (0, import_react.useState)("");
	const [fee, setFee] = (0, import_react.useState)("0");
	const [tax, setTax] = (0, import_react.useState)("0");
	const [date, setDate] = (0, import_react.useState)((/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
	const [note, setNote] = (0, import_react.useState)("");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "新增交易" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid gap-3 sm:grid-cols-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "日期",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "date",
							value: date,
							onChange: (e) => setDate(e.target.value)
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "方向",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: side,
							onValueChange: (v) => setSide(v),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: "buy",
									children: "買進"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: "sell",
									children: "賣出"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: "dividend",
									children: "股息"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: "split",
									children: "拆併股（價格填倍數）"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: "fee",
									children: "費用"
								})
							] })]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "市場",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: market,
							onValueChange: (v) => setMarket(v),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "TWSE",
								children: "上市"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "TPEX",
								children: "上櫃"
							})] })]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "代號",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: symbol,
							onChange: (e) => setSymbol(e.target.value)
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "名稱",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: name,
							onChange: (e) => setName(e.target.value)
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "股數",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: shares,
							onChange: (e) => setShares(e.target.value)
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "價格",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: price,
							onChange: (e) => setPrice(e.target.value)
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "手續費",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: fee,
							onChange: (e) => setFee(e.target.value)
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "交易稅",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: tax,
							onChange: (e) => setTax(e.target.value)
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "備註",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: note,
					onChange: (e) => setNote(e.target.value)
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "mt-4 w-full",
				onClick: () => onSave({
					id: crypto.randomUUID(),
					market,
					symbol: symbol.trim(),
					name,
					side,
					shares: Number(shares) || 0,
					price: Number(price) || 0,
					fee: Number(fee) || 0,
					tax: Number(tax) || 0,
					tradeDate: date,
					note,
					createdAt: (/* @__PURE__ */ new Date()).toISOString()
				}),
				children: "儲存"
			})
		] })
	});
}
function Field({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block text-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mb-1 block text-xs text-muted-foreground",
			children: label
		}), children]
	});
}
function CsvDialog({ open, onOpenChange, existing, onReplace }) {
	const [text, setText] = (0, import_react.useState)("");
	const parsed = text ? parsePortfolioCsv(text) : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-h-[80vh] overflow-y-auto",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "CSV 匯入／匯出" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "欄位：date,market,symbol,name,side,shares,price,fee,tax,note"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 flex gap-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						onClick: () => {
							const blob = new Blob([toCsv(existing)], { type: "text/csv;charset=utf-8" });
							const a = document.createElement("a");
							a.href = URL.createObjectURL(blob);
							a.download = "hengyan-portfolio.csv";
							a.click();
						},
						children: "匯出目前持股交易"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					className: "mt-3",
					value: text,
					onChange: (e) => setText(e.target.value),
					placeholder: "貼上 CSV"
				}),
				parsed ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							"預覽 ",
							parsed.rows.length,
							" 列，問題 ",
							parsed.issues.length,
							" 則"
						] }),
						parsed.issues.slice(0, 6).map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-up",
							children: [
								"第 ",
								i.row,
								" 列：",
								i.message
							]
						}, i.row)),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "mt-3",
							disabled: !parsed.rows.length,
							onClick: () => onReplace(parsed.rows.map((r) => ({
								id: crypto.randomUUID(),
								...r,
								createdAt: (/* @__PURE__ */ new Date()).toISOString()
							}))),
							children: "驗證後覆蓋匯入"
						})
					]
				}) : null
			]
		})
	});
}
//#endregion
export { PortfolioPage as component };
