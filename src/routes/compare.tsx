import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageTitle } from "@/components/layout/app-shell";
import { CandleChart } from "@/components/chart/candle-chart";
import { Input } from "@/components/ui/input";
import { formatPct, formatPrice } from "@/lib/domain/format";
import type { Market } from "@/lib/domain/types";
import { sma } from "@/lib/engine/indicators";
import { getHistory, getOverview, getUniverse } from "@/lib/server/market";
import { getSettings } from "@/lib/storage/db";

type Search = { a?: string; b?: string };

export const Route = createFileRoute("/compare")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    a: typeof s.a === "string" ? s.a : "TWSE:2330",
    b: typeof s.b === "string" ? s.b : "TWSE:2317",
  }),
  component: ComparePage,
});

function parse(s: string | undefined): { market: Market; symbol: string } {
  const [market, symbol] = (s ?? "TWSE:2330").split(":");
  return { market: market === "TPEX" ? "TPEX" : "TWSE", symbol: symbol || "2330" };
}

function ComparePage() {
  const search = Route.useSearch();
  const [a, setA] = useState(search.a ?? "TWSE:2330");
  const [b, setB] = useState(search.b ?? "TWSE:2317");
  const pa = parse(a);
  const pb = parse(b);
  const ha = useQuery({ queryKey: ["history", pa.market, pa.symbol], queryFn: () => getHistory({ data: { ...pa, months: 12 } }) });
  const hb = useQuery({ queryKey: ["history", pb.market, pb.symbol], queryFn: () => getHistory({ data: { ...pb, months: 12 } }) });
  const overview = useQuery({ queryKey: ["overview"], queryFn: () => getOverview() });
  const universe = useQuery({ queryKey: ["universe"], queryFn: () => getUniverse() });
  const settings = useQuery({ queryKey: ["settings"], queryFn: getSettings });
  const convention = settings.data?.colorConvention ?? "tw";
  const quotes = universe.data && universe.data.ok ? universe.data.data.quotes : overview.data && overview.data.ok ? overview.data.data.quotes : [];
  const qa = quotes.find((q) => q.market === pa.market && q.symbol === pa.symbol);
  const qb = quotes.find((q) => q.market === pb.market && q.symbol === pb.symbol);
  const barsA = ha.data && ha.data.ok ? ha.data.data : [];
  const barsB = hb.data && hb.data.ok ? hb.data.data : [];
  const ret = (bars: typeof barsA) =>
    bars.length >= 2 && bars[0].close ? ((bars[bars.length - 1].close - bars[0].close) / bars[0].close) * 100 : null;

  return (
    <AppShell>
      <PageTitle kicker="比較" title="標的對照" />
      <p className="mb-4 text-sm text-muted-foreground">比較期間為各自近 12 個月日K（原始價格）。格式：TWSE:2330</p>
      <div className="flex flex-wrap gap-2">
        <Input value={a} onChange={(e) => setA(e.target.value)} className="max-w-xs" />
        <Input value={b} onChange={(e) => setB(e.target.value)} className="max-w-xs" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Side title={`${pa.symbol} ${qa?.name ?? ""}`} price={qa?.close ?? null} periodRet={ret(barsA)} bars={barsA} convention={convention} />
        <Side title={`${pb.symbol} ${qb?.name ?? ""}`} price={qb?.close ?? null} periodRet={ret(barsB)} bars={barsB} convention={convention} />
      </div>
    </AppShell>
  );
}

function Side({
  title,
  price,
  periodRet,
  bars,
  convention,
}: {
  title: string;
  price: number | null;
  periodRet: number | null;
  bars: Parameters<typeof CandleChart>[0]["bars"];
  convention: "tw" | "us";
}) {
  const s20 = sma(
    bars.map((b) => b.close),
    20,
  );
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="mb-1 text-sm font-medium">{title}</div>
      <div className="mb-3 text-sm text-muted-foreground">
        最新 {formatPrice(price)} · 期間報酬 {formatPct(periodRet)}
      </div>
      {bars.length ? <CandleChart bars={bars} sma20={s20} convention={convention} /> : <div className="p-8 text-sm text-muted-foreground">沒有K線</div>}
    </div>
  );
}
