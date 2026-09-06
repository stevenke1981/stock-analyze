/**
 * Technical indicators.
 *
 * Missing values are returned as null — never filled with zero.
 * Warmup: a value is defined only when the lookback window is complete.
 *
 * SMA(n): arithmetic mean of the last n closes.
 * EMA(n): k = 2/(n+1); seed = SMA of the first n values (Wilder-style seed via SMA).
 * MACD: EMA(12) − EMA(26); signal = EMA(9) of MACD; hist = MACD − signal.
 * RSI(n): Wilder smoothing of average gain/loss; RSI = 100 − 100/(1+RS).
 * KD: RSV = (C − Ln)/(Hn − Ln) × 100; K = 2/3 Kprev + 1/3 RSV; D = 2/3 Dprev + 1/3 K.
 *      Initial K, D = 50. Division by zero (Hn = Ln) → RSV = 50.
 * Bollinger(n, k): SMA ± k × population σ (divide by n, not n−1).
 * ATR(n): Wilder of True Range; TR = max(H−L, |H−prevC|, |L−prevC|).
 * Volume SMA: SMA of volumeShares.
 */

export interface BarLike {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volumeShares: number;
}

export function sma(values: Array<number | null>, n: number): Array<number | null> {
  const out: Array<number | null> = Array(values.length).fill(null);
  if (n <= 0) return out;
  let sum = 0;
  let count = 0;
  for (let i = 0; i < values.length; i += 1) {
    const v = values[i];
    if (v == null) {
      sum = 0;
      count = 0;
      continue;
    }
    sum += v;
    count += 1;
    if (count > n) {
      const old = values[i - n];
      if (old != null) {
        sum -= old;
        count -= 1;
      } else {
        sum = 0;
        count = 0;
        for (let j = i - n + 1; j <= i; j += 1) {
          const x = values[j];
          if (x == null) {
            sum = 0;
            count = 0;
            break;
          }
          sum += x;
          count += 1;
        }
      }
    }
    if (count === n) out[i] = sum / n;
  }
  return out;
}

