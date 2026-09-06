import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, PageTitle } from "@/components/layout/app-shell";
import { DataStrip } from "@/components/quote/data-strip";
import { toneClass } from "@/components/quote/tone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { changeArrow, formatNumber, formatPct, formatPrice } from "@/lib/domain/format";
import type { ScreenerRule } from "@/lib/domain/types";
import { applyScreener, SCREENER_FIELDS } from "@/lib/engine/screener";
import { getOverview, getUniverse } from "@/lib/server/market";
import { getSettings, listScreeners, saveScreener } from "@/lib/storage/db";

export const Route = createFileRoute("/screener")({ component: ScreenerPage });

function ScreenerPage() {
  const overview = useQuery({ queryKey: ["overview"], queryFn: () => getOverview() });
  const universe = useQuery({ queryKey: ["universe"], queryFn: () => getUniverse() });
  const settings = useQuery({ queryKey: ["settings"], queryFn: getSettings });
  const saved = useQuery({ queryKey: ["screeners"], queryFn: listScreeners });
  const convention = settings.data?.colorConvention ?? "tw";
  const [rules, setRules] = useState<ScreenerRule[]>([
    { field: "changePct", op: "gte", value: 3 },
  ]);
  const [name, setName] = useState("漲幅大於 3%");
  const quotes = universe.data && universe.data.ok ? universe.data.data.quotes : overview.data && overview.data.ok ? overview.data.data.quotes : [];
  const asOf = overview.data && overview.data.ok ? overview.data.data.lastTradingDate : null;
  const rows = useMemo(() => applyScreener(quotes, rules).slice(0, 200), [quotes, rules]);

  return (
    <AppShell>
      <PageTitle kicker="選股器" title="條件篩選" />
      {overview.data && overview.data.ok ? <DataStrip provenance={overview.data.data.provenance} /> : null}
      <p className="mt-3 text-sm text-muted-foreground">
        每一項條件使用最新盤後快照，有效日期 {asOf ?? "—"}。均線交叉需個股歷史，全市場均線篩選尚未預先下載，故不提供以免誤導。
      </p>
      <div className="mt-4 space-y-2">
        {rules.map((r, i) => (
          <div key={i} className="flex flex-wrap gap-2">
            <Select
              value={r.field}
              onValueChange={(v) =>
                setRules((rs) => rs.map((x, j) => (j === i ? { ...x, field: v } : x)))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCREENER_FIELDS.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={r.op}
              onValueChange={(v) =>
                setRules((rs) => rs.map((x, j) => (j === i ? { ...x, op: v as ScreenerRule["op"] } : x)))
              }
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gte">≥</SelectItem>
                <SelectItem value="lte">≤</SelectItem>
                <SelectItem value="eq">=</SelectItem>
                <SelectItem value="contains">包含</SelectItem>
              </SelectContent>
            </Select>
            <Input
              className="w-32"
              value={String(r.value)}
              onChange={(e) =>
                setRules((rs) =>
                  rs.map((x, j) =>
                    j === i
                      ? { ...x, value: r.op === "contains" ? e.target.value : Number(e.target.value) }
                      : x,
                  ),
                )
              }
            />
            <Button variant="ghost" onClick={() => setRules((rs) => rs.filter((_, j) => j !== i))}>
              刪
            </Button>
          </div>
        ))}
        <Button variant="outline" onClick={() => setRules((rs) => [...rs, { field: "peRatio", op: "lte", value: 20 }])}>
          加條件
        </Button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} className="max-w-xs" />
        <Button
          variant="outline"
          onClick={async () => {
            await saveScreener({
              id: crypto.randomUUID(),
              name,
              rules,
              sortField: "changePct",
              sortDir: "desc",
              updatedAt: new Date().toISOString(),
            });
          }}
        >
          儲存條件
        </Button>
        {(saved.data ?? []).map((s) => (
          <Button key={s.id} size="sm" variant="secondary" onClick={() => setRules(s.rules)}>
            {s.name}
          </Button>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">符合 {rows.length} 檔（最多顯示 200）</p>
      <div className="mt-2 overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-secondary text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">代號</th>
              <th className="px-3 py-2 text-left">名稱</th>
              <th className="px-3 py-2 text-right">收盤</th>
              <th className="px-3 py-2 text-right">漲跌幅</th>
              <th className="px-3 py-2 text-right">本益比</th>
              <th className="px-3 py-2 text-right">殖利率</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((q) => (
              <tr key={`${q.market}-${q.symbol}`} className="border-t border-border">
                <td className="px-3 py-2">
                  <Link className="tabular underline-offset-4 hover:underline" to="/stock/$market/$symbol" params={{ market: q.market, symbol: q.symbol }}>
                    {q.symbol}
                  </Link>
                </td>
                <td className="px-3 py-2">{q.name}</td>
                <td className="px-3 py-2 text-right tabular">{formatPrice(q.close)}</td>
                <td className={`px-3 py-2 text-right tabular ${toneClass(q.changePct, convention)}`}>
                  {changeArrow(q.changePct)} {formatPct(q.changePct)}
                </td>
                <td className="px-3 py-2 text-right tabular">{formatNumber(q.peRatio, 2)}</td>
                <td className="px-3 py-2 text-right tabular">{formatNumber(q.dividendYield, 2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
