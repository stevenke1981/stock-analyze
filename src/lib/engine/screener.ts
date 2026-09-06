import type { Quote, ScreenerRule } from "../domain/types.ts";

export function applyScreener(quotes: Quote[], rules: ScreenerRule[]): Quote[] {
  return quotes.filter((q) => rules.every((rule) => matchRule(q, rule)));
}

function matchRule(q: Quote, rule: ScreenerRule): boolean {
  const value = fieldOf(q, rule.field);
  if (typeof rule.value === "string" && (rule.op === "contains" || rule.op === "eq")) {
    const hay = String(value ?? "").toLowerCase();
    const needle = rule.value.toLowerCase();
    return rule.op === "contains" ? hay.includes(needle) : hay === needle;
  }
  const n = typeof value === "number" ? value : null;
  const target = Number(rule.value);
  if (n == null || Number.isNaN(target)) return false;
  if (rule.op === "gte") return n >= target;
  if (rule.op === "lte") return n <= target;
  return n === target;
}

function fieldOf(q: Quote, field: string): number | string | null {
  switch (field) {
    case "close":
      return q.close;
    case "changePct":
      return q.changePct;
    case "volumeShares":
      return q.volumeShares;
    case "tradeValue":
      return q.tradeValue;
    case "peRatio":
      return q.peRatio;
    case "pbRatio":
      return q.pbRatio;
    case "dividendYield":
      return q.dividendYield;
    case "name":
      return q.name;
    case "symbol":
      return q.symbol;
    case "industry":
      return q.industry;
    case "market":
      return q.market;
    default:
      return null;
  }
}

export const SCREENER_FIELDS: { id: string; label: string; kind: "number" | "text" }[] = [
  { id: "close", label: "收盤價", kind: "number" },
  { id: "changePct", label: "漲跌幅 %", kind: "number" },
  { id: "volumeShares", label: "成交股數", kind: "number" },
  { id: "tradeValue", label: "成交金額", kind: "number" },
  { id: "peRatio", label: "本益比", kind: "number" },
  { id: "pbRatio", label: "股價淨值比", kind: "number" },
  { id: "dividendYield", label: "殖利率 %", kind: "number" },
  { id: "industry", label: "產業", kind: "text" },
  { id: "name", label: "名稱", kind: "text" },
  { id: "symbol", label: "代號", kind: "text" },
  { id: "market", label: "市場", kind: "text" },
];
