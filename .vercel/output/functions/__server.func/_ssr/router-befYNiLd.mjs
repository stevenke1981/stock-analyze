import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { _ as createRootRoute, b as useRouter, g as createFileRoute, h as lazyRouteComponent, l as Scripts, m as Outlet, p as createRouter, u as HeadContent } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { a as object, i as number, o as string, r as literal, s as union } from "../_libs/zod.mjs";
import { c as getUniverse, s as getOverview } from "./market-v4c-0q29.mjs";
import { r as TriangleAlert } from "../_libs/lucide-react.mjs";
import { r as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-befYNiLd.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-red-500",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				children: "Something went wrong"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400",
				children: error.message || "An unexpected error occurred. Try reloading the page."
			})
		]
	});
}
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	if (typeof window === "undefined") return () => {};
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	const parentOrigin = resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		if (envelope.data.type === "hello") {
			if (!HelloSchema.safeParse(event.data).success) return;
			announce();
			return;
		}
		if (envelope.data.type === "navigate") {
			const parsed = NavigateSchema.safeParse(event.data);
			if (!parsed.success) return;
			navigate(parsed.data.path);
			queueMicrotask(reportLocation);
			return;
		}
		if (envelope.data.type === "history") {
			const parsed = HistorySchema.safeParse(event.data);
			if (!parsed.success) return;
			if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
			window.history.go(parsed.data.delta);
		}
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
var DB_NAME = "hengyan";
var DB_VERSION = 1;
var DEFAULT_SETTINGS = {
	colorConvention: "tw",
	theme: "dark",
	aiBaseUrl: "",
	aiModel: "grok-4.5",
	sendHoldings: false,
	seeded: false
};
function openDb() {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, DB_VERSION);
		req.onupgradeneeded = () => {
			const db = req.result;
			if (!db.objectStoreNames.contains("kv")) db.createObjectStore("kv");
			if (!db.objectStoreNames.contains("groups")) db.createObjectStore("groups", { keyPath: "id" });
			if (!db.objectStoreNames.contains("watch")) {
				const s = db.createObjectStore("watch", { keyPath: "id" });
				s.createIndex("by_group", "groupId");
				s.createIndex("by_symbol", ["market", "symbol"], { unique: false });
			}
			if (!db.objectStoreNames.contains("txns")) {
				const s = db.createObjectStore("txns", { keyPath: "id" });
				s.createIndex("by_symbol", ["market", "symbol"]);
				s.createIndex("by_date", "tradeDate");
			}
			if (!db.objectStoreNames.contains("notes")) db.createObjectStore("notes", { keyPath: "id" });
			if (!db.objectStoreNames.contains("alerts")) db.createObjectStore("alerts", { keyPath: "id" });
			if (!db.objectStoreNames.contains("screeners")) db.createObjectStore("screeners", { keyPath: "id" });
			if (!db.objectStoreNames.contains("bars")) db.createObjectStore("bars");
			if (!db.objectStoreNames.contains("ai")) db.createObjectStore("ai");
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}
function tx(store, mode, fn) {
	return openDb().then((db) => new Promise((resolve, reject) => {
		const t = db.transaction(store, mode);
		const req = fn(t.objectStore(store));
		t.oncomplete = () => resolve(req?.result);
		t.onerror = () => reject(t.error);
		if (req && "onsuccess" in req) {
			req.onsuccess = () => resolve(req.result);
			req.onerror = () => reject(req.error);
		}
	}));
}
function getAll(store) {
	return tx(store, "readonly", (s) => s.getAll());
}
async function getSettings() {
	return await tx("kv", "readonly", (s) => s.get("settings")) ?? DEFAULT_SETTINGS;
}
async function saveSettings(patch) {
	const next = {
		...await getSettings(),
		...patch
	};
	await tx("kv", "readwrite", (s) => s.put(next, "settings"));
	return next;
}
async function listGroups() {
	return (await getAll("groups")).sort((a, b) => a.sort - b.sort);
}
async function saveGroup(g) {
	await tx("groups", "readwrite", (s) => s.put(g));
}
async function listWatch() {
	return (await getAll("watch")).sort((a, b) => a.sort - b.sort);
}
async function saveWatch(item) {
	await tx("watch", "readwrite", (s) => s.put(item));
}
async function deleteWatch(id) {
	await tx("watch", "readwrite", (s) => s.delete(id));
}
async function listTxns() {
	return (await getAll("txns")).sort((a, b) => a.tradeDate.localeCompare(b.tradeDate));
}
async function saveTxn(t) {
	await tx("txns", "readwrite", (s) => s.put(t));
}
async function deleteTxn(id) {
	await tx("txns", "readwrite", (s) => s.delete(id));
}
async function replaceTxns(rows) {
	const db = await openDb();
	await new Promise((resolve, reject) => {
		const t = db.transaction("txns", "readwrite");
		t.objectStore("txns").clear();
		for (const r of rows) t.objectStore("txns").put(r);
		t.oncomplete = () => resolve();
		t.onerror = () => reject(t.error);
	});
}
async function listNotes() {
	return (await getAll("notes")).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
async function saveNote(n) {
	await tx("notes", "readwrite", (s) => s.put(n));
}
async function deleteNote(id) {
	await tx("notes", "readwrite", (s) => s.delete(id));
}
async function listAlerts() {
	return getAll("alerts");
}
async function saveAlert(a) {
	await tx("alerts", "readwrite", (s) => s.put(a));
}
async function listScreeners() {
	return getAll("screeners");
}
async function saveScreener(s) {
	await tx("screeners", "readwrite", (s0) => s0.put(s));
}
async function cacheAi(key, payload) {
	await tx("ai", "readwrite", (s) => s.put(payload, key));
}
async function readAi(key) {
	return await tx("ai", "readonly", (s) => s.get(key)) ?? null;
}
async function exportAll() {
	const [settings, groups, watch, txns, notes, alerts, screeners] = await Promise.all([
		getSettings(),
		listGroups(),
		listWatch(),
		listTxns(),
		listNotes(),
		listAlerts(),
		listScreeners()
	]);
	return JSON.stringify({
		v: 1,
		settings,
		groups,
		watch,
		txns,
		notes,
		alerts,
		screeners
	}, null, 2);
}
async function importAll(json) {
	const data = JSON.parse(json);
	if (data.settings) await saveSettings(data.settings);
	for (const g of data.groups ?? []) await saveGroup(g);
	for (const w of data.watch ?? []) await saveWatch(w);
	if (data.txns) await replaceTxns(data.txns);
	for (const n of data.notes ?? []) await saveNote(n);
	for (const a of data.alerts ?? []) await saveAlert(a);
	for (const s of data.screeners ?? []) await saveScreener(s);
}
async function seedIfNeeded() {
	if ((await getSettings()).seeded) return;
	const now = (/* @__PURE__ */ new Date()).toISOString();
	await saveGroup({
		id: "default",
		name: "核心觀察",
		sort: 0,
		createdAt: now
	});
	const seeds = [
		[
			"TWSE",
			"2330",
			"台積電"
		],
		[
			"TWSE",
			"2317",
			"鴻海"
		],
		[
			"TWSE",
			"2454",
			"聯發科"
		],
		[
			"TWSE",
			"2308",
			"台達電"
		],
		[
			"TWSE",
			"2412",
			"中華電"
		],
		[
			"TWSE",
			"2881",
			"富邦金"
		],
		[
			"TWSE",
			"0050",
			"元大台灣50"
		],
		[
			"TWSE",
			"00878",
			"國泰永續高股息"
		],
		[
			"TPEX",
			"6488",
			"環球晶"
		],
		[
			"TPEX",
			"5483",
			"中美晶"
		]
	];
	let i = 0;
	for (const [market, symbol] of seeds) {
		await saveWatch({
			id: crypto.randomUUID(),
			groupId: "default",
			market,
			symbol,
			note: "",
			sort: i,
			createdAt: now
		});
		i += 1;
	}
	await saveSettings({ seeded: true });
}
function applyTheme(theme) {
	const root = document.documentElement;
	const preferDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
	const dark = theme === "dark" || theme === "system" && preferDark;
	root.classList.toggle("dark", dark);
	root.dataset.theme = dark ? "dark" : "light";
}
var styles_default = "/assets/styles-BUI6lWzP.css";
var APP_NAME = "衡研";
var Route$10 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: APP_NAME },
			{
				name: "description",
				content: "台股投資研究與決策輔助。盤後資料，非即時行情，非投資建議。"
			},
			{
				name: "theme-color",
				content: "#0a0c0e"
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Noto+Sans+TC:wght@400;500;600&display=swap"
			}
		]
	}),
	component: RootDocument
});
function RootDocument() {
	const [client] = (0, import_react.useState)(() => new QueryClient({ defaultOptions: { queries: {
		staleTime: 3e4,
		retry: 1,
		refetchOnWindowFocus: false
	} } }));
	(0, import_react.useEffect)(() => {
		document.documentElement.classList.add("dark");
		getSettings().then((s) => applyTheme(s.theme)).catch(() => applyTheme("dark"));
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "zh-Hant",
		className: "dark antialiased",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(QueryClientProvider, {
				client,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
					theme: "system",
					position: "bottom-right"
				})]
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
		] })]
	});
}
var $$splitComponentImporter$9 = () => import("./routes-Q2vc8Tij.mjs");
var Route$9 = createFileRoute("/")({
	loader: async () => {
		const [overview, universe] = await Promise.all([getOverview(), getUniverse()]);
		return {
			overview,
			universe
		};
	},
	component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
var $$splitComponentImporter$8 = () => import("./alerts-z09U6R1w.mjs");
var Route$8 = createFileRoute("/alerts")({ component: lazyRouteComponent($$splitComponentImporter$8, "component") });
var $$splitComponentImporter$7 = () => import("./backtest-B-dkpsQF.mjs");
var Route$7 = createFileRoute("/backtest")({ component: lazyRouteComponent($$splitComponentImporter$7, "component") });
var $$splitComponentImporter$6 = () => import("./compare-ssKzk-U5.mjs");
var Route$6 = createFileRoute("/compare")({
	validateSearch: (s) => ({
		a: typeof s.a === "string" ? s.a : "TWSE:2330",
		b: typeof s.b === "string" ? s.b : "TWSE:2317"
	}),
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
var $$splitComponentImporter$5 = () => import("./notes-KHlwDWwX.mjs");
var Route$5 = createFileRoute("/notes")({ component: lazyRouteComponent($$splitComponentImporter$5, "component") });
var $$splitComponentImporter$4 = () => import("./portfolio-CU3TuvJs.mjs");
var Route$4 = createFileRoute("/portfolio")({ component: lazyRouteComponent($$splitComponentImporter$4, "component") });
var $$splitComponentImporter$3 = () => import("./screener-MZkuadi5.mjs");
var Route$3 = createFileRoute("/screener")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
var $$splitComponentImporter$2 = () => import("./settings-D9iWZpRd.mjs");
var Route$2 = createFileRoute("/settings")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
var $$splitComponentImporter$1 = () => import("./watchlist-CUrxtXnf.mjs");
var Route$1 = createFileRoute("/watchlist")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
var $$splitComponentImporter = () => import("./stock._market._symbol-B712wDgE.mjs");
var Route = createFileRoute("/stock/$market/$symbol")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var rootRouteChildren = {
	IndexRoute: Route$9.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$10
	}),
	AlertsRoute: Route$8.update({
		id: "/alerts",
		path: "/alerts",
		getParentRoute: () => Route$10
	}),
	BacktestRoute: Route$7.update({
		id: "/backtest",
		path: "/backtest",
		getParentRoute: () => Route$10
	}),
	CompareRoute: Route$6.update({
		id: "/compare",
		path: "/compare",
		getParentRoute: () => Route$10
	}),
	NotesRoute: Route$5.update({
		id: "/notes",
		path: "/notes",
		getParentRoute: () => Route$10
	}),
	PortfolioRoute: Route$4.update({
		id: "/portfolio",
		path: "/portfolio",
		getParentRoute: () => Route$10
	}),
	ScreenerRoute: Route$3.update({
		id: "/screener",
		path: "/screener",
		getParentRoute: () => Route$10
	}),
	SettingsRoute: Route$2.update({
		id: "/settings",
		path: "/settings",
		getParentRoute: () => Route$10
	}),
	WatchlistRoute: Route$1.update({
		id: "/watchlist",
		path: "/watchlist",
		getParentRoute: () => Route$10
	}),
	StockMarketSymbolRoute: Route.update({
		id: "/stock/$market/$symbol",
		path: "/stock/$market/$symbol",
		getParentRoute: () => Route$10
	})
};
var routeTree = Route$10._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { saveScreener as C, seedIfNeeded as D, saveWatch as E, saveNote as S, saveTxn as T, listTxns as _, applyTheme as a, replaceTxns as b, deleteTxn as c, getSettings as d, importAll as f, listScreeners as g, listNotes as h, Route$9 as i, deleteWatch as l, listGroups as m, Route as n, cacheAi as o, listAlerts as p, Route$6 as r, deleteNote as s, router_exports as t, exportAll as u, listWatch as v, saveSettings as w, saveAlert as x, readAi as y };
