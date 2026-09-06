export type Market = "TWSE" | "TPEX";
export type Currency = "TWD";
export type Timeframe = "1D" | "1W" | "1M";
export type QuoteStatus =
  | "realtime"
  | "delayed"
  | "after_hours"
  | "stale"
  | "unavailable";
export type SessionKind = "regular" | "after_hours" | "closed" | "holiday";
export type PriceAdjustment = "raw" | "adjusted";
export type DataLatency = "realtime" | "delayed" | "after_hours";

export interface DataProvenance {
  source: string;
  sourceUrl: string;
  eventTime: string;
  fetchedAt: string;
  timeframe: Timeframe;
  session: SessionKind;
  status: QuoteStatus;
  adjustment: PriceAdjustment;
  latency: DataLatency;
}

export interface Quote extends DataProvenance {
  market: Market;
  symbol: string;
  name: string;
  currency: Currency;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  change: number | null;
  changePct: number | null;
  volumeShares: number | null;
  tradeValue: number | null;
  transactions: number | null;
  previousClose: number | null;
  peRatio: number | null;
  pbRatio: number | null;
  dividendYield: number | null;
  industry: string | null;
}

export interface Bar extends DataProvenance {
  market: Market;
  symbol: string;
  currency: Currency;
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volumeShares: number;
  tradeValue: number | null;
  transactions: number | null;
}

export interface Instrument {
  market: Market;
  symbol: string;
  name: string;
  shortName: string;
  industry: string | null;
  listedAt: string | null;
  currency: Currency;
  isEtf: boolean;
}

export interface IndexQuote extends DataProvenance {
  id: string;
  name: string;
  close: number | null;
  change: number | null;
  changePct: number | null;
}

export interface MarketBreadth {
  advances: number | null;
  declines: number | null;
  unchanged: number | null;
  limitUp: number | null;
  limitDown: number | null;
  asOf: string | null;
}

export interface MarketOverview {
  session: SessionKind;
  lastTradingDate: string | null;
  taiex: IndexQuote | null;
  otc: IndexQuote | null;
  volumeShares: number | null;
  tradeValue: number | null;
  transactions: number | null;
  breadth: MarketBreadth;
  quotes: Quote[];
  indices: IndexQuote[];
  provenance: DataProvenance;
  error?: string;
}

export interface MonthlyRevenue {
  symbol: string;
  period: string;
  publishedAt: string | null;
  revenue: number | null;
  revenueMomPct: number | null;
  revenueYoyPct: number | null;
  ytdRevenue: number | null;
  ytdYoyPct: number | null;
  note: string | null;
  source: string;
}

export interface ValuationRow {
  symbol: string;
  asOf: string;
  peRatio: number | null;
  pbRatio: number | null;
  dividendYield: number | null;
  source: string;
}

export interface InstitutionFlow {
  symbol: string;
  asOf: string;
  foreignNetShares: number | null;
  investmentTrustNetShares: number | null;
  dealerNetShares: number | null;
  totalNetShares: number | null;
  source: string;
}

export interface MarginBalance {
  symbol: string;
  asOf: string;
  marginBuyBalance: number | null;
  shortSellBalance: number | null;
  source: string;
}

export interface CorporateAction {
  symbol: string;
  date: string;
  kind: string;
  cashDividend: number | null;
  stockDividendRatio: number | null;
  source: string;
}

export interface FetchError {
  ok: false;
  code:
    | "timeout"
    | "rate_limit"
    | "auth"
    | "unavailable"
    | "parse"
    | "offline"
    | "not_found";
  message: string;
  source: string;
  fetchedAt: string;
}

export interface FetchOk<T> {
  ok: true;
  data: T;
  provenance: DataProvenance;
}

export type FetchResult<T> = FetchOk<T> | FetchError;

export interface WatchlistGroup {
  id: string;
  name: string;
  sort: number;
  createdAt: string;
}

export interface WatchlistItem {
  id: string;
  groupId: string;
  market: Market;
  symbol: string;
  note: string;
  sort: number;
  createdAt: string;
}

export type Side = "buy" | "sell" | "dividend" | "split" | "fee";

export interface Transaction {
  id: string;
  market: Market;
  symbol: string;
  name: string;
  side: Side;
  shares: number;
  price: number;
  fee: number;
  tax: number;
  tradeDate: string;
  note: string;
  createdAt: string;
}

export interface HoldingView {
  market: Market;
  symbol: string;
  name: string;
  shares: number;
  avgCost: number;
  marketPrice: number | null;
  marketValue: number | null;
  cost: number;
  unrealized: number | null;
  unrealizedPct: number | null;
  realized: number;
  weight: number | null;
}

export interface Note {
  id: string;
  market: Market | "";
  symbol: string;
  title: string;
  body: string;
  updatedAt: string;
}

export interface PriceAlert {
  id: string;
  market: Market;
  symbol: string;
  op: "gte" | "lte";
  price: number;
  note: string;
  enabled: boolean;
  triggeredAt: string | null;
}

export interface ScreenerRule {
  field: string;
  op: "gte" | "lte" | "eq" | "contains";
  value: number | string;
}

export interface SavedScreener {
  id: string;
  name: string;
  rules: ScreenerRule[];
  sortField: string;
  sortDir: "asc" | "desc";
  updatedAt: string;
}

export const PROMPT_VERSION = "research.v1";
export const COST_METHOD = "average" as const;
