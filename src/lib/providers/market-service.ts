import type {
  Bar,
  CorporateAction,
  DataProvenance,
  FetchResult,
  IndexQuote,
  InstitutionFlow,
  Instrument,
  MarginBalance,
  Market,
  MarketOverview,
  MonthlyRevenue,
  Quote,
  ValuationRow,
} from "@/lib/domain/types";
import {
  classifySession,
  firstOfMonthIso,
  isoNow,
  isoToYmdSlash,
  monthKeysGoingBack,
  parseMarketDate,
  recentWeekdaysIso,
  rocToIso,
  taipeiParts,
} from "@/lib/domain/time";
import { cacheGet, cachePeek, cacheSet, TTL } from "./cache";
import { errorCode, errorMessage, fetchJson } from "./http";
import { isLikelyEtf, looksLikeEquitySymbol, parseChangePair, parseCountWithLimit, parseTwNumber } from "./parse";

const TWSE_OPEN = "https://openapi.twse.com.tw/v1";
const TWSE_RWD = "https://www.twse.com.tw/rwd/zh";
const TPEX_OPEN = "https://www.tpex.org.tw/openapi/v1";
const TPEX_WWW = "https://www.tpex.org.tw/www/zh-tw";

function fail(source: string, err: unknown): FetchResult<never> {
  return {
    ok: false,
    code: errorCode(err),
    message: errorMessage(err),
    source,
    fetchedAt: isoNow(),
  };
}

function provenance(
  source: string,
  sourceUrl: string,
  eventTime: string,
): DataProvenance {
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
    latency: "after_hours",
  };
}

type TwseDayRow = {
  Date: string;
  Code: string;
  Name: string;
  TradeVolume: string;
  TradeValue: string;
  OpeningPrice: string;
  HighestPrice: string;
  LowestPrice: string;
  ClosingPrice: string;
  Change: string;
  Transaction: string;
};

type TpexQuoteRow = {
  Date: string;
  SecuritiesCompanyCode: string;
  CompanyName: string;
  Close: string;
  Change: string;
  Open: string;
  High: string;
  Low: string;
  TradingShares: string;
  TransactionAmount: string;
  TransactionNumber: string;
};

type Bwibbu = { Date: string; Code: string; PEratio: string; DividendYield: string; PBratio: string };
type TpexPe = {
  Date: string;
  SecuritiesCompanyCode: string;
  PriceEarningRatio: string;
  YieldRatio: string;
  PriceBookRatio: string;
};

function quoteFromTwse(row: TwseDayRow, val?: Bwibbu, industry?: string): Quote {
  const close = parseTwNumber(row.ClosingPrice);
  const change = parseTwNumber(row.Change);
  const prev =
    close != null && change != null ? close - change : null;
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
    ...provenance("TWSE OpenAPI STOCK_DAY_ALL", `${TWSE_OPEN}/exchangeReport/STOCK_DAY_ALL`, `${event}T13:30:00+08:00`),
  };
}

function quoteFromTpex(row: TpexQuoteRow, val?: TpexPe, industry?: string): Quote {
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
    ...provenance(
      "TPEx OpenAPI tpex_mainboard_quotes",
      `${TPEX_OPEN}/tpex_mainboard_quotes`,
      `${event}T13:30:00+08:00`,
    ),
  };
}

