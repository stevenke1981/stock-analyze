import type { HoldingView, Market, Transaction } from "../domain/types.ts";

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
export const COST_METHOD_LABEL = "加權平均成本";

export interface PositionState {
  market: Market;
  symbol: string;
  name: string;
  shares: number;
  cost: number;
  realized: number;
}

export function applyTransactions(txns: Transaction[]): Map<string, PositionState> {
  const sorted = [...txns].sort((a, b) => {
    const d = a.tradeDate.localeCompare(b.tradeDate);
    if (d !== 0) return d;
    return a.createdAt.localeCompare(b.createdAt);
  });
  const map = new Map<string, PositionState>();
  for (const t of sorted) {
    const key = `${t.market}:${t.symbol}`;
    const pos =
      map.get(key) ??
      ({
        market: t.market,
        symbol: t.symbol,
        name: t.name,
        shares: 0,
        cost: 0,
        realized: 0,
      } satisfies PositionState);
    pos.name = t.name || pos.name;
    switch (t.side) {
      case "buy": {
        pos.cost += t.price * t.shares + t.fee + t.tax;
        pos.shares += t.shares;
        break;
      }
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
        if (ratio > 0) {
          pos.shares *= ratio;
          // cost unchanged, avgCost falls
        }
        break;
      }
      case "fee": {
        pos.realized -= t.fee;
        break;
      }
      default:
        break;
    }
    map.set(key, pos);
  }
  return map;
}

export function holdingsFrom(
  txns: Transaction[],
  marks: Map<string, { price: number | null; name?: string }>,
): { holdings: HoldingView[]; cashflowRealized: number; totalCost: number; totalMtm: number } {
  const positions = applyTransactions(txns);
  const holdings: HoldingView[] = [];
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
    const unrealizedPct =
      unrealized == null || pos.cost === 0 ? null : (unrealized / pos.cost) * 100;
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
      weight: null,
    });
  }
  const denom = totalMtm > 0 ? totalMtm : totalCost;
  for (const h of holdings) {
    const v = h.marketValue ?? h.cost;
    h.weight = denom > 0 ? (v / denom) * 100 : null;
  }
  holdings.sort((a, b) => (b.marketValue ?? b.cost) - (a.marketValue ?? a.cost));
  return { holdings, cashflowRealized, totalCost, totalMtm };
}

export interface CsvIssue {
  row: number;
  message: string;
}

export interface ParsedCsvRow {
  tradeDate: string;
  market: Market;
  symbol: string;
  name: string;
  side: Transaction["side"];
  shares: number;
  price: number;
  fee: number;
  tax: number;
  note: string;
}

const SIDE_MAP: Record<string, Transaction["side"]> = {
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
  費用: "fee",
};

export function parsePortfolioCsv(text: string): {
  rows: ParsedCsvRow[];
  issues: CsvIssue[];
} {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { rows: [], issues: [{ row: 0, message: "檔案是空的" }] };
  const header = splitCsv(lines[0]).map((h) => h.trim().toLowerCase());
  const idx = (names: string[]) =>
    header.findIndex((h) => names.includes(h));
  const iDate = idx(["date", "trade_date", "日期", "成交日"]);
  const iMarket = idx(["market", "市場"]);
  const iSymbol = idx(["symbol", "code", "代號", "股票代號"]);
  const iName = idx(["name", "名稱"]);
  const iSide = idx(["side", "買賣", "方向", "類型"]);
  const iShares = idx(["shares", "qty", "股數", "數量"]);
  const iPrice = idx(["price", "價格", "成交價"]);
  const iFee = idx(["fee", "手續費"]);
  const iTax = idx(["tax", "交易稅", "稅"]);
  const iNote = idx(["note", "備註"]);
  const issues: CsvIssue[] = [];
  if (iDate < 0 || iSymbol < 0 || iSide < 0 || iShares < 0 || iPrice < 0) {
    issues.push({
      row: 1,
      message: "缺少必要欄位。需要：日期, 代號, 方向, 股數, 價格（可用中英欄名）。",
    });
    return { rows: [], issues };
  }
  const rows: ParsedCsvRow[] = [];
  for (let r = 1; r < lines.length; r += 1) {
    const cols = splitCsv(lines[r]);
    const sideRaw = (cols[iSide] ?? "").trim();
    const side = SIDE_MAP[sideRaw.toLowerCase()] ?? SIDE_MAP[sideRaw];
    if (!side) {
      issues.push({ row: r + 1, message: `無法辨識方向「${sideRaw}」` });
      continue;
    }
    const symbol = (cols[iSymbol] ?? "").trim();
    if (!symbol) {
      issues.push({ row: r + 1, message: "缺少代號" });
      continue;
    }
    const shares = Number(String(cols[iShares] ?? "").replace(/,/g, ""));
    const price = Number(String(cols[iPrice] ?? "").replace(/,/g, ""));
    if (!Number.isFinite(shares) || !Number.isFinite(price)) {
      issues.push({ row: r + 1, message: "股數或價格不是數字" });
      continue;
    }
    const marketRaw = iMarket >= 0 ? (cols[iMarket] ?? "").trim().toUpperCase() : "TWSE";
    const market: Market = marketRaw === "TPEX" || marketRaw === "OTC" || marketRaw === "上櫃" ? "TPEX" : "TWSE";
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
      note: iNote >= 0 ? (cols[iNote] ?? "").trim() : "",
    });
  }
  return { rows, issues };
}

function numOr0(v: string | undefined): number {
  const n = Number(String(v ?? "0").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function normalizeDate(raw: string): string {
  const s = raw.trim().replace(/\./g, "-").replace(/\//g, "-");
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  return s;
}

function splitCsv(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (q && line[i + 1] === '"') {
        cur += '"';
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

export function toCsv(txns: Transaction[]): string {
  const header = "date,market,symbol,name,side,shares,price,fee,tax,note";
  const lines = txns.map((t) =>
    [
      t.tradeDate,
      t.market,
      t.symbol,
      csvEscape(t.name),
      t.side,
      t.shares,
      t.price,
      t.fee,
      t.tax,
      csvEscape(t.note),
    ].join(","),
  );
  return [header, ...lines].join("\n");
}

function csvEscape(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
