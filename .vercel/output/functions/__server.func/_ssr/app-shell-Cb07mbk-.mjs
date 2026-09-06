import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { d as useRouterState, v as Link, y as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime, r as Slot } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { u as searchStocks } from "./market-v4c-0q29.mjs";
import { a as SlidersHorizontal, h as Bell, l as LayoutDashboard, m as Bookmark, n as Wallet, o as Settings, p as ChartCandlestick, s as Search, u as ClipboardList } from "../_libs/lucide-react.mjs";
import { l as taipeiParts, t as classifySession } from "./time-CNcmij1F.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/app-shell-Cb07mbk-.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-medium transition-[opacity,transform,background-color,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98] min-h-11 px-4", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground hover:opacity-90",
			secondary: "bg-secondary text-secondary-foreground hover:opacity-90",
			outline: "border border-border bg-transparent hover:bg-secondary",
			ghost: "hover:bg-secondary",
			destructive: "bg-destructive text-white hover:opacity-90",
			link: "text-foreground underline-offset-4 hover:underline min-h-0 px-0"
		},
		size: {
			default: "h-11",
			sm: "h-9 min-h-9 px-3 text-xs rounded-xs",
			lg: "h-12 px-5",
			icon: "size-11 p-0"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Button = import_react.forwardRef(({ className, variant, size, asChild, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		ref,
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
});
Button.displayName = "Button";
var Input = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
	ref,
	className: cn("flex h-11 w-full rounded-sm border border-border bg-card px-3 text-sm text-foreground placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40", className),
	...props
}));
Input.displayName = "Input";
var tw = new Intl.NumberFormat("zh-TW");
var tw1 = new Intl.NumberFormat("zh-TW", {
	minimumFractionDigits: 1,
	maximumFractionDigits: 1
});
var tw2 = new Intl.NumberFormat("zh-TW", {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2
});
function formatNumber(n, digits = 0) {
	if (n == null || Number.isNaN(n)) return "—";
	if (digits === 0) return tw.format(Math.round(n));
	if (digits === 1) return tw1.format(n);
	return new Intl.NumberFormat("zh-TW", {
		minimumFractionDigits: digits,
		maximumFractionDigits: digits
	}).format(n);
}
function formatPrice(n) {
	if (n == null || Number.isNaN(n)) return "—";
	return formatNumber(n, Math.abs(n) >= 1e3 ? 0 : Math.abs(n) >= 100 ? 1 : 2);
}
function formatPct(n, signed = true) {
	if (n == null || Number.isNaN(n)) return "—";
	const body = tw2.format(n);
	if (!signed) return `${body}%`;
	if (n > 0) return `+${body}%`;
	return `${body}%`;
}
function formatSigned(n, digits = 2) {
	if (n == null || Number.isNaN(n)) return "—";
	const body = formatNumber(n, digits);
	if (n > 0) return `+${body}`;
	return body;
}
function formatSharesAsLots(shares) {
	if (shares == null || Number.isNaN(shares)) return "—";
	const lots = shares / 1e3;
	if (Math.abs(lots) >= 1e4) return `${formatNumber(lots / 1e4, 2)} 萬張`;
	return `${formatNumber(lots, 0)} 張`;
}
function formatTwd(n) {
	if (n == null || Number.isNaN(n)) return "—";
	const abs = Math.abs(n);
	if (abs >= 0xe8d4a51000) return `${formatNumber(n / 0xe8d4a51000, 2)} 兆`;
	if (abs >= 1e8) return `${formatNumber(n / 1e8, 2)} 億`;
	if (abs >= 1e4) return `${formatNumber(n / 1e4, 2)} 萬`;
	return formatNumber(n, 0);
}
function sessionLabel(session) {
	switch (session) {
		case "regular": return "盤中";
		case "after_hours": return "盤後";
		case "holiday": return "休市";
		default: return "未開盤";
	}
}
function statusLabel(status) {
	switch (status) {
		case "realtime": return "即時";
		case "delayed": return "延遲";
		case "after_hours": return "盤後";
		case "stale": return "過期";
		default: return "無法取得";
	}
}
function changeTone(n, convention) {
	if (n == null || n === 0 || Number.isNaN(n)) return "flat";
	const up = n > 0;
	if (convention === "tw") return up ? "up" : "down";
	return up ? "down" : "up";
}
function changeArrow(n) {
	if (n == null || n === 0 || Number.isNaN(n)) return "→";
	return n > 0 ? "▲" : "▼";
}
function formatDateTimeTaipei(iso) {
	if (!iso) return "—";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	const p = taipeiParts(d);
	const pad = (n) => String(n).padStart(2, "0");
	return `${p.year}/${pad(p.month)}/${pad(p.day)} ${pad(p.hour)}:${pad(p.minute)}`;
}
var NAV = [
	{
		to: "/",
		label: "市場",
		icon: LayoutDashboard
	},
	{
		to: "/watchlist",
		label: "自選",
		icon: Bookmark
	},
	{
		to: "/portfolio",
		label: "持股",
		icon: Wallet
	},
	{
		to: "/screener",
		label: "選股",
		icon: SlidersHorizontal
	},
	{
		to: "/backtest",
		label: "回測",
		icon: ChartCandlestick
	},
	{
		to: "/notes",
		label: "筆記",
		icon: ClipboardList
	},
	{
		to: "/alerts",
		label: "提醒",
		icon: Bell
	},
	{
		to: "/settings",
		label: "設定",
		icon: Settings
	}
];
function AppShell({ children }) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const session = classifySession();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-background text-foreground",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "fixed inset-y-0 left-0 z-30 hidden w-52 border-r border-border bg-card/80 px-3 py-5 md:flex md:flex-col",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/",
						className: "mb-8 px-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "font-medium tracking-wide",
							children: "衡研"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-xs text-muted-foreground",
							children: "台股投資研究"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						className: "flex flex-1 flex-col gap-1",
						children: NAV.map((item) => {
							const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
							const Icon = item.icon;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: item.to,
								className: cn("flex min-h-11 items-center gap-2 rounded-sm px-3 text-sm", active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" }), item.label]
							}, item.to);
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "px-2 text-[11px] text-faint",
						children: "盤後資料 · 非即時 · 非投資建議"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "md:pl-52",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/",
							className: "md:hidden font-medium",
							children: "衡研"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StockSearch, {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "ml-auto hidden items-center gap-2 text-xs text-muted-foreground sm:flex",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: session ? sessionLabel(session) : "市場狀態確認中" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Asia/Taipei" })]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
					className: "px-4 py-5 pb-28 md:pb-8",
					children
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-card md:hidden",
				children: NAV.slice(0, 5).map((item) => {
					const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
					const Icon = item.icon;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: item.to,
						className: cn("flex min-h-14 flex-col items-center justify-center gap-1 text-[11px]", active ? "text-foreground" : "text-muted-foreground"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" }), item.label]
					}, item.to);
				})
			})
		]
	});
}
function StockSearch() {
	const navigate = useNavigate();
	const [q, setQ] = (0, import_react.useState)("");
	const [open, setOpen] = (0, import_react.useState)(false);
	const [hits, setHits] = (0, import_react.useState)([]);
	const [busy, setBusy] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!q.trim()) {
			setHits([]);
			return;
		}
		const t = setTimeout(() => {
			setBusy(true);
			searchStocks({ data: { q } }).then(setHits).catch(() => setHits([])).finally(() => setBusy(false));
		}, 220);
		return () => clearTimeout(t);
	}, [q]);
	const empty = (0, import_react.useMemo)(() => q.trim() && !busy && hits.length === 0, [
		q,
		busy,
		hits.length
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative w-full max-w-xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				value: q,
				onChange: (e) => {
					setQ(e.target.value);
					setOpen(true);
				},
				onFocus: () => setOpen(true),
				onBlur: () => setTimeout(() => setOpen(false), 180),
				placeholder: "搜尋代號或名稱",
				className: "pl-9",
				"aria-label": "搜尋股票"
			}),
			open && (hits.length > 0 || empty || busy) ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute top-[calc(100%+6px)] z-40 w-full overflow-hidden rounded-md border border-border bg-popover shadow-md",
				children: [
					busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "px-3 py-3 text-sm text-muted-foreground",
						children: "搜尋中…"
					}) : null,
					empty ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "px-3 py-3 text-sm text-muted-foreground",
						children: "沒有符合的標的"
					}) : null,
					hits.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: "flex w-full items-center justify-between px-3 py-3 text-left text-sm hover:bg-secondary",
						onMouseDown: (e) => e.preventDefault(),
						onClick: () => {
							setOpen(false);
							setQ("");
							navigate({
								to: "/stock/$market/$symbol",
								params: {
									market: h.market,
									symbol: h.symbol
								}
							});
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "tabular mr-2 font-medium",
							children: h.symbol
						}), h.name] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted-foreground",
							children: h.market === "TWSE" ? "上市" : "上櫃"
						})]
					}, `${h.market}-${h.symbol}`))
				]
			}) : null
		]
	});
}
function PageTitle({ kicker, title, actions }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-5 flex flex-wrap items-end justify-between gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [kicker ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mb-1 text-xs tracking-wide text-muted-foreground",
			children: kicker
		}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "text-2xl font-medium tracking-tight",
			children: title
		})] }), actions]
	});
}
function EmptyState({ title, body, action }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg border border-border bg-card px-5 py-10 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-sm font-medium",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mx-auto mt-2 max-w-md text-sm text-muted-foreground",
				children: body
			}),
			action ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4",
				children: action
			}) : null
		]
	});
}
function ErrorState({ title, body, onRetry }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg border border-border bg-card px-5 py-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-sm font-medium",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted-foreground",
				children: body
			}),
			onRetry ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "mt-4",
				variant: "outline",
				onClick: onRetry,
				children: "重試"
			}) : null
		]
	});
}
//#endregion
export { sessionLabel as _, Input as a, changeTone as c, formatNumber as d, formatPct as f, formatTwd as g, formatSigned as h, ErrorState as i, cn as l, formatSharesAsLots as m, Button as n, PageTitle as o, formatPrice as p, EmptyState as r, changeArrow as s, AppShell as t, formatDateTimeTaipei as u, statusLabel as v };