export async function loadUniverse(): Promise<FetchResult<{ quotes: Quote[]; asOf: string }>> {
  const cached = cacheGet<{ quotes: Quote[]; asOf: string }>("universe");
  if (cached) {
    return {
      ok: true,
      data: cached,
      provenance: provenance("cache", "memory", cached.asOf),
    };
  }
  try {
    const [twse, tpex, bw, tpe] = await Promise.all([
      fetchJson<TwseDayRow[]>(`${TWSE_OPEN}/exchangeReport/STOCK_DAY_ALL`),
      fetchJson<TpexQuoteRow[]>(`${TPEX_OPEN}/tpex_mainboard_quotes`),
      fetchJson<Bwibbu[]>(`${TWSE_OPEN}/exchangeReport/BWIBBU_ALL`).catch(() => [] as Bwibbu[]),
      fetchJson<TpexPe[]>(`${TPEX_OPEN}/tpex_mainboard_peratio_analysis`).catch(() => [] as TpexPe[]),
    ]);
    const bwMap = new Map(bw.map((r) => [r.Code, r]));
    const peMap = new Map(tpe.map((r) => [r.SecuritiesCompanyCode, r]));
    const quotes: Quote[] = [];
    for (const row of twse) {
      if (!looksLikeEquitySymbol(row.Code)) continue;
      quotes.push(quoteFromTwse(row, bwMap.get(row.Code)));
    }
    for (const row of tpex) {
      if (!looksLikeEquitySymbol(row.SecuritiesCompanyCode)) continue;
      quotes.push(quoteFromTpex(row, peMap.get(row.SecuritiesCompanyCode)));
    }
    const asOf =
      (quotes[0]?.eventTime.slice(0, 10) ?? rocToIso(twse[0]?.Date ?? "") ?? taipeiParts().isoDate);
    const data = { quotes, asOf };
    cacheSet("universe", data, TTL.snapshot);
    cacheSet("universe:last", data, 7 * 24 * 3600_000);
    return {
      ok: true,
      data,
      provenance: provenance("TWSE+TPEx OpenAPI", TWSE_OPEN, `${asOf}T13:30:00+08:00`),
    };
  } catch (err) {
    const last = cachePeek<{ quotes: Quote[]; asOf: string }>("universe:last");
    if (last) {
      return {
        ok: true,
        data: last.value,
        provenance: {
          ...provenance("cache", "memory", last.value.asOf),
          status: "stale",
        },
      };
    }
    return fail("TWSE+TPEx OpenAPI", err);
  }
}

type MiIndex = {
  stat: string;
  date: string;
  tables?: Array<{
    title?: string;
    fields?: string[];
    data?: unknown[][];
  }>;
};

type Fmtqik = {
  stat: string;
  date: string;
  fields?: string[];
  data?: string[][];
};

function rememberTradingDate(iso: string) {
  cacheSet("last-trading-date", iso, TTL.holidays);
}

function candidateTradingDates(explicit?: string): string[] {
  if (explicit) return [parseMarketDate(explicit) ?? explicit];
  const known = cacheGet<string>("last-trading-date");
  if (known) return [known];
  const ov =
    cacheGet<MarketOverview>("overview:v2") ?? cachePeek<MarketOverview>("overview:v2:last")?.value;
  if (ov?.lastTradingDate) return [ov.lastTradingDate];
  return recentWeekdaysIso(undefined, 6);
}

function pickFmtRow(fmt: Fmtqik, asOf: string): string[] | undefined {
  const rows = fmt.data ?? [];
  const match = [...rows].reverse().find((r) => parseMarketDate(String(r[0] ?? "")) === asOf);
  return match ?? rows.at(-1);
}

