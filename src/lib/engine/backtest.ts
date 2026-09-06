import type { BarLike } from "./indicators.ts";
import { rsi, sma } from "./indicators.ts";

/**
 * Backtest rules (no lookahead):
 * - A signal is formed using bar T's close (and prior bars only).
 * - Orders fill at bar T+1 open.
 * - If T+1 is missing or open is invalid, the signal is skipped.
 * - Taiwan defaults: commission 0.1425% per side, sell tax 0.3%, optional slippage bps.
 * - Long-only. No shorting in v1.
 * - Dividends / splits are NOT applied unless corporate-action bars are supplied
 *   (historical point-in-time actions are not in the official daily candle API).
 * - Halted / zero-volume bars: if open is null-equivalent (we require open > 0
 *   and volumeShares >= 0), skip fill.
 */

export type StrategyId = "sma_cross" | "rsi_reversion";

export interface BacktestParams {
  strategy: StrategyId;
  fast?: number;
  slow?: number;
  rsiPeriod?: number;
  rsiBuy?: number;
  rsiSell?: number;
  initialCash: number;
  commissionRate: number;
  sellTaxRate: number;
  slippageBps: number;
  lotShares: number;
}

export interface BacktestTrade {
  entryDate: string;
  entryPrice: number;
  exitDate: string | null;
  exitPrice: number | null;
  shares: number;
  pnl: number | null;
  returnPct: number | null;
  reason: string;
}

export interface EquityPoint {
  date: string;
  equity: number;
  drawdownPct: number;
}

export interface BacktestResult {
  params: BacktestParams;
  method:
    | "訊號於當日收盤形成，次一交易日開盤成交；不含未提供的歷史股利與公司行動。";
  start: string | null;
  end: string | null;
  bars: number;
  totalReturnPct: number | null;
  cagrPct: number | null;
  maxDrawdownPct: number | null;
  winRate: number | null;
  tradeCount: number;
  benchmarkReturnPct: number | null;
  equity: EquityPoint[];
  trades: BacktestTrade[];
  warnings: string[];
}

const DEFAULTS: BacktestParams = {
  strategy: "sma_cross",
  fast: 20,
  slow: 60,
  rsiPeriod: 14,
  rsiBuy: 30,
  rsiSell: 70,
  initialCash: 1_000_000,
  commissionRate: 0.001425,
  sellTaxRate: 0.003,
  slippageBps: 5,
  lotShares: 1000,
};

export function runBacktest(bars: BarLike[], partial: Partial<BacktestParams>): BacktestResult {
  const params: BacktestParams = { ...DEFAULTS, ...partial };
  const warnings: string[] = [
    "回測結果不構成未來報酬保證。",
    "官方日K為原始價格，除權息與拆併股未還原，長期績效可能失真。",
    "訊號用收盤價、成交用次日開盤，避免以同一根收盤價成交的前視偏誤。",
  ];
  if (bars.length < 80) {
    warnings.push(`K 線僅 ${bars.length} 根，統計不穩定。`);
  }
  const closes = bars.map((b) => b.close);
  const signals: Array<"buy" | "sell" | "hold"> = Array(bars.length).fill("hold");

  if (params.strategy === "sma_cross") {
    const fast = sma(closes, params.fast ?? 20);
    const slow = sma(closes, params.slow ?? 60);
    for (let i = 1; i < bars.length; i += 1) {
      if (fast[i] == null || slow[i] == null || fast[i - 1] == null || slow[i - 1] == null) {
        continue;
      }
      const prevDiff = (fast[i - 1] as number) - (slow[i - 1] as number);
      const diff = (fast[i] as number) - (slow[i] as number);
      if (prevDiff <= 0 && diff > 0) signals[i] = "buy";
      else if (prevDiff >= 0 && diff < 0) signals[i] = "sell";
    }
  } else {
    const r = rsi(closes, params.rsiPeriod ?? 14);
    const buyTh = params.rsiBuy ?? 30;
    const sellTh = params.rsiSell ?? 70;
    for (let i = 1; i < bars.length; i += 1) {
      if (r[i] == null || r[i - 1] == null) continue;
      if ((r[i - 1] as number) >= buyTh && (r[i] as number) < buyTh) signals[i] = "buy";
      else if ((r[i - 1] as number) <= sellTh && (r[i] as number) > sellTh) signals[i] = "sell";
    }
  }

  let cash = params.initialCash;
  let shares = 0;
  let entryPrice = 0;
  let entryDate = "";
  const trades: BacktestTrade[] = [];
  const equity: EquityPoint[] = [];
  let peak = params.initialCash;
  let maxDd = 0;
  const slip = params.slippageBps / 10000;

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
          returnPct: entryPrice > 0 ? (pnl / (entryPrice * shares)) * 100 : null,
          reason: params.strategy === "sma_cross" ? "均線死叉賣出" : "RSI 超買賣出",
        });
        shares = 0;
        entryPrice = 0;
        entryDate = "";
      }
    }
    const mtm = cash + shares * bars[i].close;
    peak = Math.max(peak, mtm);
    const dd = peak > 0 ? ((peak - mtm) / peak) * 100 : 0;
    maxDd = Math.max(maxDd, dd);
    equity.push({ date: bars[i].time, equity: mtm, drawdownPct: dd });
  }

  if (shares > 0 && bars.length) {
    const last = bars[bars.length - 1];
    const mtm = last.close * shares;
    const pnl = mtm - entryPrice * shares;
    trades.push({
      entryDate,
      entryPrice,
      exitDate: null,
      exitPrice: null,
      shares,
      pnl,
      returnPct: entryPrice > 0 ? (pnl / (entryPrice * shares)) * 100 : null,
      reason: "期末未平倉（以最後收盤評價，非成交）",
    });
    warnings.push("期末持倉以最後收盤評價，不是真實成交。");
  }

  const startEq = params.initialCash;
  const endEq = equity.at(-1)?.equity ?? startEq;
  const totalReturnPct = startEq > 0 ? ((endEq - startEq) / startEq) * 100 : null;
  const start = bars[0]?.time ?? null;
  const end = bars.at(-1)?.time ?? null;
  let cagrPct: number | null = null;
  if (start && end && startEq > 0) {
    const years =
      (new Date(`${end}T00:00:00+08:00`).getTime() -
        new Date(`${start}T00:00:00+08:00`).getTime()) /
      (365.25 * 86400000);
    if (years >= 1) cagrPct = (Math.pow(endEq / startEq, 1 / years) - 1) * 100;
    else warnings.push("期間未滿一年，不揭示年化報酬。");
  }
  const closed = trades.filter((t) => t.exitDate);
  const wins = closed.filter((t) => (t.pnl ?? 0) > 0).length;
  const winRate = closed.length ? (wins / closed.length) * 100 : null;
  const bench =
    bars.length >= 2 && bars[0].close > 0
      ? ((bars[bars.length - 1].close - bars[0].close) / bars[0].close) * 100
      : null;

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
    warnings,
  };
}
