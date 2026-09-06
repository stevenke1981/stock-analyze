import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useMemo, useRef, useState } from "react";
import { AppShell, ErrorState, PageTitle } from "@/components/layout/app-shell";
import { DataStrip } from "@/components/quote/data-strip";
import { toneClass } from "@/components/quote/tone";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  changeArrow,
  formatNumber,
  formatPct,
  formatPrice,
  formatSharesAsLots,
  formatSigned,
  formatTwd,
} from "@/lib/domain/format";
import type { Quote } from "@/lib/domain/types";
import { getOverview, getUniverse } from "@/lib/server/market";
import { getSettings } from "@/lib/storage/db";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [overview, universe] = await Promise.all([getOverview(), getUniverse()]);
    return { overview, universe };
  },
  component: Home,
});

function Home() {
  const loaded = Route.useLoaderData();
  const overview = useQuery({
    queryKey: ["overview"],
    queryFn: () => getOverview(),
    initialData: loaded.overview,
  });
  const universe = useQuery({
    queryKey: ["universe"],
    queryFn: () => getUniverse(),
    initialData: loaded.universe,
  });
  const settings = useQuery({ queryKey: ["settings"], queryFn: getSettings });
  const convention = settings.data?.colorConvention ?? "tw";

  if (overview.isLoading) {
    return (
      <AppShell>
        <PageTitle kicker="市場總覽" title="台灣股市" />
        <div className="grid gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      </AppShell>
    );
  }
  if (overview.isError || !overview.data) {
    return (
      <AppShell>
        <ErrorState title="無法載入市場" body="請稍後重試。" onRetry={() => overview.refetch()} />
      </AppShell>
    );
  }
  const res = overview.data;
  if (!res.ok) {
    return (
      <AppShell>
        <ErrorState title="行情來源失敗" body={res.message} onRetry={() => overview.refetch()} />
      </AppShell>
    );
  }
  const d = res.data;
  const uniQuotes = universe.data && universe.data.ok ? universe.data.data.quotes : d.quotes;
  const quotes = uniQuotes.filter((q) => q.close != null);
  return (
    <AppShell>
      <PageTitle
        kicker="市場總覽"
        title="台灣股市"
        actions={
          <button
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            onClick={() => {
              overview.refetch();
              universe.refetch();
            }}
          >
            重新整理
          </button>
        }
      />
      <DataStrip provenance={d.provenance} error={d.error} />
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <IndexCard title="加權指數" value={d.taiex?.close ?? null} change={d.taiex?.change ?? null} pct={d.taiex?.changePct ?? null} convention={convention} />
        <IndexCard title="櫃買指數" value={d.otc?.close ?? null} change={d.otc?.change ?? null} pct={d.otc?.changePct ?? null} convention={convention} />
        <StatCard label="成交金額" value={formatTwd(d.tradeValue)} hint="上市市場" />
        <StatCard
          label="漲跌家數"
          value={`${formatNumber(d.breadth.advances)} / ${formatNumber(d.breadth.declines)}`}
          hint={`漲停 ${formatNumber(d.breadth.limitUp)} · 跌停 ${formatNumber(d.breadth.limitDown)}`}
        />
      </div>
      {d.indices.length > 1 ? (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {d.indices.slice(0, 8).map((idx) => (
            <div key={idx.id} className="min-w-40 rounded-md border border-border bg-card px-3 py-2">
              <div className="text-[11px] text-muted-foreground">{idx.name}</div>
              <div className={`tabular text-sm font-medium ${toneClass(idx.change, convention)}`}>
                {formatPrice(idx.close)} {changeArrow(idx.change)} {formatPct(idx.changePct)}
              </div>
            </div>
          ))}
        </div>
      ) : null}
      <Tabs defaultValue="gainers" className="mt-8">
        <TabsList>
          <TabsTrigger value="gainers">漲幅</TabsTrigger>
          <TabsTrigger value="losers">跌幅</TabsTrigger>
          <TabsTrigger value="volume">成交量</TabsTrigger>
          <TabsTrigger value="value">成交值</TabsTrigger>
          <TabsTrigger value="all">全部</TabsTrigger>
        </TabsList>
        {universe.isLoading && quotes.length === 0 ? (
          <div className="mt-4 grid gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-md" />
            ))}
          </div>
        ) : universe.data && !universe.data.ok && quotes.length === 0 ? (
          <ErrorState title="個股排行失敗" body={universe.data.message} onRetry={() => universe.refetch()} />
        ) : (
          <>
        <TabsContent value="gainers" className="mt-4">
          <QuoteTable quotes={top(quotes, "changePct", true, 40)} convention={convention} />
        </TabsContent>
        <TabsContent value="losers" className="mt-4">
          <QuoteTable quotes={top(quotes, "changePct", false, 40)} convention={convention} />
        </TabsContent>
        <TabsContent value="volume" className="mt-4">
          <QuoteTable quotes={top(quotes, "volumeShares", true, 40)} convention={convention} />
        </TabsContent>
        <TabsContent value="value" className="mt-4">
          <QuoteTable quotes={top(quotes, "tradeValue", true, 40)} convention={convention} />
        </TabsContent>
        <TabsContent value="all" className="mt-4">
          <AllQuotes quotes={quotes} convention={convention} />
        </TabsContent>
          </>
        )}
      </Tabs>
    </AppShell>
  );
}