export async function loadOverview(): Promise<FetchResult<MarketOverview>> {
  const cached = cacheGet<MarketOverview>("overview:v2");
  if (cached) {
    return { ok: true, data: cached, provenance: cached.provenance };
  }
  try {
    const [uni, mi, fmt, tpexIdx, ind] = await Promise.all([
      loadUniverse(),
      fetchJson<MiIndex>(`${TWSE_RWD}/afterTrading/MI_INDEX?response=json&type=MS`),
      fetchJson<Fmtqik>(`${TWSE_RWD}/afterTrading/FMTQIK?response=json`),
      fetchJson<Array<Record<string, string>>>(`${TPEX_OPEN}/tpex_index`).catch(
        () => [] as Array<Record<string, string>>,
      ),
      fetchJson<MiIndex>(`${TWSE_RWD}/afterTrading/MI_INDEX?response=json&type=IND`).catch(() => null),
    ]);
    const asOf =
      parseMarketDate(mi.date) ?? parseMarketDate(ind?.date) ?? parseMarketDate(fmt.date) ?? taipeiParts().isoDate;
    rememberTradingDate(asOf);
    const indexTable = mi.tables?.find((t) => t.title?.includes("價格指數"));
    let indices: IndexQuote[] = [];
    const allow = new Set(["發行量加權股價指數", "未含金融保險股指數", "電子工業類指數", "金融保險類指數"]);
    const tables = ind?.tables ?? [];
    for (const table of tables) {
      for (const row of table.data ?? []) {
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
          ...provenance("TWSE MI_INDEX", `${TWSE_RWD}/afterTrading/MI_INDEX`, `${asOf}T13:30:00+08:00`),
        });
      }
    }
    if (indices.length === 0 && indexTable?.data) {
      for (const row of indexTable.data) {
        const name = String(row[0] ?? "");
        if (!name.includes("加權") && !name.includes("電子") && !name.includes("金融")) continue;
        indices.push({
          id: name,
          name,
          close: parseTwNumber(row[1]),
          change: parseChangePair(row[2], row[3]),
          changePct: parseTwNumber(row[4]),
          ...provenance("TWSE MI_INDEX", `${TWSE_RWD}/afterTrading/MI_INDEX`, `${asOf}T13:30:00+08:00`),
        });
      }
    }
    const taiex = indices.find((i) => i.name === "發行量加權股價指數") ?? null;

    let otc: IndexQuote | null = null;
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
        changePct: prev && prev !== 0 && change != null ? (change / prev) * 100 : null,
        ...provenance("TPEx tpex_index", `${TPEX_OPEN}/tpex_index`, `${otcAsOf}T13:30:00+08:00`),
      };
    }

    const lastFmt = pickFmtRow(fmt, asOf);
    const volumeShares = lastFmt ? parseTwNumber(lastFmt[1]) : null;
    const tradeValue = lastFmt ? parseTwNumber(lastFmt[2]) : null;
    const transactions = lastFmt ? parseTwNumber(lastFmt[3]) : null;
    if (lastFmt && !indices.some((i) => i.name === "發行量加權股價指數")) {
      indices.unshift({
        id: "TAIEX",
        name: "發行量加權股價指數",
        close: parseTwNumber(lastFmt[4]),
        change: parseTwNumber(lastFmt[5]),
        changePct: null,
        ...provenance("TWSE FMTQIK", `${TWSE_RWD}/afterTrading/FMTQIK`, `${asOf}T13:30:00+08:00`),
      });
    }

    const breadthTable = mi.tables?.find((t) => t.title?.includes("漲跌證券數"));
    const pickStock = (label: string) => {
      const row = breadthTable?.data?.find((r) => String(r[0]).includes(label));
      return row ? parseCountWithLimit(row[2] ?? row[1]) : { count: null, limit: null };
    };
    const up = pickStock("上漲");
    const down = pickStock("下跌");
    const flat = pickStock("持平");

    const cachedUni =
      cacheGet<{ quotes: Quote[]; asOf: string }>("universe") ??
      cachePeek<{ quotes: Quote[]; asOf: string }>("universe:last")?.value;
    if (!cachedUni) void loadUniverse();
    const quotes = cachedUni?.quotes ?? [];
    const overview: MarketOverview = {
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
        asOf,
      },
      quotes,
      indices,
      provenance: provenance("TWSE MI_INDEX / FMTQIK", `${TWSE_RWD}/afterTrading/MI_INDEX`, `${asOf}T13:30:00+08:00`),
      error: undefined,
    };
    cacheSet("overview:v2", overview, TTL.snapshot);
    cacheSet("overview:v2:last", overview, 7 * 24 * 3600_000);
    return { ok: true, data: overview, provenance: overview.provenance };
  } catch (err) {
    const last = cachePeek<MarketOverview>("overview:v2:last");
    if (last) {
      return {
        ok: true,
        data: { ...last.value, provenance: { ...last.value.provenance, status: "stale" }, error: errorMessage(err) },
        provenance: { ...last.value.provenance, status: "stale" },
      };
    }
    const uni = await loadUniverse().catch(() => null);
    if (uni && uni.ok) {
      const asOf = uni.data.asOf;
      const overview: MarketOverview = {
        session: classifySession(),
        lastTradingDate: asOf,
        taiex: null,
        otc: null,
        volumeShares: null,
        tradeValue: null,
        transactions: null,
        breadth: { advances: null, declines: null, unchanged: null, limitUp: null, limitDown: null, asOf },
        quotes: uni.data.quotes,
        indices: [],
        provenance: { ...uni.provenance, status: "stale" },
        error: errorMessage(err),
      };
      return { ok: true, data: overview, provenance: overview.provenance };
    }
    return fail("TWSE MI_INDEX", err);
  }
}

