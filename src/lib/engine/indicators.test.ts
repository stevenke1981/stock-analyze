import assert from "node:assert/strict";
import test from "node:test";
import { ema, macd, rsi, sma, snapshot, stochastic } from "./indicators.ts";
import { holdingsFrom, type ParsedCsvRow } from "./portfolio.ts";
import { applyTransactions } from "./portfolio.ts";
import type { Transaction } from "../domain/types.ts";
import { runBacktest } from "./backtest.ts";
import type { BarLike } from "./indicators.ts";

test("SMA does not fabricate zeros", () => {
  const v = [1, 2, 3, 4, 5];
  const s = sma(v, 3);
  assert.equal(s[0], null);
  assert.equal(s[1], null);
  assert.equal(s[2], 2);
  assert.equal(s[3], 3);
  assert.equal(s[4], 4);
});

test("EMA seeds from SMA then compounds", () => {
  const v = [2, 4, 6, 8, 10];
  const e = ema(v, 3);
  assert.equal(e[0], null);
  assert.equal(e[1], null);
  assert.equal(e[2], 4);
  const k = 2 / 4;
  assert.ok(Math.abs((e[3] as number) - (8 * k + 4 * (1 - k))) < 1e-10);
});

test("RSI is 100 when only gains", () => {
  const closes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  const r = rsi(closes, 14);
  assert.equal(r[14], 100);
});

test("MACD warmup leaves nulls", () => {
  const closes = Array.from({ length: 20 }, (_, i) => i + 1);
  const m = macd(closes);
  assert.equal(m.macd[10], null);
});

test("KD initializes at 50", () => {
  const bars: BarLike[] = Array.from({ length: 12 }, (_, i) => ({
    time: `2024-01-${String(i + 1).padStart(2, "0")}`,
    open: 10,
    high: 12,
    low: 8,
    close: 10,
    volumeShares: 1000,
  }));
  const kd = stochastic(bars, 9);
  assert.ok(kd.k[8] != null);
});

test("snapshot flags insufficient warmup", () => {
  const bars: BarLike[] = Array.from({ length: 10 }, (_, i) => ({
    time: `2024-01-${String(i + 1).padStart(2, "0")}`,
    open: 10,
    high: 11,
    low: 9,
    close: 10 + i,
    volumeShares: 1000,
  }));
  const s = snapshot(bars);
  assert.equal(s.warmupOk, false);
  assert.equal(s.alignment, "insufficient");
});

function txn(partial: Partial<Transaction> & Pick<Transaction, "side" | "shares" | "price">): Transaction {
  return {
    id: crypto.randomUUID(),
    market: "TWSE",
    symbol: "2330",
    name: "台積電",
    fee: 0,
    tax: 0,
    tradeDate: "2024-01-01",
    note: "",
    createdAt: "2024-01-01T00:00:00.000Z",
    ...partial,
  };
}

test("average cost and realized PnL", () => {
  const pos = applyTransactions([
    txn({ side: "buy", shares: 1000, price: 100, fee: 100, tradeDate: "2024-01-01" }),
    txn({ side: "buy", shares: 1000, price: 120, fee: 100, tradeDate: "2024-01-02" }),
    txn({ side: "sell", shares: 1000, price: 130, fee: 100, tax: 390, tradeDate: "2024-01-03" }),
  ]);
  const p = pos.get("TWSE:2330")!;
  assert.equal(p.shares, 1000);
  const avg = (1000 * 100 + 100 + 1000 * 120 + 100) / 2000;
  assert.ok(Math.abs(p.cost / p.shares - avg) < 1e-9);
  const sellNet = 130 * 1000 - 100 - 390;
  assert.ok(Math.abs(p.realized - (sellNet - avg * 1000)) < 1e-6);
});

test("dividend does not reduce cost", () => {
  const pos = applyTransactions([
    txn({ side: "buy", shares: 1000, price: 100, tradeDate: "2024-01-01" }),
    txn({ side: "dividend", shares: 1000, price: 2, tradeDate: "2024-06-01" }),
  ]);
  const p = pos.get("TWSE:2330")!;
  assert.equal(p.shares, 1000);
  assert.equal(p.cost, 100000);
  assert.equal(p.realized, 2000);
});

test("backtest does not fill at signal close", () => {
  const bars: BarLike[] = [];
  for (let i = 0; i < 80; i += 1) {
    const close = i < 40 ? 100 - i * 0.5 : 80 + (i - 40) * 1.2;
    bars.push({
      time: `2024-01-01`,
      open: close - 0.2,
      high: close + 1,
      low: close - 1,
      close,
      volumeShares: 1000000,
    });
    bars[i].time = `2024-${String(Math.floor(i / 28) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`;
  }
  const r = runBacktest(bars, { strategy: "sma_cross", fast: 5, slow: 20, initialCash: 1_000_000 });
  for (const t of r.trades) {
    if (!t.exitDate) continue;
    assert.notEqual(t.entryDate, t.exitDate);
  }
  assert.equal(r.method.includes("次一交易日開盤"), true);
});

function feeTestBars(): BarLike[] {
  return [3, 2, 1, 2, 3, 2, 1, 1].map((close, i) => ({
    time: `2024-01-${String(i + 1).padStart(2, "0")}`,
    open: 10,
    high: 11,
    low: 1,
    close,
    volumeShares: 1000,
  }));
}

test("backtest trade PnL includes buy and sell commission", () => {
  const result = runBacktest(feeTestBars(), {
    strategy: "sma_cross",
    fast: 2,
    slow: 3,
    initialCash: 100_000,
    commissionRate: 0.01,
    sellTaxRate: 0,
    slippageBps: 0,
    lotShares: 1000,
  });
  const trade = result.trades[0];
  assert.ok(trade);
  assert.equal(trade.entryFee, 900);
  assert.equal(trade.exitFee, 900);
  assert.equal(trade.entryCost, 90_900);
  assert.equal(trade.pnl, -1_800);
  assert.ok(Math.abs((trade.returnPct ?? 0) - (-1_800 / 90_900) * 100) < 1e-12);
  assert.ok(Math.abs((result.totalReturnPct ?? 0) - -1.8) < 1e-12);
  assert.equal(result.winRate, 0);
});

test("backtest skips fills on zero-volume bars", () => {
  const bars = feeTestBars();
  bars[5].volumeShares = 0;
  const result = runBacktest(bars, {
    strategy: "sma_cross",
    fast: 2,
    slow: 3,
    initialCash: 100_000,
    commissionRate: 0.01,
    sellTaxRate: 0,
    slippageBps: 0,
    lotShares: 1000,
  });
  assert.equal(result.trades.length, 0);
  assert.ok(result.warnings.some((warning) => warning.includes("1 個訊號")));
});

test("backtest rejects invalid strategy parameters", () => {
  assert.throws(
    () => runBacktest(feeTestBars(), { strategy: "sma_cross", fast: 20, slow: 10 }),
    /快線必須小於慢線/,
  );
});

test("holdingsFrom weights sum near 100", () => {
  const tx: Transaction[] = [
    txn({ side: "buy", shares: 1000, price: 100, symbol: "2330" }),
    txn({ side: "buy", shares: 1000, price: 50, symbol: "2317" }),
  ];
  const marks = new Map([
    ["TWSE:2330", { price: 110 }],
    ["TWSE:2317", { price: 40 }],
  ]);
  const { holdings } = holdingsFrom(tx, marks);
  const w = holdings.reduce((s, h) => s + (h.weight ?? 0), 0);
  assert.ok(Math.abs(w - 100) < 1e-6);
});

void (0 as unknown as ParsedCsvRow);