function top(quotes: Quote[], field: keyof Quote, desc: boolean, n: number): Quote[] {
  return [...quotes]
    .filter((q) => typeof q[field] === "number")
    .sort((a, b) => {
      const av = Number(a[field]);
      const bv = Number(b[field]);
      return desc ? bv - av : av - bv;
    })
    .slice(0, n);
}

function IndexCard({
  title,
  value,
  change,
  pct,
  convention,
}: {
  title: string;
  value: number | null;
  change: number | null;
  pct: number | null;
  convention: "tw" | "us";
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground">{title}</div>
      <div className="mt-2 tabular text-2xl font-medium">{formatNumber(value, 2)}</div>
      <div className={`mt-1 tabular text-sm ${toneClass(change, convention)}`}>
        <span className="sr-only">{change != null && change > 0 ? "上漲" : change != null && change < 0 ? "下跌" : "持平"}</span>
        {changeArrow(change)} {formatSigned(change, 2)}（{formatPct(pct)}）
      </div>
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-2 tabular text-2xl font-medium">{value}</div>
      {hint ? <div className="mt-1 text-xs text-faint">{hint}</div> : null}
    </div>
  );
}

function QuoteTable({ quotes, convention }: { quotes: Quote[]; convention: "tw" | "us" }) {
  if (!quotes.length) {
    return <div className="text-sm text-muted-foreground">沒有可排序的資料。</div>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-secondary text-left text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">代號</th>
            <th className="px-3 py-2 font-medium">名稱</th>
            <th className="px-3 py-2 font-medium text-right">收盤</th>
            <th className="px-3 py-2 font-medium text-right">漲跌</th>
            <th className="px-3 py-2 font-medium text-right">漲跌幅</th>
            <th className="px-3 py-2 font-medium text-right">成交量</th>
            <th className="px-3 py-2 font-medium text-right">成交值</th>
            <th className="px-3 py-2 font-medium">市場</th>
          </tr>
        </thead>
        <tbody>
          {quotes.map((q) => (
            <tr key={`${q.market}-${q.symbol}`} className="border-t border-border hover:bg-secondary/50">
              <td className="px-3 py-2">
                <Link className="tabular font-medium underline-offset-4 hover:underline" to="/stock/$market/$symbol" params={{ market: q.market, symbol: q.symbol }}>
                  {q.symbol}
                </Link>
              </td>
              <td className="px-3 py-2">{q.name}</td>
              <td className="px-3 py-2 text-right tabular">{formatPrice(q.close)}</td>
              <td className={`px-3 py-2 text-right tabular ${toneClass(q.change, convention)}`}>
                {changeArrow(q.change)} {formatSigned(q.change)}
              </td>
              <td className={`px-3 py-2 text-right tabular ${toneClass(q.changePct, convention)}`}>{formatPct(q.changePct)}</td>
              <td className="px-3 py-2 text-right tabular">{formatSharesAsLots(q.volumeShares)}</td>
              <td className="px-3 py-2 text-right tabular">{formatTwd(q.tradeValue)}</td>
              <td className="px-3 py-2">
                <Badge variant="outline">{q.market === "TWSE" ? "上市" : "上櫃"}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AllQuotes({ quotes, convention }: { quotes: Quote[]; convention: "tw" | "us" }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return quotes;
    return quotes.filter((x) => x.symbol.toLowerCase().includes(s) || x.name.toLowerCase().includes(s));
  }, [quotes, q]);
  const parent = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parent.current,
    estimateSize: () => 44,
    overscan: 12,
  });
  return (
    <div>
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="過濾代號或名稱" className="mb-3 max-w-sm" />
      <div className="mb-2 text-xs text-muted-foreground">共 {filtered.length} 檔 · 虛擬化清單</div>
      <div ref={parent} className="h-[560px] overflow-auto rounded-lg border border-border">
        <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
          {virtualizer.getVirtualItems().map((v) => {
            const row = filtered[v.index];
            return (
              <Link
                key={`${row.market}-${row.symbol}`}
                to="/stock/$market/$symbol"
                params={{ market: row.market, symbol: row.symbol }}
                className="absolute left-0 right-0 flex items-center gap-3 border-b border-border px-3 text-sm hover:bg-secondary/50"
                style={{ height: v.size, transform: `translateY(${v.start}px)` }}
              >
                <span className="w-16 tabular font-medium">{row.symbol}</span>
                <span className="w-28 truncate">{row.name}</span>
                <span className="ml-auto w-20 text-right tabular">{formatPrice(row.close)}</span>
                <span className={`w-24 text-right tabular ${toneClass(row.changePct, convention)}`}>
                  {changeArrow(row.changePct)} {formatPct(row.changePct)}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