export async function searchInstruments(q: string): Promise<Instrument[]> {
  const uni = await loadUniverse();
  if (!uni.ok) return [];
  const s = q.trim().toLowerCase();
  if (!s) return [];
  const hits: Instrument[] = [];
  for (const row of uni.data.quotes) {
    if (
      row.symbol.toLowerCase().includes(s) ||
      row.name.toLowerCase().includes(s)
    ) {
      hits.push({
        market: row.market,
        symbol: row.symbol,
        name: row.name,
        shortName: row.name,
        industry: row.industry,
        listedAt: null,
        currency: "TWD",
        isEtf: isLikelyEtf(row.symbol, row.name),
      });
    }
    if (hits.length >= 40) break;
  }
  return hits;
}

type StockDay = {
  stat: string;
  date?: string;
  title?: string;
  fields?: string[];
  data?: string[][];
  notes?: string[];
};

type TpexHist = {
  stat?: string;
  tables?: Array<{ title?: string; subtitle?: string; date?: string; data?: string[][]; fields?: string[] }>;
};

function barFromTwseDay(symbol: string, row: string[], sourceUrl: string): Bar | null {
  const time = rocToIso(row[0] ?? "");
  const open = parseTwNumber(row[3]);
  const high = parseTwNumber(row[4]);
  const low = parseTwNumber(row[5]);
  const close = parseTwNumber(row[6]);
  const volumeShares = parseTwNumber(row[1]);
  if (!time || open == null || high == null || low == null || close == null || volumeShares == null) {
    return null;
  }
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
    ...provenance("TWSE STOCK_DAY", sourceUrl, `${time}T13:30:00+08:00`),
  };
}

function barFromTpexDay(symbol: string, row: string[], sourceUrl: string): Bar | null {
  // ["115/09/01","12,770","12,430,205","908.00","998.00","908.00","994.00","82.00","31,831"]
  const time = rocToIso(row[0] ?? "");
  const open = parseTwNumber(row[3]);
  const high = parseTwNumber(row[4]);
  const low = parseTwNumber(row[5]);
  const close = parseTwNumber(row[6]);
  const volumeShares = parseTwNumber(row[1]);
  if (!time || open == null || high == null || low == null || close == null || volumeShares == null) {
    return null;
  }
  // TPEX daily trading info volume is often 張; the sample 12,770 lots * 1000 = 12,770,000 shares
  // Official title 個股日成交資訊 historically uses 股 for some endpoints and 張 for others.
  // The 6488 sample "12,770" with trade value 12,430,205 at ~900 TWD => 12,770 shares not lots
  // (12770*950 ≈ 12.1M). So this endpoint is 股.
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
    ...provenance("TPEx tradingStock", sourceUrl, `${time}T13:30:00+08:00`),
  };
}

