import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageTitle } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatNumber, formatPct, formatPrice, formatTwd } from "@/lib/domain/format";
import type { Market } from "@/lib/domain/types";
import { runBacktest, type BacktestResult, type StrategyId } from "@/lib/engine/backtest";
import { getHistory } from "@/lib/server/market";

export const Route = createFileRoute("/backtest")({ component: BacktestPage });

function BacktestPage() {
  const [market, setMarket] = useState<Market>("TWSE");
  const [symbol, setSymbol] = useState("2330");
  const [strategy, setStrategy] = useState<StrategyId>("sma_cross");
  const [fast, setFast] = useState("20");
  const [slow, setSlow] = useState("60");
  const [cash, setCash] = useState("1000000");
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [netMs, setNetMs] = useState<number | null>(null);
  const [cpuMs, setCpuMs] = useState<number | null>(null);

  const run = useMutation({
    mutationFn: async () => {
      const t0 = performance.now();
      const hist = await getHistory({ data: { market, symbol, months: 24 } });
      const t1 = performance.now();
      if (!hist.ok) throw new Error(hist.message);
      const t2 = performance.now();
      const r = runBacktest(hist.data, {
        strategy,
        fast: Number(fast),
        slow: Number(slow),
        initialCash: Number(cash),
      });
      const t3 = performance.now();
      setNetMs(t1 - t0);
      setCpuMs(t3 - t2);
      return r;
    },
    onSuccess: setResult,
  });

  return (
    <AppShell>
      <PageTitle kicker="策略回測" title="可解釋策略" />
      <p className="mb-4 max-w-3xl text-sm text-muted-foreground">
        訊號於當日收盤形成，次一交易日開盤成交。預設手續費 0.1425%、賣出交易稅 0.3%、滑價 5 bps、整張交易。結果不是未來保證。官方日K為原始價格，未還原除權息。
      </p>
      <div className="flex flex-wrap gap-3">
        <Select value={market} onValueChange={(v) => setMarket(v as Market)}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TWSE">上市</SelectItem>
            <SelectItem value="TPEX">上櫃</SelectItem>
          </SelectContent>
        </Select>
        <Input className="w-28" value={symbol} onChange={(e) => setSymbol(e.target.value)} />
        <Select value={strategy} onValueChange={(v) => setStrategy(v as StrategyId)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sma_cross">均線交叉</SelectItem>
            <SelectItem value="rsi_reversion">RSI 反轉</SelectItem>
          </SelectContent>
        </Select>
        <Input className="w-20" value={fast} onChange={(e) => setFast(e.target.value)} aria-label="快線" />
        <Input className="w-20" value={slow} onChange={(e) => setSlow(e.target.value)} aria-label="慢線" />
        <Input className="w-36" value={cash} onChange={(e) => setCash(e.target.value)} aria-label="本金" />
        <Button onClick={() => run.mutate()} disabled={run.isPending}>
          {run.isPending ? "計算中…" : "執行回測"}
        </Button>
      </div>
      {run.isError ? <p className="mt-3 text-sm text-up">{(run.error as Error).message}</p> : null}
      {result ? (
        <div className="mt-6 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Tile label="總報酬" value={formatPct(result.totalReturnPct)} />
            <Tile label="年化" value={result.cagrPct == null ? "不滿一年" : formatPct(result.cagrPct)} />
            <Tile label="最大回撤" value={formatPct(result.maxDrawdownPct == null ? null : -Math.abs(result.maxDrawdownPct))} />
            <Tile label="勝率" value={formatPct(result.winRate, false)} />
            <Tile label="交易次數" value={formatNumber(result.tradeCount)} />
            <Tile label="買進持有" value={formatPct(result.benchmarkReturnPct)} />
          </div>
          <p className="text-xs text-muted-foreground">
            {result.method} 期間 {result.start} – {result.end} · K線 {result.bars} 根
            {netMs != null ? ` · 網路 ${netMs.toFixed(0)} ms` : ""}
            {cpuMs != null ? ` · 本機 ${cpuMs.toFixed(1)} ms` : ""}
          </p>
          <ul className="text-xs text-muted-foreground">
            {result.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
          <EquitySvg equity={result.equity} />
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-secondary text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">進場</th>
                  <th className="px-3 py-2 text-left">出場</th>
                  <th className="px-3 py-2 text-right">股數</th>
                  <th className="px-3 py-2 text-right">損益</th>
                  <th className="px-3 py-2 text-left">原因</th>
                </tr>
              </thead>
              <tbody>
                {result.trades.map((t, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-3 py-2">
                      {t.entryDate} @ {formatPrice(t.entryPrice)}
                    </td>
                    <td className="px-3 py-2">
                      {t.exitDate ? `${t.exitDate} @ ${formatPrice(t.exitPrice)}` : "未平倉"}
                    </td>
                    <td className="px-3 py-2 text-right tabular">{formatNumber(t.shares)}</td>
                    <td className="px-3 py-2 text-right tabular">{formatTwd(t.pnl)}</td>
                    <td className="px-3 py-2 text-xs">{t.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="mt-1 tabular text-lg">{value}</div>
    </div>
  );
}

function EquitySvg({ equity }: { equity: { date: string; equity: number }[] }) {
  if (equity.length < 2) return null;
  const w = 800;
  const h = 180;
  const min = Math.min(...equity.map((e) => e.equity));
  const max = Math.max(...equity.map((e) => e.equity));
  const span = max - min || 1;
  const d = equity
    .map((e, i) => {
      const x = (i / (equity.length - 1)) * w;
      const y = h - ((e.equity - min) / span) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="mb-2 text-xs text-muted-foreground">資金曲線</div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-44 w-full">
        <path d={d} fill="none" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    </div>
  );
}
