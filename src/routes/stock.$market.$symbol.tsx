import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CandleChart } from "@/components/chart/candle-chart";
import { AppShell, ErrorState, PageTitle } from "@/components/layout/app-shell";
import { DataStrip } from "@/components/quote/data-strip";
import { toneClass } from "@/components/quote/tone";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  changeArrow,
  formatDateTimeTaipei,
  formatNumber,
  formatPct,
  formatPrice,
  formatSharesAsLots,
  formatSigned,
  formatTwd,
} from "@/lib/domain/format";
import type { Bar, Market, Timeframe } from "@/lib/domain/types";
import { PROMPT_VERSION } from "@/lib/domain/types";
import { resample, sma, snapshot } from "@/lib/engine/indicators";
import { runResearch } from "@/lib/server/ai";
import {
  getActions,
  getHistory,
  getInstitution,
  getMargin,
  getMonthlyRevenue,
  getOverview,
  getUniverse,
} from "@/lib/server/market";
import { cacheAi, getSettings, listWatch, readAi, saveWatch, seedIfNeeded } from "@/lib/storage/db";

export const Route = createFileRoute("/stock/$market/$symbol")({ component: StockPage });

function StockPage() {
  const { market, symbol } = Route.useParams();
  const m = market as Market;
  const overview = useQuery({ queryKey: ["overview"], queryFn: () => getOverview() });
  const universe = useQuery({ queryKey: ["universe"], queryFn: () => getUniverse() });
  const history = useQuery({
    queryKey: ["history", m, symbol],
    queryFn: () => getHistory({ data: { market: m, symbol, months: 18 } }),
  });
  const settings = useQuery({ queryKey: ["settings"], queryFn: getSettings });
  const convention = settings.data?.colorConvention ?? "tw";
  const quotes = universe.data && universe.data.ok ? universe.data.data.quotes : overview.data && overview.data.ok ? overview.data.data.quotes : [];
  const quote = quotes.find((q) => q.market === m && q.symbol === symbol);
  const [tf, setTf] = useState<Timeframe>("1D");

  const bars: Bar[] = history.data && history.data.ok ? history.data.data : [];
  const shown = useMemo(() => {
    if (tf === "1W") return resample(bars, "1W") as unknown as Bar[];
    if (tf === "1M") return resample(bars, "1M") as unknown as Bar[];
    return bars;
  }, [bars, tf]);
  const closes = shown.map((b) => b.close);
  const s20 = sma(closes, 20);
  const s60 = sma(closes, 60);
  const snap = snapshot(bars);

  return (
    <AppShell>
      <PageTitle
        kicker={m === "TWSE" ? "上市" : "上櫃"}
        title={`${symbol} ${quote?.name ?? ""}`}
        actions={
          <div className="flex gap-2">
            <WatchButton market={m} symbol={symbol} />
            <Link className="inline-flex h-11 items-center rounded-sm border border-border px-3 text-sm" to="/compare" search={{ a: `${m}:${symbol}` }}>
              比較
            </Link>
          </div>
        }
      />
      <div className="flex flex-wrap items-end gap-4">
        <div className={`tabular text-4xl font-medium ${toneClass(quote?.change, convention)}`}>
          {formatPrice(quote?.close ?? bars.at(-1)?.close ?? null)}
        </div>
        <div className={`tabular text-lg ${toneClass(quote?.change, convention)}`}>
          <span className="sr-only">{(quote?.change ?? 0) > 0 ? "上漲" : (quote?.change ?? 0) < 0 ? "下跌" : "持平"}</span>
          {changeArrow(quote?.change)} {formatSigned(quote?.change)}（{formatPct(quote?.changePct)}）
        </div>
        <Badge variant="outline">{quote ? "盤後" : "歷史"}</Badge>
      </div>
      <div className="mt-3">
        <DataStrip
          provenance={quote ?? (history.data && history.data.ok ? history.data.provenance : null)}
          error={history.data && !history.data.ok ? history.data.message : overview.data && !overview.data.ok ? overview.data.message : null}
        />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 lg:grid-cols-6">
        <Meta label="開" value={formatPrice(quote?.open ?? null)} />
        <Meta label="高" value={formatPrice(quote?.high ?? null)} />
        <Meta label="低" value={formatPrice(quote?.low ?? null)} />
        <Meta label="量" value={formatSharesAsLots(quote?.volumeShares ?? null)} />
        <Meta label="本益比" value={formatNumber(quote?.peRatio, 2)} />
        <Meta label="殖利率" value={quote?.dividendYield == null ? "—" : `${formatNumber(quote.dividendYield, 2)}%`} />
      </div>

      <div className="mt-6 flex gap-2">
        {(["1D", "1W", "1M"] as Timeframe[]).map((x) => (
          <Button key={x} size="sm" variant={tf === x ? "default" : "outline"} onClick={() => setTf(x)}>
            {x === "1D" ? "日K" : x === "1W" ? "週K" : "月K"}
          </Button>
        ))}
      </div>
      <div className="mt-3 rounded-lg border border-border bg-card p-2">
        {history.isLoading ? (
          <Skeleton className="h-[420px]" />
        ) : history.data && !history.data.ok ? (
          <ErrorState title="歷史K線失敗" body={history.data.message} onRetry={() => history.refetch()} />
        ) : shown.length === 0 ? (
          <div className="p-8 text-sm text-muted-foreground">沒有K線。可能是新上市或來源該月無資料。</div>
        ) : (
          <CandleChart bars={shown} sma20={s20} sma60={s60} convention={convention} />
        )}
      </div>

      <Tabs defaultValue="tech" className="mt-8">
        <TabsList>
          <TabsTrigger value="tech">技術</TabsTrigger>
          <TabsTrigger value="fund">財務</TabsTrigger>
          <TabsTrigger value="flow">籌碼</TabsTrigger>
          <TabsTrigger value="events">事件</TabsTrigger>
          <TabsTrigger value="ai">AI 研究</TabsTrigger>
        </TabsList>
        <TabsContent value="tech" className="mt-4">
          <TechPanel snap={snap} barCount={bars.length} />
        </TabsContent>
        <TabsContent value="fund" className="mt-4">
          <FundPanel symbol={symbol} quote={quote} />
        </TabsContent>
        <TabsContent value="flow" className="mt-4">
          <FlowPanel
          symbol={symbol}
          asOf={overview.data && overview.data.ok ? overview.data.data.lastTradingDate ?? undefined : undefined}
        />
        </TabsContent>
        <TabsContent value="events" className="mt-4">
          <EventPanel symbol={symbol} />
        </TabsContent>
        <TabsContent value="ai" className="mt-4">
          <AiPanel
            market={m}
            symbol={symbol}
            name={quote?.name ?? symbol}
            payload={{
              quote,
              snapshot: snap,
              lastBars: bars.slice(-40),
            }}
          />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="tabular">{value}</div>
    </div>
  );
}