export async function loadHistory(
  market: Market,
  symbol: string,
  months = 18,
): Promise<FetchResult<Bar[]>> {
  const key = `hist:${market}:${symbol}:${months}`;
  const cached = cacheGet<Bar[]>(key);
  if (cached) {
    return {
      ok: true,
      data: cached,
      provenance: provenance("cache", "memory", cached.at(-1)?.time ?? isoNow()),
    };
  }
  const end = taipeiParts().isoDate;
  const monthsIso = monthKeysGoingBack(end, months);
  try {
    const bars: Bar[] = [];
    if (market === "TWSE") {
      const chunks = await mapPool(monthsIso, 2, async (iso) => {
        const ymd = iso.replace(/-/g, "").slice(0, 8);
        const url = `${TWSE_RWD}/afterTrading/STOCK_DAY?date=${ymd}&stockNo=${encodeURIComponent(symbol)}&response=json`;
        const json = await fetchJson<StockDay>(url);
        if (json.stat && json.stat !== "OK") return [] as Bar[];
        return (json.data ?? [])
          .map((row) => barFromTwseDay(symbol, row, url))
          .filter((b): b is Bar => b != null);
      });
      for (const c of chunks) bars.push(...c);
    } else {
      const chunks = await mapPool(monthsIso, 2, async (iso) => {
        const date = isoToYmdSlash(firstOfMonthIso(iso));
        const url = `${TPEX_WWW}/afterTrading/tradingStock?code=${encodeURIComponent(symbol)}&date=${date}&response=json`;
        const json = await fetchJson<TpexHist>(url);
        const table = json.tables?.[0];
        return (table?.data ?? [])
          .map((row) => barFromTpexDay(symbol, row, url))
          .filter((b): b is Bar => b != null);
      });
      for (const c of chunks) bars.push(...c);
    }
    bars.sort((a, b) => a.time.localeCompare(b.time));
    const uniq: Bar[] = [];
    const seen = new Set<string>();
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
      provenance: provenance(
        market === "TWSE" ? "TWSE STOCK_DAY" : "TPEx tradingStock",
        market === "TWSE" ? `${TWSE_RWD}/afterTrading/STOCK_DAY` : `${TPEX_WWW}/afterTrading/tradingStock`,
        uniq.at(-1)?.time ?? isoNow(),
      ),
    };
  } catch (err) {
    return fail(market === "TWSE" ? "TWSE STOCK_DAY" : "TPEx tradingStock", err);
  }
}

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
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

export async function loadMonthlyRevenue(symbol: string): Promise<FetchResult<MonthlyRevenue[]>> {
  const key = `rev:${symbol}`;
  const cached = cacheGet<MonthlyRevenue[]>(key);
  if (cached) {
    return { ok: true, data: cached, provenance: provenance("cache", "memory", isoNow()) };
  }
  try {
    const rows = await fetchJson<Array<Record<string, string>>>(`${TWSE_OPEN}/opendata/t187ap05_L`);
    const mine = rows.filter((r) => r["公司代號"] === symbol);
    const data: MonthlyRevenue[] = mine.map((r) => ({
      symbol,
      period: rocYm(r["資料年月"]),
      publishedAt: rocToIso(r["出表日期"]) ? `${rocToIso(r["出表日期"])}T00:00:00+08:00` : null,
      revenue: parseTwNumber(r["營業收入-當月營收"]),
      revenueMomPct: parseTwNumber(r["營業收入-上月比較增減(%)"]),
      revenueYoyPct: parseTwNumber(r["營業收入-去年同月增減(%)"]),
      ytdRevenue: parseTwNumber(r["累計營業收入-當月累計營收"]),
      ytdYoyPct: parseTwNumber(r["累計營業收入-前期比較增減(%)"]),
      note: r["備註"] && r["備註"] !== "-" ? r["備註"] : null,
      source: "TWSE OpenAPI t187ap05_L",
    }));
    cacheSet(key, data, TTL.fundamentals);
    return {
      ok: true,
      data,
      provenance: provenance("TWSE t187ap05_L", `${TWSE_OPEN}/opendata/t187ap05_L`, isoNow()),
    };
  } catch (err) {
    return fail("TWSE t187ap05_L", err);
  }
}

