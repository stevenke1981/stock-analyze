import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
import { a as object, i as number, o as string, t as _enum } from "../_libs/zod.mjs";
import { a as monthKeysGoingBack, c as rocToIso, i as isoToYmdSlash, l as taipeiParts, n as firstOfMonthIso, o as parseMarketDate, r as isoNow, s as recentWeekdaysIso, t as classifySession } from "./time-CNcmij1F.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/market-CPyO5pSf.js
var store = /* @__PURE__ */ new Map();
function cacheGet(key) {
	const hit = store.get(key);
	if (!hit) return void 0;
	if (Date.now() > hit.expiresAt) return void 0;
	return hit.value;
}
function cachePeek(key) {
	const hit = store.get(key);
	if (!hit) return void 0;
	return {
		value: hit.value,
		storedAt: hit.storedAt,
		expired: Date.now() > hit.expiresAt
	};
}
function cacheSet(key, value, ttlMs) {
	store.set(key, {
		value,
		expiresAt: Date.now() + ttlMs,
		storedAt: Date.now()
	});
}
var TTL = {
	snapshot: 3e5,
	history: 216e5,
	universe: 432e5,
	fundamentals: 216e5,
	holidays: 864e5
};
var HttpError = class extends Error {
	status;
	url;
	bodyPreview;
	constructor(status, url, bodyPreview) {
		super(`HTTP ${status} ${url}`);
		this.status = status;
		this.url = url;
		this.bodyPreview = bodyPreview;
	}
};
var queue = [];
var active = 0;
var lastStart = 0;
var MAX_CONCURRENT = 5;
var MIN_GAP_MS = 80;
function pump() {
	if (active >= MAX_CONCURRENT) return;
	const item = queue.shift();
	if (!item) return;
	const wait = Math.max(0, MIN_GAP_MS - (Date.now() - lastStart));
	active += 1;
	lastStart = Date.now() + wait;
	const go = () => {
		item.run().then(item.resolve, item.reject).finally(() => {
			active -= 1;
			pump();
		});
	};
	if (wait > 0) setTimeout(go, wait);
	else go();
}
function enqueue(run) {
	return new Promise((resolve, reject) => {
		queue.push({
			run,
			resolve,
			reject
		});
		pump();
	});
}
var DEFAULT_UA = "HengYan/1.0 (Taiwan equity research; data-source verification)";
async function fetchJson(url, opts) {
	return enqueue(() => fetchJsonOnce(url, opts));
}
async function fetchJsonOnce(url, opts) {
	const timeoutMs = opts?.timeoutMs ?? 18e3;
	const retries = opts?.retries ?? 3;
	let lastErr;
	for (let attempt = 0; attempt < retries; attempt += 1) {
		const ac = new AbortController();
		const timer = setTimeout(() => ac.abort(), timeoutMs);
		try {
			const res = await fetch(url, {
				signal: ac.signal,
				headers: {
					Accept: "application/json,text/plain,*/*",
					"User-Agent": DEFAULT_UA,
					...opts?.headers ?? {}
				}
			});
			const text = await res.text();
			if (res.status === 429 || res.status >= 500) throw new HttpError(res.status, url, text.slice(0, 180));
			if (res.status === 401 || res.status === 403) throw new HttpError(res.status, url, text.slice(0, 180));
			if (!res.ok) throw new HttpError(res.status, url, text.slice(0, 180));
			const trimmed = text.trim();
			if (trimmed.startsWith("<")) throw new HttpError(res.status, url, "non-json html");
			return JSON.parse(trimmed);
		} catch (err) {
			lastErr = err;
			const status = err instanceof HttpError ? err.status : 0;
			if (!(err instanceof Error && err.name === "AbortError" || status === 429 || status >= 500 || status === 0) || attempt === retries - 1) break;
			if (status === 401 || status === 403) break;
			await sleep(400 * 2 ** attempt + Math.floor(Math.random() * 250));
		} finally {
			clearTimeout(timer);
		}
	}
	throw lastErr;
}
function sleep(ms) {
	return new Promise((r) => setTimeout(r, ms));
}
function errorCode(err) {
	if (err instanceof Error && err.name === "AbortError") return "timeout";
	if (err instanceof HttpError) {
		if (err.status === 429) return "rate_limit";
		if (err.status === 401 || err.status === 403) return "auth";
		if (err.message.includes("JSON") || err.bodyPreview === "non-json html") return "parse";
	}
	if (err instanceof SyntaxError) return "parse";
	return "unavailable";
}
function errorMessage(err) {
	if (err instanceof HttpError) {
		if (err.status === 429) return "資料來源要求降速（HTTP 429）";
		if (err.status === 401 || err.status === 403) return "資料來源拒絕存取";
		return `資料來源回應 HTTP ${err.status}`;
	}
	if (err instanceof Error && err.name === "AbortError") return "連線逾時";
	if (err instanceof Error) return err.message;
	return "未知錯誤";
}
function parseTwNumber(value) {
	if (value == null) return null;
	let s = String(value).replace(/<[^>]*>/g, "").replace(/,/g, "").trim();
	if (!s || s === "--" || s === "---" || s === "-" || s === "x" || s === "X" || s === "n/a") return null;
	const neg = s.startsWith("−") || s.startsWith("-") || s.includes("▼");
	const token = s.match(/[+-]?\d+(?:\.\d+)?/);
	if (!token) return null;
	const n = Number(token[0]);
	if (!Number.isFinite(n)) return null;
	if (neg && n > 0 && !token[0].startsWith("-")) return -n;
	return n;
}
function parseCountWithLimit(raw) {
	const m = String(raw ?? "").replace(/,/g, "").trim().match(/^(-?\d+)(?:\((\d+)\))?/);
	if (!m) return {
		count: null,
		limit: null
	};
	return {
		count: Number(m[1]),
		limit: m[2] ? Number(m[2]) : null
	};
}
function parseChangePair(signRaw, magRaw) {
	const mag = parseTwNumber(magRaw);
	if (mag == null) return null;
	const signText = String(signRaw ?? "").replace(/<[^>]*>/g, "").trim();
	if (signText === "-" || signText === "−" || signText.includes("green")) return -Math.abs(mag);
	if (signText === "+" || signText.includes("red")) return Math.abs(mag);
	return mag;
}
function isLikelyEtf(symbol, name) {
	if (/^00\d{3,4}$/.test(symbol)) return true;
	if (/^\d{4}$/.test(symbol)) return Number(symbol) < 1e3;
	return /ETF|指數|正2|反1|槓桿|債券|高股息/.test(name);
}
function looksLikeEquitySymbol(symbol) {
	if (/^\d{4,6}$/.test(symbol)) return true;
	if (/^\d{4,6}[A-Z]$/i.test(symbol)) return true;
	return false;
}
var TWSE_OPEN = "https://openapi.twse.com.tw/v1";
var TWSE_RWD = "https://www.twse.com.tw/rwd/zh";
var TPEX_OPEN = "https://www.tpex.org.tw/openapi/v1";
var TPEX_WWW = "https://www.tpex.org.tw/www/zh-tw";
function fail(source, err) {
	return {
		ok: false,
		code: errorCode(err),
		message: errorMessage(err),
		source,
		fetchedAt: isoNow()
	};
}
function provenance(source, sourceUrl, eventTime) {
	const session = classifySession();
	return {
		source,
		sourceUrl,
		eventTime,
		fetchedAt: isoNow(),
		timeframe: "1D",
		session,
		status: "after_hours",
		adjustment: "raw",
		latency: "after_hours"
	};
}
function quoteFromTwse(row, val, industry) {
	const close = parseTwNumber(row.ClosingPrice);
	const change = parseTwNumber(row.Change);
	const prev = close != null && change != null ? close - change : null;
	const event = parseMarketDate(row.Date) ?? taipeiParts().isoDate;
	return {
		market: "TWSE",
		symbol: row.Code,
		name: row.Name.trim(),
		currency: "TWD",
		open: parseTwNumber(row.OpeningPrice),
		high: parseTwNumber(row.HighestPrice),
		low: parseTwNumber(row.LowestPrice),
		close,
		change,
		changePct: close != null && prev && prev !== 0 ? (change ?? 0) / prev * 100 : null,
		volumeShares: parseTwNumber(row.TradeVolume),
		tradeValue: parseTwNumber(row.TradeValue),
		transactions: parseTwNumber(row.Transaction),
		previousClose: prev,
		peRatio: val ? parseTwNumber(val.PEratio) : null,
		pbRatio: val ? parseTwNumber(val.PBratio) : null,
		dividendYield: val ? parseTwNumber(val.DividendYield) : null,
		industry: industry ?? null,
		...provenance("TWSE OpenAPI STOCK_DAY_ALL", `${TWSE_OPEN}/exchangeReport/STOCK_DAY_ALL`, `${event}T13:30:00+08:00`)
	};
}
function quoteFromTpex(row, val, industry) {
	const close = parseTwNumber(row.Close);
	const change = parseTwNumber(row.Change);
	const prev = close != null && change != null ? close - change : null;
	const event = parseMarketDate(row.Date) ?? taipeiParts().isoDate;
	return {
		market: "TPEX",
		symbol: row.SecuritiesCompanyCode,
		name: row.CompanyName.trim(),
		currency: "TWD",
		open: parseTwNumber(row.Open),
		high: parseTwNumber(row.High),
		low: parseTwNumber(row.Low),
		close,
		change,
		changePct: close != null && prev && prev !== 0 ? (change ?? 0) / prev * 100 : null,
		volumeShares: parseTwNumber(row.TradingShares),
		tradeValue: parseTwNumber(row.TransactionAmount),
		transactions: parseTwNumber(row.TransactionNumber),
		previousClose: prev,
		peRatio: val ? parseTwNumber(val.PriceEarningRatio) : null,
		pbRatio: val ? parseTwNumber(val.PriceBookRatio) : null,
		dividendYield: val ? parseTwNumber(val.YieldRatio) : null,
		industry: industry ?? null,
		...provenance("TPEx OpenAPI tpex_mainboard_quotes", `${TPEX_OPEN}/tpex_mainboard_quotes`, `${event}T13:30:00+08:00`)
	};
}
async function loadUniverse() {
	const cached = cacheGet("universe");
	if (cached) return {
		ok: true,
		data: cached,
		provenance: provenance("cache", "memory", cached.asOf)
	};
	try {
		const [twse, tpex, bw, tpe] = await Promise.all([
			fetchJson(`${TWSE_OPEN}/exchangeReport/STOCK_DAY_ALL`),
			fetchJson(`${TPEX_OPEN}/tpex_mainboard_quotes`),
			fetchJson(`${TWSE_OPEN}/exchangeReport/BWIBBU_ALL`).catch(() => []),
			fetchJson(`${TPEX_OPEN}/tpex_mainboard_peratio_analysis`).catch(() => [])
		]);
		const bwMap = new Map(bw.map((r) => [r.Code, r]));
		const peMap = new Map(tpe.map((r) => [r.SecuritiesCompanyCode, r]));
		const quotes = [];
		for (const row of twse) {
			if (!looksLikeEquitySymbol(row.Code)) continue;
			quotes.push(quoteFromTwse(row, bwMap.get(row.Code)));
		}
		for (const row of tpex) {
			if (!looksLikeEquitySymbol(row.SecuritiesCompanyCode)) continue;
			quotes.push(quoteFromTpex(row, peMap.get(row.SecuritiesCompanyCode)));
		}
		const asOf = quotes[0]?.eventTime.slice(0, 10) ?? rocToIso(twse[0]?.Date ?? "") ?? taipeiParts().isoDate;
		const data = {
			quotes,
			asOf
		};
		cacheSet("universe", data, TTL.snapshot);
		cacheSet("universe:last", data, 6048e5);
		return {
			ok: true,
			data,
			provenance: provenance("TWSE+TPEx OpenAPI", TWSE_OPEN, `${asOf}T13:30:00+08:00`)
		};
	} catch (err) {
		const last = cachePeek("universe:last");
		if (last) return {
			ok: true,
			data: last.value,
			provenance: {
				...provenance("cache", "memory", last.value.asOf),
				status: "stale"
			}
		};
		return fail("TWSE+TPEx OpenAPI", err);
	}
}
function rememberTradingDate(iso) {
	cacheSet("last-trading-date", iso, TTL.holidays);
}
function candidateTradingDates(explicit) {
	if (explicit) return [parseMarketDate(explicit) ?? explicit];
	const known = cacheGet("last-trading-date");
	if (known) return [known];
	const ov = cacheGet("overview:v2") ?? cachePeek("overview:v2:last")?.value;
	if (ov?.lastTradingDate) return [ov.lastTradingDate];
	return recentWeekdaysIso(void 0, 6);
}
function pickFmtRow(fmt, asOf) {
	const rows = fmt.data ?? [];
	return [...rows].reverse().find((r) => parseMarketDate(String(r[0] ?? "")) === asOf) ?? rows.at(-1);
}
async function loadOverview() {
	const cached = cacheGet("overview:v2");
	if (cached) return {
		ok: true,
		data: cached,
		provenance: cached.provenance
	};
	try {
		const [uni, mi, fmt, tpexIdx, ind] = await Promise.all([
			loadUniverse(),
			fetchJson(`${TWSE_RWD}/afterTrading/MI_INDEX?response=json&type=MS`),
			fetchJson(`${TWSE_RWD}/afterTrading/FMTQIK?response=json`),
			fetchJson(`${TPEX_OPEN}/tpex_index`).catch(() => []),
			fetchJson(`${TWSE_RWD}/afterTrading/MI_INDEX?response=json&type=IND`).catch(() => null)
		]);
		const asOf = parseMarketDate(mi.date) ?? parseMarketDate(ind?.date) ?? parseMarketDate(fmt.date) ?? taipeiParts().isoDate;
		rememberTradingDate(asOf);
		const indexTable = mi.tables?.find((t) => t.title?.includes("價格指數"));
		let indices = [];
		const allow = /* @__PURE__ */ new Set([
			"發行量加權股價指數",
			"未含金融保險股指數",
			"電子工業類指數",
			"金融保險類指數"
		]);
		const tables = ind?.tables ?? [];
		for (const table of tables) for (const row of table.data ?? []) {
			const name = String(row[0] ?? "").trim();
			if (!allow.has(name)) continue;
			const close = parseTwNumber(row[1]);
			const change = parseChangePair(row[2], row[3]);
			const pct = parseTwNumber(row[4]);
			indices.push({
				id: name,
				name,
				close,
				change,
				changePct: pct,
				...provenance("TWSE MI_INDEX", `${TWSE_RWD}/afterTrading/MI_INDEX`, `${asOf}T13:30:00+08:00`)
			});
		}
		if (indices.length === 0 && indexTable?.data) for (const row of indexTable.data) {
			const name = String(row[0] ?? "");
			if (!name.includes("加權") && !name.includes("電子") && !name.includes("金融")) continue;
			indices.push({
				id: name,
				name,
				close: parseTwNumber(row[1]),
				change: parseChangePair(row[2], row[3]),
				changePct: parseTwNumber(row[4]),
				...provenance("TWSE MI_INDEX", `${TWSE_RWD}/afterTrading/MI_INDEX`, `${asOf}T13:30:00+08:00`)
			});
		}
		const taiex = indices.find((i) => i.name === "發行量加權股價指數") ?? null;
		let otc = null;
		const tpexRow = Array.isArray(tpexIdx) && tpexIdx.length ? tpexIdx[tpexIdx.length - 1] : null;
		if (tpexRow) {
			const close = parseTwNumber(tpexRow.Close);
			const change = parseTwNumber(tpexRow.Change);
			const prev = close != null && change != null ? close - change : null;
			const otcAsOf = parseMarketDate(tpexRow.Date) ?? asOf;
			otc = {
				id: "OTC",
				name: "櫃買指數",
				close,
				change,
				changePct: prev && prev !== 0 && change != null ? change / prev * 100 : null,
				...provenance("TPEx tpex_index", `${TPEX_OPEN}/tpex_index`, `${otcAsOf}T13:30:00+08:00`)
			};
		}
		const lastFmt = pickFmtRow(fmt, asOf);
		const volumeShares = lastFmt ? parseTwNumber(lastFmt[1]) : null;
		const tradeValue = lastFmt ? parseTwNumber(lastFmt[2]) : null;
		const transactions = lastFmt ? parseTwNumber(lastFmt[3]) : null;
		if (lastFmt && !indices.some((i) => i.name === "發行量加權股價指數")) indices.unshift({
			id: "TAIEX",
			name: "發行量加權股價指數",
			close: parseTwNumber(lastFmt[4]),
			change: parseTwNumber(lastFmt[5]),
			changePct: null,
			...provenance("TWSE FMTQIK", `${TWSE_RWD}/afterTrading/FMTQIK`, `${asOf}T13:30:00+08:00`)
		});
		const breadthTable = mi.tables?.find((t) => t.title?.includes("漲跌證券數"));
		const pickStock = (label) => {
			const row = breadthTable?.data?.find((r) => String(r[0]).includes(label));
			return row ? parseCountWithLimit(row[2] ?? row[1]) : {
				count: null,
				limit: null
			};
		};
		const up = pickStock("上漲");
		const down = pickStock("下跌");
		const flat = pickStock("持平");
		const cachedUni = cacheGet("universe") ?? cachePeek("universe:last")?.value;
		if (!cachedUni) loadUniverse();
		const quotes = cachedUni?.quotes ?? [];
		const overview = {
			session: classifySession(),
			lastTradingDate: asOf,
			taiex,
			otc,
			volumeShares,
			tradeValue,
			transactions,
			breadth: {
				advances: up.count,
				declines: down.count,
				unchanged: flat.count,
				limitUp: up.limit,
				limitDown: down.limit,
				asOf
			},
			quotes,
			indices,
			provenance: provenance("TWSE MI_INDEX / FMTQIK", `${TWSE_RWD}/afterTrading/MI_INDEX`, `${asOf}T13:30:00+08:00`),
			error: void 0
		};
		cacheSet("overview:v2", overview, TTL.snapshot);
		cacheSet("overview:v2:last", overview, 6048e5);
		return {
			ok: true,
			data: overview,
			provenance: overview.provenance
		};
	} catch (err) {
		const last = cachePeek("overview:v2:last");
		if (last) return {
			ok: true,
			data: {
				...last.value,
				provenance: {
					...last.value.provenance,
					status: "stale"
				},
				error: errorMessage(err)
			},
			provenance: {
				...last.value.provenance,
				status: "stale"
			}
		};
		const uni = await loadUniverse().catch(() => null);
		if (uni && uni.ok) {
			const asOf = uni.data.asOf;
			const overview = {
				session: classifySession(),
				lastTradingDate: asOf,
				taiex: null,
				otc: null,
				volumeShares: null,
				tradeValue: null,
				transactions: null,
				breadth: {
					advances: null,
					declines: null,
					unchanged: null,
					limitUp: null,
					limitDown: null,
					asOf
				},
				quotes: uni.data.quotes,
				indices: [],
				provenance: {
					...uni.provenance,
					status: "stale"
				},
				error: errorMessage(err)
			};
			return {
				ok: true,
				data: overview,
				provenance: overview.provenance
			};
		}
		return fail("TWSE MI_INDEX", err);
	}
}
async function searchInstruments(q) {
	const uni = await loadUniverse();
	if (!uni.ok) return [];
	const s = q.trim().toLowerCase();
	if (!s) return [];
	const hits = [];
	for (const row of uni.data.quotes) {
		if (row.symbol.toLowerCase().includes(s) || row.name.toLowerCase().includes(s)) hits.push({
			market: row.market,
			symbol: row.symbol,
			name: row.name,
			shortName: row.name,
			industry: row.industry,
			listedAt: null,
			currency: "TWD",
			isEtf: isLikelyEtf(row.symbol, row.name)
		});
		if (hits.length >= 40) break;
	}
	return hits;
}
function barFromTwseDay(symbol, row, sourceUrl) {
	const time = rocToIso(row[0] ?? "");
	const open = parseTwNumber(row[3]);
	const high = parseTwNumber(row[4]);
	const low = parseTwNumber(row[5]);
	const close = parseTwNumber(row[6]);
	const volumeShares = parseTwNumber(row[1]);
	if (!time || open == null || high == null || low == null || close == null || volumeShares == null) return null;
	return {
		market: "TWSE",
		symbol,
		currency: "TWD",
		time,
		open,
		high,
		low,
		close,
		volumeShares,
		tradeValue: parseTwNumber(row[2]),
		transactions: parseTwNumber(row[8]),
		...provenance("TWSE STOCK_DAY", sourceUrl, `${time}T13:30:00+08:00`)
	};
}
function barFromTpexDay(symbol, row, sourceUrl) {
	const time = rocToIso(row[0] ?? "");
	const open = parseTwNumber(row[3]);
	const high = parseTwNumber(row[4]);
	const low = parseTwNumber(row[5]);
	const close = parseTwNumber(row[6]);
	const volumeShares = parseTwNumber(row[1]);
	if (!time || open == null || high == null || low == null || close == null || volumeShares == null) return null;
	return {
		market: "TPEX",
		symbol,
		currency: "TWD",
		time,
		open,
		high,
		low,
		close,
		volumeShares,
		tradeValue: parseTwNumber(row[2]),
		transactions: parseTwNumber(row[8]),
		...provenance("TPEx tradingStock", sourceUrl, `${time}T13:30:00+08:00`)
	};
}
async function loadHistory(market, symbol, months = 18) {
	const key = `hist:${market}:${symbol}:${months}`;
	const cached = cacheGet(key);
	if (cached) return {
		ok: true,
		data: cached,
		provenance: provenance("cache", "memory", cached.at(-1)?.time ?? isoNow())
	};
	const end = taipeiParts().isoDate;
	const monthsIso = monthKeysGoingBack(end, months);
	try {
		const bars = [];
		if (market === "TWSE") {
			const chunks = await mapPool(monthsIso, 2, async (iso) => {
				const url = `${TWSE_RWD}/afterTrading/STOCK_DAY?date=${iso.replace(/-/g, "").slice(0, 8)}&stockNo=${encodeURIComponent(symbol)}&response=json`;
				const json = await fetchJson(url);
				if (json.stat && json.stat !== "OK") return [];
				return (json.data ?? []).map((row) => barFromTwseDay(symbol, row, url)).filter((b) => b != null);
			});
			for (const c of chunks) bars.push(...c);
		} else {
			const chunks = await mapPool(monthsIso, 2, async (iso) => {
				const date = isoToYmdSlash(firstOfMonthIso(iso));
				const url = `${TPEX_WWW}/afterTrading/tradingStock?code=${encodeURIComponent(symbol)}&date=${date}&response=json`;
				return (((await fetchJson(url)).tables?.[0])?.data ?? []).map((row) => barFromTpexDay(symbol, row, url)).filter((b) => b != null);
			});
			for (const c of chunks) bars.push(...c);
		}
		bars.sort((a, b) => a.time.localeCompare(b.time));
		const uniq = [];
		const seen = /* @__PURE__ */ new Set();
		for (const b of bars) {
			if (seen.has(b.time)) continue;
			seen.add(b.time);
			if (b.high < b.low) continue;
			uniq.push(b);
		}
		cacheSet(key, uniq, TTL.history);
		return {
			ok: true,
			data: uniq,
			provenance: provenance(market === "TWSE" ? "TWSE STOCK_DAY" : "TPEx tradingStock", market === "TWSE" ? `${TWSE_RWD}/afterTrading/STOCK_DAY` : `${TPEX_WWW}/afterTrading/tradingStock`, uniq.at(-1)?.time ?? isoNow())
		};
	} catch (err) {
		return fail(market === "TWSE" ? "TWSE STOCK_DAY" : "TPEx tradingStock", err);
	}
}
async function mapPool(items, limit, fn) {
	const out = [];
	let i = 0;
	async function worker() {
		while (i < items.length) {
			const idx = i;
			i += 1;
			out[idx] = await fn(items[idx]);
		}
	}
	await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
	return out;
}
async function loadMonthlyRevenue(symbol) {
	const key = `rev:${symbol}`;
	const cached = cacheGet(key);
	if (cached) return {
		ok: true,
		data: cached,
		provenance: provenance("cache", "memory", isoNow())
	};
	try {
		const data = (await fetchJson(`${TWSE_OPEN}/opendata/t187ap05_L`)).filter((r) => r["公司代號"] === symbol).map((r) => ({
			symbol,
			period: rocYm(r["資料年月"]),
			publishedAt: rocToIso(r["出表日期"]) ? `${rocToIso(r["出表日期"])}T00:00:00+08:00` : null,
			revenue: parseTwNumber(r["營業收入-當月營收"]),
			revenueMomPct: parseTwNumber(r["營業收入-上月比較增減(%)"]),
			revenueYoyPct: parseTwNumber(r["營業收入-去年同月增減(%)"]),
			ytdRevenue: parseTwNumber(r["累計營業收入-當月累計營收"]),
			ytdYoyPct: parseTwNumber(r["累計營業收入-前期比較增減(%)"]),
			note: r["備註"] && r["備註"] !== "-" ? r["備註"] : null,
			source: "TWSE OpenAPI t187ap05_L"
		}));
		cacheSet(key, data, TTL.fundamentals);
		return {
			ok: true,
			data,
			provenance: provenance("TWSE t187ap05_L", `${TWSE_OPEN}/opendata/t187ap05_L`, isoNow())
		};
	} catch (err) {
		return fail("TWSE t187ap05_L", err);
	}
}
function rocYm(raw) {
	const s = raw.trim();
	const m = s.match(/^(\d{2,3})(\d{2})$/);
	if (!m) return s;
	return `${Number(m[1]) + 1911}-${m[2]}`;
}
async function loadInstitution(symbol, dateIso) {
	const dates = candidateTradingDates(dateIso);
	let lastErr;
	for (const iso of dates) {
		const date = iso.replace(/-/g, "");
		try {
			const json = await fetchJson(`${TWSE_RWD}/fund/T86?date=${date}&selectType=ALLBUT0999&response=json`);
			if (json.stat !== "OK") continue;
			const asOf = parseMarketDate(json.date) ?? iso;
			rememberTradingDate(asOf);
			const row = json.data?.find((r) => String(r[0]).trim() === symbol);
			if (row) return {
				ok: true,
				data: {
					symbol,
					asOf,
					foreignNetShares: parseTwNumber(row[4]),
					investmentTrustNetShares: parseTwNumber(row[10]),
					dealerNetShares: parseTwNumber(row[11]),
					totalNetShares: parseTwNumber(row[18]),
					source: "TWSE T86"
				},
				provenance: provenance("TWSE T86", `${TWSE_RWD}/fund/T86`, `${asOf}T13:30:00+08:00`)
			};
			const r = (await fetchJson(`${TPEX_OPEN}/tpex_3insti_daily_trading`).catch(() => [])).find((x) => x.SecuritiesCompanyCode === symbol);
			if (!r) return {
				ok: true,
				data: null,
				provenance: provenance("TWSE T86", `${TWSE_RWD}/fund/T86`, `${asOf}T13:30:00+08:00`)
			};
			const tpexAsOf = parseMarketDate(r.Date) ?? asOf;
			const data = {
				symbol,
				asOf: tpexAsOf,
				foreignNetShares: parseTwNumber(r["ForeignInvestorsIncludeMainlandAreaInvestors-Difference"] ?? r["Foreign Investors include Mainland Area Investors (Foreign Dealers excluded)-Difference"]),
				investmentTrustNetShares: parseTwNumber(r["SecuritiesInvestmentTrustCompanies-Difference"]),
				dealerNetShares: parseTwNumber(r["Dealers-Difference"] ?? r["DealersDifference"]),
				totalNetShares: parseTwNumber(r["ThreeInstitutionalInvestors-Difference"] ?? r["total"]),
				source: "TPEx tpex_3insti_daily_trading"
			};
			return {
				ok: true,
				data,
				provenance: provenance(data.source, `${TPEX_OPEN}/tpex_3insti_daily_trading`, `${tpexAsOf}T13:30:00+08:00`)
			};
		} catch (err) {
			lastErr = err;
		}
	}
	if (lastErr) return fail("TWSE T86", lastErr);
	return {
		ok: true,
		data: null,
		provenance: provenance("TWSE T86", `${TWSE_RWD}/fund/T86`, isoNow())
	};
}
async function loadMargin(symbol, dateIso) {
	const dates = candidateTradingDates(dateIso);
	let lastErr;
	for (const iso of dates) {
		const date = iso.replace(/-/g, "");
		try {
			const json = await fetchJson(`${TWSE_RWD}/marginTrading/MI_MARGN?date=${date}&selectType=ALL&response=json`);
			if (json.stat && json.stat !== "OK") continue;
			const table = json.tables?.find((t) => t.title?.includes("融資融券彙總"));
			if (!table) continue;
			const asOf = parseMarketDate(json.date) ?? iso;
			rememberTradingDate(asOf);
			const row = table.data?.find((r) => String(r[0]).trim() === symbol);
			if (!row) return {
				ok: true,
				data: null,
				provenance: provenance("TWSE MI_MARGN", `${TWSE_RWD}/marginTrading/MI_MARGN`, `${asOf}T13:30:00+08:00`)
			};
			return {
				ok: true,
				data: {
					symbol,
					asOf,
					marginBuyBalance: parseTwNumber(row[6]),
					shortSellBalance: parseTwNumber(row[12]),
					source: "TWSE MI_MARGN"
				},
				provenance: provenance("TWSE MI_MARGN", `${TWSE_RWD}/marginTrading/MI_MARGN`, `${asOf}T13:30:00+08:00`)
			};
		} catch (err) {
			lastErr = err;
		}
	}
	if (lastErr) return fail("TWSE MI_MARGN", lastErr);
	return {
		ok: true,
		data: null,
		provenance: provenance("TWSE MI_MARGN", `${TWSE_RWD}/marginTrading/MI_MARGN`, isoNow())
	};
}
async function loadActions() {
	try {
		return {
			ok: true,
			data: (await fetchJson(`${TWSE_OPEN}/exchangeReport/TWT48U_ALL`)).map((r) => ({
				symbol: r.Code,
				date: rocToIso(r.Date) ?? r.Date,
				kind: r.Exdividend || "除權息",
				cashDividend: parseTwNumber(r.CashDividend),
				stockDividendRatio: parseTwNumber(r.StockDividendRatio),
				source: "TWSE TWT48U_ALL"
			})),
			provenance: provenance("TWSE TWT48U_ALL", `${TWSE_OPEN}/exchangeReport/TWT48U_ALL`, isoNow())
		};
	} catch (err) {
		return fail("TWSE TWT48U_ALL", err);
	}
}
async function testConnections() {
	const targets = [
		{
			id: "twse-openapi",
			url: `${TWSE_OPEN}/exchangeReport/STOCK_DAY_ALL`
		},
		{
			id: "twse-rwd",
			url: `${TWSE_RWD}/afterTrading/FMTQIK?response=json`
		},
		{
			id: "tpex-openapi",
			url: `${TPEX_OPEN}/tpex_mainboard_quotes`
		}
	];
	const out = [];
	for (const t of targets) {
		const t0 = Date.now();
		try {
			const data = await fetchJson(t.url, {
				timeoutMs: 12e3,
				retries: 1
			});
			const n = Array.isArray(data) ? data.length : typeof data === "object" && data && "stat" in data ? 1 : 0;
			out.push({
				id: t.id,
				ok: true,
				ms: Date.now() - t0,
				detail: `取得 ${n} 筆`
			});
		} catch (err) {
			out.push({
				id: t.id,
				ok: false,
				ms: Date.now() - t0,
				detail: errorMessage(err)
			});
		}
	}
	return out;
}
var marketSchema = _enum(["TWSE", "TPEX"]);
var getOverview_createServerFn_handler = createServerRpc({
	id: "33081e03018686e2851129adfc2ce4dd36b6158f51663ad00c3c25d2027de7f4",
	name: "getOverview",
	filename: "src/lib/server/market.ts"
}, (opts) => getOverview.__executeServer(opts));
var getOverview = createServerFn({ method: "GET" }).handler(getOverview_createServerFn_handler, async () => {
	return loadOverview();
});
var getUniverse_createServerFn_handler = createServerRpc({
	id: "a3c359c53aebd808970603b2878e4da87de6f0dfde345cf39a9d50aa1235c90d",
	name: "getUniverse",
	filename: "src/lib/server/market.ts"
}, (opts) => getUniverse.__executeServer(opts));
var getUniverse = createServerFn({ method: "GET" }).handler(getUniverse_createServerFn_handler, async () => {
	return loadUniverse();
});
var searchStocks_createServerFn_handler = createServerRpc({
	id: "46846df7d90b8f7e1f53bf629f28616003abad205f2e49528bb0ed814bd4eb06",
	name: "searchStocks",
	filename: "src/lib/server/market.ts"
}, (opts) => searchStocks.__executeServer(opts));
var searchStocks = createServerFn({ method: "GET" }).validator(object({ q: string() })).handler(searchStocks_createServerFn_handler, async ({ data }) => searchInstruments(data.q));
var getHistory_createServerFn_handler = createServerRpc({
	id: "f13e40ff69f626ca8759eb9a782d129be9b2a7c883244243ef23bbb49ce98584",
	name: "getHistory",
	filename: "src/lib/server/market.ts"
}, (opts) => getHistory.__executeServer(opts));
var getHistory = createServerFn({ method: "GET" }).validator(object({
	market: marketSchema,
	symbol: string().min(1).max(12),
	months: number().min(1).max(36).optional()
})).handler(getHistory_createServerFn_handler, async ({ data }) => loadHistory(data.market, data.symbol, data.months ?? 18));
var getMonthlyRevenue_createServerFn_handler = createServerRpc({
	id: "2f1771948f4055b66e14f4f4ee2a80a03d7455c3d38ec5a15457cefd8dc3431b",
	name: "getMonthlyRevenue",
	filename: "src/lib/server/market.ts"
}, (opts) => getMonthlyRevenue.__executeServer(opts));
var getMonthlyRevenue = createServerFn({ method: "GET" }).validator(object({ symbol: string().min(1).max(12) })).handler(getMonthlyRevenue_createServerFn_handler, async ({ data }) => loadMonthlyRevenue(data.symbol));
var getInstitution_createServerFn_handler = createServerRpc({
	id: "b00199cab026248daccfb2bd6a6b58516cb6b43e43b643270fbbc56058195dca",
	name: "getInstitution",
	filename: "src/lib/server/market.ts"
}, (opts) => getInstitution.__executeServer(opts));
var getInstitution = createServerFn({ method: "GET" }).validator(object({
	symbol: string().min(1).max(12),
	date: string().optional()
})).handler(getInstitution_createServerFn_handler, async ({ data }) => loadInstitution(data.symbol, data.date));
var getMargin_createServerFn_handler = createServerRpc({
	id: "6b54840e3e845fdda02a3068da4ca9ae6b245f4b6d443b2f5c6c939eb44c9db8",
	name: "getMargin",
	filename: "src/lib/server/market.ts"
}, (opts) => getMargin.__executeServer(opts));
var getMargin = createServerFn({ method: "GET" }).validator(object({
	symbol: string().min(1).max(12),
	date: string().optional()
})).handler(getMargin_createServerFn_handler, async ({ data }) => loadMargin(data.symbol, data.date));
var getActions_createServerFn_handler = createServerRpc({
	id: "e3806e9ab300cd2c7ff907b5fd4dc7acefb48ae4deafeec263b8ffe347429114",
	name: "getActions",
	filename: "src/lib/server/market.ts"
}, (opts) => getActions.__executeServer(opts));
var getActions = createServerFn({ method: "GET" }).handler(getActions_createServerFn_handler, async () => loadActions());
var pingSources_createServerFn_handler = createServerRpc({
	id: "b0af9ddb14789da27d68ddc2b398a21f7288c450a7b7d8634a6b88f6b8826236",
	name: "pingSources",
	filename: "src/lib/server/market.ts"
}, (opts) => pingSources.__executeServer(opts));
var pingSources = createServerFn({ method: "GET" }).handler(pingSources_createServerFn_handler, async () => testConnections());
//#endregion
export { getActions_createServerFn_handler, getHistory_createServerFn_handler, getInstitution_createServerFn_handler, getMargin_createServerFn_handler, getMonthlyRevenue_createServerFn_handler, getOverview_createServerFn_handler, getUniverse_createServerFn_handler, pingSources_createServerFn_handler, searchStocks_createServerFn_handler };