function TechPanel({
  snap,
  barCount,
}: {
  snap: ReturnType<typeof snapshot>;
  barCount: number;
}) {
  const rows: [string, string, string][] = [
    ["SMA 5 / 20 / 60", `${fmt(snap.sma5)} / ${fmt(snap.sma20)} / ${fmt(snap.sma60)}`, "算術平均；不足窗長則顯示不足"],
    ["EMA 12 / 26", `${fmt(snap.ema12)} / ${fmt(snap.ema26)}`, "k=2/(n+1)，SMA 種子"],
    ["MACD", `${fmt(snap.macd)} / 訊號 ${fmt(snap.macdSignal)} / 柱 ${fmt(snap.macdHist)}`, "12-26-9"],
    ["RSI 14", fmt(snap.rsi14), "Wilder 平滑"],
    ["KD 9", `K ${fmt(snap.k)} / D ${fmt(snap.d)}`, "初始 50"],
    ["布林 20,2", `${fmt(snap.bbLower)} – ${fmt(snap.bbMid)} – ${fmt(snap.bbUpper)}`, "母體標準差"],
    ["ATR 14", fmt(snap.atr14), "真實波幅"],
    ["成交量均線 20", snap.volSma20 == null ? "不足" : formatSharesAsLots(snap.volSma20), "股數 SMA"],
    ["均線排列", snap.alignment === "bullish" ? "多頭（5>20>60）" : snap.alignment === "bearish" ? "空頭（5<20<60）" : snap.alignment === "mixed" ? "糾結" : "資料不足", ""],
  ];
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3 text-sm text-muted-foreground">
        {snap.note} 使用 {barCount} 根原始日K。
      </div>
      <table className="w-full text-sm">
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]} className="border-t border-border">
              <td className="px-4 py-3 text-muted-foreground">{r[0]}</td>
              <td className="px-4 py-3 tabular">{r[1]}</td>
              <td className="hidden px-4 py-3 text-xs text-faint md:table-cell">{r[2]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function fmt(n: number | null): string {
  return n == null ? "不足" : formatNumber(n, 2);
}

function FundPanel({
  symbol,
  quote,
}: {
  symbol: string;
  quote?: { peRatio: number | null; pbRatio: number | null; dividendYield: number | null; eventTime: string; source: string } | undefined;
}) {
  const rev = useQuery({
    queryKey: ["rev", symbol],
    queryFn: () => getMonthlyRevenue({ data: { symbol } }),
  });
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Meta label="本益比" value={formatNumber(quote?.peRatio, 2)} />
        <Meta label="股價淨值比" value={formatNumber(quote?.pbRatio, 2)} />
        <Meta label="殖利率" value={quote?.dividendYield == null ? "—" : `${formatNumber(quote.dividendYield, 2)}%`} />
      </div>
      <p className="text-xs text-muted-foreground">
        估值取自證交所／櫃買當日估值表，有效日期 {quote?.eventTime?.slice(0, 10) ?? "—" }。損益表完整科目（毛利率、ROE、自由現金流）需財務報表來源，第一版尚未接通 MOPS 歷史財報 API。
      </p>
      {rev.isLoading ? (
        <Skeleton className="h-40" />
      ) : rev.data && !rev.data.ok ? (
        <ErrorState title="月營收失敗" body={rev.data.message} />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-secondary text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2">所屬期間</th>
                <th className="px-3 py-2">公布</th>
                <th className="px-3 py-2 text-right">當月營收</th>
                <th className="px-3 py-2 text-right">年增</th>
                <th className="px-3 py-2 text-right">月增</th>
                <th className="px-3 py-2 text-right">累計年增</th>
              </tr>
            </thead>
            <tbody>
              {(rev.data && rev.data.ok ? rev.data.data : []).slice(0, 18).map((r) => (
                <tr key={r.period} className="border-t border-border">
                  <td className="px-3 py-2 tabular">{r.period}</td>
                  <td className="px-3 py-2 text-xs">{r.publishedAt?.slice(0, 10) ?? "—"}</td>
                  <td className="px-3 py-2 text-right tabular">{formatTwd(r.revenue)}</td>
                  <td className="px-3 py-2 text-right tabular">{formatPct(r.revenueYoyPct)}</td>
                  <td className="px-3 py-2 text-right tabular">{formatPct(r.revenueMomPct)}</td>
                  <td className="px-3 py-2 text-right tabular">{formatPct(r.ytdYoyPct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(rev.data && rev.data.ok && rev.data.data.length === 0) ? (
            <div className="px-3 py-6 text-sm text-muted-foreground">此代號不在上市月營收表（可能為 ETF 或上櫃）。來源：t187ap05_L。</div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function FlowPanel({ symbol, asOf }: { symbol: string; asOf?: string }) {
  const inst = useQuery({
    queryKey: ["inst", symbol, asOf],
    queryFn: () => getInstitution({ data: { symbol, date: asOf } }),
  });
  const margin = useQuery({
    queryKey: ["margin", symbol, asOf],
    queryFn: () => getMargin({ data: { symbol, date: asOf } }),
  });
  const instRow = inst.data && inst.data.ok ? inst.data.data : null;
  const mRow = margin.data && margin.data.ok ? margin.data.data : null;
  return (
    <div className="space-y-3">
      {inst.data && !inst.data.ok ? <p className="text-sm text-muted-foreground">{inst.data.message}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Meta label="外資買賣超（股）" value={formatNumber(instRow?.foreignNetShares ?? null)} />
        <Meta label="投信買賣超（股）" value={formatNumber(instRow?.investmentTrustNetShares ?? null)} />
        <Meta label="自營商買賣超（股）" value={formatNumber(instRow?.dealerNetShares ?? null)} />
        <Meta label="三大法人合計" value={formatNumber(instRow?.totalNetShares ?? null)} />
      </div>
      <p className="text-xs text-muted-foreground">
        籌碼日期 {instRow?.asOf ?? "無此代號紀錄"} · 來源 {instRow?.source ?? "TWSE T86 / TPEx"}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Meta label="融資餘額（張）" value={formatNumber(mRow?.marginBuyBalance ?? null)} />
        <Meta label="融券餘額（張）" value={formatNumber(mRow?.shortSellBalance ?? null)} />
      </div>
      <p className="text-xs text-muted-foreground">融資融券來源 TWSE MI_MARGN，日期 {mRow?.asOf ?? "無"}。缺少即顯示無資料，不以 AI 填補。</p>
    </div>
  );
}

function EventPanel({ symbol }: { symbol: string }) {
  const actions = useQuery({ queryKey: ["actions"], queryFn: () => getActions() });
  const mine = actions.data && actions.data.ok ? actions.data.data.filter((a) => a.symbol === symbol) : [];
  return (
    <div>
      <p className="mb-3 text-sm text-muted-foreground">
        第一版事件來自除權息預告（TWT48U_ALL），不是新聞快訊。即時新聞供應商尚未授權接入。
      </p>
      {mine.length === 0 ? (
        <div className="rounded-lg border border-border bg-card px-4 py-8 text-sm text-muted-foreground">此標的近期無除權息資料。</div>
      ) : (
        <ul className="space-y-2">
          {mine.map((a) => (
            <li key={`${a.symbol}-${a.date}`} className="rounded-md border border-border bg-card px-4 py-3 text-sm">
              <div className="font-medium">
                {a.date} · {a.kind}
              </div>
              <div className="text-muted-foreground">
                現金股利 {formatNumber(a.cashDividend, 4)} · 來源 {a.source}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AiPanel({
  market,
  symbol,
  name,
  payload,
}: {
  market: Market;
  symbol: string;
  name: string;
  payload: unknown;
}) {
  const [horizon, setHorizon] = useState("3 至 6 個月");
  const [includeHoldings, setIncludeHoldings] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [meta, setMeta] = useState<string>("");
  const run = useMutation({
    mutationFn: async () => {
      const settings = await getSettings();
      const dataVersion = JSON.stringify(payload).length + ":" + (payload as { snapshot?: { asOf?: string } }).snapshot?.asOf;
      const cacheKey = `${market}:${symbol}:${dataVersion}:${PROMPT_VERSION}:${settings.aiModel || "grok-4.5"}`;
      const cached = await readAi<{ text: string; model: string; analyzedAt: string }>(cacheKey);
      if (cached) return { ...cached, cached: true };
      const res = await runResearch({
        data: {
          symbol,
          name,
          market,
          horizon,
          includeHoldings,
          payload: JSON.stringify(payload),
          provider: {
            baseUrl: settings.aiBaseUrl || undefined,
            model: settings.aiModel || undefined,
          },
        },
      });
      if (!res.ok) throw new Error(res.error);
      await cacheAi(cacheKey, { text: res.text, model: res.model, analyzedAt: res.analyzedAt });
      return { text: res.text, model: res.model, analyzedAt: res.analyzedAt, cached: false };
    },
    onSuccess: (r) => {
      setText(r.text);
      setMeta(`${r.model} · ${formatDateTimeTaipei(r.analyzedAt)} · ${r.cached ? "快取" : "新分析"} · 提示詞 ${PROMPT_VERSION}`);
    },
  });
  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">
        AI 只解釋系統已取得的資料，不保證獲利。沒有金鑰時，其餘功能仍可使用。分析前不會把持股送出，除非你開啟授權。
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-xs text-muted-foreground">投資期間</span>
          <Input value={horizon} onChange={(e) => setHorizon(e.target.value)} />
        </label>
        <label className="flex items-center gap-3 text-sm">
          <Switch checked={includeHoldings} onCheckedChange={setIncludeHoldings} />
          授權把持股摘要傳給 AI
        </label>
      </div>
      <Button onClick={() => run.mutate()} disabled={run.isPending}>
        {run.isPending ? "分析中…" : "產生研究"}
      </Button>
      {run.isError ? <p className="text-sm text-up">{(run.error as Error).message}</p> : null}
      {meta ? <p className="text-xs text-faint">{meta}</p> : null}
      {text ? (
        <article className="prose-none whitespace-pre-wrap text-sm leading-relaxed">{text}</article>
      ) : (
        <Textarea readOnly placeholder="研究報告會顯示在這裡。數值以畫面指標為準，不以模型重算。" />
      )}
    </div>
  );
}

function WatchButton({ market, symbol }: { market: Market; symbol: string }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["watch-local"],
    queryFn: async () => {
      await seedIfNeeded();
      return listWatch();
    },
  });
  const exists = q.data?.some((w) => w.market === market && w.symbol === symbol);
  return (
    <Button
      variant="outline"
      onClick={async () => {
        if (exists) return;
        await saveWatch({
          id: crypto.randomUUID(),
          groupId: "default",
          market,
          symbol,
          note: "",
          sort: (q.data?.length ?? 0) + 1,
          createdAt: new Date().toISOString(),
        });
        qc.invalidateQueries({ queryKey: ["watch-local"] });
      }}
    >
      {exists ? "已在自選" : "加入自選"}
    </Button>
  );
}