function rocYm(raw: string): string {
  const s = raw.trim();
  const m = s.match(/^(\d{2,3})(\d{2})$/);
  if (!m) return s;
  return `${Number(m[1]) + 1911}-${m[2]}`;
}

export async function loadInstitution(symbol: string, dateIso?: string): Promise<FetchResult<InstitutionFlow | null>> {
  const dates = candidateTradingDates(dateIso);
  let lastErr: unknown;
  for (const iso of dates) {
    const date = iso.replace(/-/g, "");
    try {
      const json = await fetchJson<{
        stat: string;
        date: string;
        data?: string[][];
      }>(`${TWSE_RWD}/fund/T86?date=${date}&selectType=ALLBUT0999&response=json`);
      if (json.stat !== "OK") continue;
      const asOf = parseMarketDate(json.date) ?? iso;
      rememberTradingDate(asOf);
      const row = json.data?.find((r) => String(r[0]).trim() === symbol);
      if (row) {
        const data: InstitutionFlow = {
          symbol,
          asOf,
          foreignNetShares: parseTwNumber(row[4]),
          investmentTrustNetShares: parseTwNumber(row[10]),
          dealerNetShares: parseTwNumber(row[11]),
          totalNetShares: parseTwNumber(row[18]),
          source: "TWSE T86",
        };
        return {
          ok: true,
          data,
          provenance: provenance("TWSE T86", `${TWSE_RWD}/fund/T86`, `${asOf}T13:30:00+08:00`),
        };
      }
      const tpex = await fetchJson<Array<Record<string, string>>>(`${TPEX_OPEN}/tpex_3insti_daily_trading`).catch(
        () => [] as Array<Record<string, string>>,
      );
      const r = tpex.find((x) => x.SecuritiesCompanyCode === symbol);
      if (!r) {
        return {
          ok: true,
          data: null,
          provenance: provenance("TWSE T86", `${TWSE_RWD}/fund/T86`, `${asOf}T13:30:00+08:00`),
        };
      }
      const tpexAsOf = parseMarketDate(r.Date) ?? asOf;
      const data: InstitutionFlow = {
        symbol,
        asOf: tpexAsOf,
        foreignNetShares: parseTwNumber(
          r["ForeignInvestorsIncludeMainlandAreaInvestors-Difference"] ??
            r["Foreign Investors include Mainland Area Investors (Foreign Dealers excluded)-Difference"],
        ),
        investmentTrustNetShares: parseTwNumber(r["SecuritiesInvestmentTrustCompanies-Difference"]),
        dealerNetShares: parseTwNumber(r["Dealers-Difference"] ?? r["DealersDifference"]),
        totalNetShares: parseTwNumber(r["ThreeInstitutionalInvestors-Difference"] ?? r["total"]),
        source: "TPEx tpex_3insti_daily_trading",
      };
      return {
        ok: true,
        data,
        provenance: provenance(data.source, `${TPEX_OPEN}/tpex_3insti_daily_trading`, `${tpexAsOf}T13:30:00+08:00`),
      };
    } catch (err) {
      lastErr = err;
    }
  }
  if (lastErr) return fail("TWSE T86", lastErr);
  return {
    ok: true,
    data: null,
    provenance: provenance("TWSE T86", `${TWSE_RWD}/fund/T86`, isoNow()),
  };
}