export function ema(values: Array<number | null>, n: number): Array<number | null> {
  const out: Array<number | null> = Array(values.length).fill(null);
  if (n <= 0) return out;
  const k = 2 / (n + 1);
  const seed = sma(values, n);
  let prev: number | null = null;
  for (let i = 0; i < values.length; i += 1) {
    const v = values[i];
    if (v == null) {
      prev = null;
      continue;
    }
    if (prev == null) {
      if (seed[i] == null) continue;
      prev = seed[i];
      out[i] = prev;
      continue;
    }
    prev = v * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

export function macd(
  closes: Array<number | null>,
  fast = 12,
  slow = 26,
  signal = 9,
): { macd: Array<number | null>; signal: Array<number | null>; hist: Array<number | null> } {
  const emaFast = ema(closes, fast);
  const emaSlow = ema(closes, slow);
  const line: Array<number | null> = emaFast.map((a, i) =>
    a == null || emaSlow[i] == null ? null : a - (emaSlow[i] as number),
  );
  const sig = ema(line, signal);
  const hist = line.map((a, i) => (a == null || sig[i] == null ? null : a - (sig[i] as number)));
  return { macd: line, signal: sig, hist };
}

export function rsi(closes: Array<number | null>, n = 14): Array<number | null> {
  const out: Array<number | null> = Array(closes.length).fill(null);
  if (n <= 0) return out;
  let avgGain = 0;
  let avgLoss = 0;
  let ready = false;
  let prev: number | null = null;
  let gains: number[] = [];
  let losses: number[] = [];
  for (let i = 0; i < closes.length; i += 1) {
    const c = closes[i];
    if (c == null || prev == null) {
      prev = c;
      continue;
    }
    const ch = c - prev;
    const gain = Math.max(ch, 0);
    const loss = Math.max(-ch, 0);
    prev = c;
    if (!ready) {
      gains.push(gain);
      losses.push(loss);
      if (gains.length === n) {
        avgGain = gains.reduce((a, b) => a + b, 0) / n;
        avgLoss = losses.reduce((a, b) => a + b, 0) / n;
        ready = true;
        out[i] = rsiFrom(avgGain, avgLoss);
      }
      continue;
    }
    avgGain = (avgGain * (n - 1) + gain) / n;
    avgLoss = (avgLoss * (n - 1) + loss) / n;
    out[i] = rsiFrom(avgGain, avgLoss);
  }
  return out;
}

function rsiFrom(avgGain: number, avgLoss: number): number {
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function stochastic(
  bars: BarLike[],
  n = 9,
): { k: Array<number | null>; d: Array<number | null>; rsv: Array<number | null> } {
  const k: Array<number | null> = Array(bars.length).fill(null);
  const d: Array<number | null> = Array(bars.length).fill(null);
  const rsv: Array<number | null> = Array(bars.length).fill(null);
  let prevK = 50;
  let prevD = 50;
  for (let i = 0; i < bars.length; i += 1) {
    if (i + 1 < n) continue;
    let hn = -Infinity;
    let ln = Infinity;
    let complete = true;
    for (let j = i - n + 1; j <= i; j += 1) {
      const b = bars[j];
      if (!b) {
        complete = false;
        break;
      }
      hn = Math.max(hn, b.high);
      ln = Math.min(ln, b.low);
    }
    if (!complete) continue;
    const r = hn === ln ? 50 : ((bars[i].close - ln) / (hn - ln)) * 100;
    rsv[i] = r;
    const kNow = (2 / 3) * prevK + (1 / 3) * r;
    const dNow = (2 / 3) * prevD + (1 / 3) * kNow;
    k[i] = kNow;
    d[i] = dNow;
    prevK = kNow;
    prevD = dNow;
  }
  return { k, d, rsv };
}

export function bollinger(
  values: Array<number | null>,
  n = 20,
  k = 2,
): { mid: Array<number | null>; upper: Array<number | null>; lower: Array<number | null> } {
  const mid = sma(values, n);
  const upper: Array<number | null> = Array(values.length).fill(null);
  const lower: Array<number | null> = Array(values.length).fill(null);
  for (let i = 0; i < values.length; i += 1) {
    if (mid[i] == null) continue;
    let sum = 0;
    let ok = true;
    for (let j = i - n + 1; j <= i; j += 1) {
      const v = values[j];
      if (v == null) {
        ok = false;
        break;
      }
      const d = v - (mid[i] as number);
      sum += d * d;
    }
    if (!ok) continue;
    const sigma = Math.sqrt(sum / n);
    upper[i] = (mid[i] as number) + k * sigma;
    lower[i] = (mid[i] as number) - k * sigma;
  }
  return { mid, upper, lower };
}

export function atr(bars: BarLike[], n = 14): Array<number | null> {
  const out: Array<number | null> = Array(bars.length).fill(null);
  const trs: Array<number | null> = Array(bars.length).fill(null);
  for (let i = 0; i < bars.length; i += 1) {
    const b = bars[i];
    if (i === 0) {
      trs[i] = b.high - b.low;
      continue;
    }
    const prev = bars[i - 1].close;
    trs[i] = Math.max(b.high - b.low, Math.abs(b.high - prev), Math.abs(b.low - prev));
  }
  const wilder = emaLikeWilder(trs, n);
  for (let i = 0; i < bars.length; i += 1) out[i] = wilder[i];
  return out;
}

function emaLikeWilder(values: Array<number | null>, n: number): Array<number | null> {
  const out: Array<number | null> = Array(values.length).fill(null);
  let acc = 0;
  let count = 0;
  let prev: number | null = null;
  for (let i = 0; i < values.length; i += 1) {
    const v = values[i];
    if (v == null) continue;
    if (prev == null) {
      acc += v;
      count += 1;
      if (count === n) {
        prev = acc / n;
        out[i] = prev;
      }
      continue;
    }
    prev = (prev * (n - 1) + v) / n;
    out[i] = prev;
  }
  return out;
}

export function volumeSma(bars: BarLike[], n = 20): Array<number | null> {
  return sma(
    bars.map((b) => b.volumeShares),
    n,
  );
}

export function donchian(
  bars: BarLike[],
  n = 20,
): { high: Array<number | null>; low: Array<number | null> } {
  const high: Array<number | null> = Array(bars.length).fill(null);
  const low: Array<number | null> = Array(bars.length).fill(null);
  for (let i = 0; i < bars.length; i += 1) {
    if (i + 1 < n) continue;
    let h = -Infinity;
    let l = Infinity;
    for (let j = i - n + 1; j <= i; j += 1) {
      h = Math.max(h, bars[j].high);
      l = Math.min(l, bars[j].low);
    }
    high[i] = h;
    low[i] = l;
  }
  return { high, low };
}

export type Alignment = "bullish" | "bearish" | "mixed" | "insufficient";

export function maAlignment(
  short: number | null,
  mid: number | null,
  long: number | null,
): Alignment {
  if (short == null || mid == null || long == null) return "insufficient";
  if (short > mid && mid > long) return "bullish";
  if (short < mid && mid < long) return "bearish";
  return "mixed";
}

export function breakoutAbove(
  close: number | null,
  priorHigh: number | null,
): boolean | null {
  if (close == null || priorHigh == null) return null;
  return close > priorHigh;
}

export function lastDefined<T>(arr: Array<T | null>): T | null {
  for (let i = arr.length - 1; i >= 0; i -= 1) {
    if (arr[i] != null) return arr[i] as T;
  }
  return null;
}

export function closesOf(bars: BarLike[]): Array<number | null> {
  return bars.map((b) => b.close);
}

export interface SnapshotIndicators {
  asOf: string | null;
  warmupOk: boolean;
  sma5: number | null;
  sma20: number | null;
  sma60: number | null;
  ema12: number | null;
  ema26: number | null;
  macd: number | null;
  macdSignal: number | null;
  macdHist: number | null;
  rsi14: number | null;
  k: number | null;
  d: number | null;
  bbMid: number | null;
  bbUpper: number | null;
  bbLower: number | null;
  atr14: number | null;
  volSma20: number | null;
  alignment: Alignment;
  note: string;
}

export function snapshot(bars: BarLike[]): SnapshotIndicators {
  const closes = closesOf(bars);
  const s5 = sma(closes, 5);
  const s20 = sma(closes, 20);
  const s60 = sma(closes, 60);
  const e12 = ema(closes, 12);
  const e26 = ema(closes, 26);
  const m = macd(closes);
  const r = rsi(closes, 14);
  const kd = stochastic(bars, 9);
  const bb = bollinger(closes, 20, 2);
  const a = atr(bars, 14);
  const v = volumeSma(bars, 20);
  const align = maAlignment(lastDefined(s5), lastDefined(s20), lastDefined(s60));
  const warmupOk = bars.length >= 60;
  return {
    asOf: bars.at(-1)?.time ?? null,
    warmupOk,
    sma5: lastDefined(s5),
    sma20: lastDefined(s20),
    sma60: lastDefined(s60),
    ema12: lastDefined(e12),
    ema26: lastDefined(e26),
    macd: lastDefined(m.macd),
    macdSignal: lastDefined(m.signal),
    macdHist: lastDefined(m.hist),
    rsi14: lastDefined(r),
    k: lastDefined(kd.k),
    d: lastDefined(kd.d),
    bbMid: lastDefined(bb.mid),
    bbUpper: lastDefined(bb.upper),
    bbLower: lastDefined(bb.lower),
    atr14: lastDefined(a),
    volSma20: lastDefined(v),
    alignment: align,
    note: warmupOk
      ? "指標以原始收盤價計算，未做除權息還原。"
      : `資料僅 ${bars.length} 根，未滿 60 根暖機，均線排列可能不足。`,
  };
}

export function resample(
  bars: BarLike[],
  timeframe: "1W" | "1M",
): BarLike[] {
  const groups = new Map<string, BarLike[]>();
  for (const b of bars) {
    const key =
      timeframe === "1W" ? isoWeekKey(b.time) : b.time.slice(0, 7);
    const arr = groups.get(key) ?? [];
    arr.push(b);
    groups.set(key, arr);
  }
  const out: BarLike[] = [];
  for (const arr of groups.values()) {
    const first = arr[0];
    const last = arr[arr.length - 1];
    out.push({
      time: last.time,
      open: first.open,
      high: Math.max(...arr.map((x) => x.high)),
      low: Math.min(...arr.map((x) => x.low)),
      close: last.close,
      volumeShares: arr.reduce((s, x) => s + x.volumeShares, 0),
    });
  }
  return out;
}

function isoWeekKey(iso: string): string {
  const d = new Date(`${iso}T00:00:00+08:00`);
  const tmp = new Date(d);
  tmp.setHours(0, 0, 0, 0);
  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
  const week1 = new Date(tmp.getFullYear(), 0, 4);
  const week =
    1 +
    Math.round(
      ((tmp.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) /
        7,
    );
  return `${tmp.getFullYear()}-W${String(week).padStart(2, "0")}`;
}