export async function loadMargin(symbol: string, dateIso?: string): Promise<FetchResult<MarginBalance | null>> {
  const dates = candidateTradingDates(dateIso);
  let lastErr: unknown;
  for (const iso of dates) {
    const date = iso.replace(/-/g, "");
    try {
      const json = await fetchJson<{
        stat: string;
        date: string;
        tables?: Array<{ title?: string; data?: string[][] }>;
      }>(`${TWSE_RWD}/marginTrading/MI_MARGN?date=${date}&selectType=ALL&response=json`);
      if (json.stat && json.stat !== "OK") continue;
      const table = json.tables?.find((t) => t.title?.includes("融資融券彙總"));
      if (!table) continue;
      const asOf = parseMarketDate(json.date) ?? iso;
      rememberTradingDate(asOf);
      const row = table.data?.find((r) => String(r[0]).trim() === symbol);
      if (!row) {
        return {
          ok: true,
          data: null,
          provenance: provenance("TWSE MI_MARGN", `${TWSE_RWD}/marginTrading/MI_MARGN`, `${asOf}T13:30:00+08:00`),
        };
      }
      return {
        ok: true,
        data: {
          symbol,
          asOf,
          marginBuyBalance: parseTwNumber(row[6]),
          shortSellBalance: parseTwNumber(row[12]),
          source: "TWSE MI_MARGN",
        },
        provenance: provenance("TWSE MI_MARGN", `${TWSE_RWD}/marginTrading/MI_MARGN`, `${asOf}T13:30:00+08:00`),
      };
    } catch (err) {
      lastErr = err;
    }
  }
  if (lastErr) return fail("TWSE MI_MARGN", lastErr);
  return {
    ok: true,
    data: null,
    provenance: provenance("TWSE MI_MARGN", `${TWSE_RWD}/marginTrading/MI_MARGN`, isoNow()),
  };
}

export async function loadActions(): Promise<FetchResult<CorporateAction[]>> {
  try {
    const rows = await fetchJson<Array<Record<string, string>>>(`${TWSE_OPEN}/exchangeReport/TWT48U_ALL`);
    const data: CorporateAction[] = rows.map((r) => ({
      symbol: r.Code,
      date: rocToIso(r.Date) ?? r.Date,
      kind: r.Exdividend || "除權息",
      cashDividend: parseTwNumber(r.CashDividend),
      stockDividendRatio: parseTwNumber(r.StockDividendRatio),
      source: "TWSE TWT48U_ALL",
    }));
    return {
      ok: true,
      data,
      provenance: provenance("TWSE TWT48U_ALL", `${TWSE_OPEN}/exchangeReport/TWT48U_ALL`, isoNow()),
    };
  } catch (err) {
    return fail("TWSE TWT48U_ALL", err);
  }
}

export async function loadValuation(symbol: string): Promise<ValuationRow | null> {
  const uni = await loadUniverse();
  if (!uni.ok) return null;
  const q = uni.data.quotes.find((x) => x.symbol === symbol);
  if (!q) return null;
  return {
    symbol,
    asOf: q.eventTime.slice(0, 10),
    peRatio: q.peRatio,
    pbRatio: q.pbRatio,
    dividendYield: q.dividendYield,
    source: q.source,
  };
}

export async function testConnections(): Promise<
  Array<{ id: string; ok: boolean; ms: number; detail: string }>
> {
  const targets = [
    { id: "twse-openapi", url: `${TWSE_OPEN}/exchangeReport/STOCK_DAY_ALL` },
    { id: "twse-rwd", url: `${TWSE_RWD}/afterTrading/FMTQIK?response=json` },
    { id: "tpex-openapi", url: `${TPEX_OPEN}/tpex_mainboard_quotes` },
  ];
  const out = [];
  for (const t of targets) {
    const t0 = Date.now();
    try {
      const data = await fetchJson<unknown>(t.url, { timeoutMs: 12000, retries: 1 });
      const n = Array.isArray(data) ? data.length : typeof data === "object" && data && "stat" in data ? 1 : 0;
      out.push({ id: t.id, ok: true, ms: Date.now() - t0, detail: `取得 ${n} 筆` });
    } catch (err) {
      out.push({ id: t.id, ok: false, ms: Date.now() - t0, detail: errorMessage(err) });
    }
  }
  return out;
}

