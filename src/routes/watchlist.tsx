import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell, EmptyState, PageTitle } from "@/components/layout/app-shell";
import { DataStrip } from "@/components/quote/data-strip";
import { Sparkline } from "@/components/quote/sparkline";
import { toneClass } from "@/components/quote/tone";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { changeArrow, formatPct, formatPrice, formatSharesAsLots } from "@/lib/domain/format";
import type { Market, WatchlistItem } from "@/lib/domain/types";
import { getHistory, getOverview, getUniverse, searchStocks } from "@/lib/server/market";
import { deleteWatch, getSettings, listGroups, listWatch, saveWatch, seedIfNeeded } from "@/lib/storage/db";

export const Route = createFileRoute("/watchlist")({ component: WatchlistPage });

function WatchlistPage() {
  const qc = useQueryClient();
  const local = useQuery({
    queryKey: ["watch-local"],
    queryFn: async () => {
      await seedIfNeeded();
      const [groups, watch, settings] = await Promise.all([listGroups(), listWatch(), getSettings()]);
      return { groups, watch, settings };
    },
  });
  const overview = useQuery({ queryKey: ["overview"], queryFn: () => getOverview() });
  const universe = useQuery({ queryKey: ["universe"], queryFn: () => getUniverse() });
  const [q, setQ] = useState("");
  const [noteEdit, setNoteEdit] = useState<Record<string, string>>({});

  const quotes = universe.data && universe.data.ok ? universe.data.data.quotes : overview.data && overview.data.ok ? overview.data.data.quotes : [];
  const quoteMap = useMemo(() => {
    const m = new Map<string, (typeof quotes)[number]>();
    for (const x of quotes) m.set(`${x.market}:${x.symbol}`, x);
    return m;
  }, [quotes]);

  const add = useMutation({
    mutationFn: async (item: WatchlistItem) => saveWatch(item),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["watch-local"] }),
  });
  const remove = useMutation({
    mutationFn: deleteWatch,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["watch-local"] }),
  });

  const items = local.data?.watch ?? [];
  const convention = local.data?.settings.colorConvention ?? "tw";
  const filtered = items.filter((i) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    const quote = quoteMap.get(`${i.market}:${i.symbol}`);
    return i.symbol.toLowerCase().includes(s) || (quote?.name ?? "").toLowerCase().includes(s) || i.note.includes(s);
  });

  return (
    <AppShell>
      <PageTitle
        kicker="自選股"
        title="觀察清單"
        actions={
          <AddSymbol
            onAdd={(market, symbol) =>
              add.mutate({
                id: crypto.randomUUID(),
                groupId: local.data?.groups[0]?.id ?? "default",
                market,
                symbol,
                note: "",
                sort: items.length,
                createdAt: new Date().toISOString(),
              })
            }
          />
        }
      />
      {overview.data && overview.data.ok ? <DataStrip provenance={overview.data.data.provenance} error={overview.data.data.error} /> : null}
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜尋自選" className="my-4 max-w-sm" />
      {filtered.length === 0 ? (
        <EmptyState title="尚無自選" body="用上方搜尋加入台股或 ETF。清單保存在此瀏覽器。" />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-secondary text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2">代號</th>
                <th className="px-3 py-2">名稱</th>
                <th className="px-3 py-2 text-right">最新</th>
                <th className="px-3 py-2 text-right">漲跌幅</th>
                <th className="px-3 py-2 text-right">成交量</th>
                <th className="px-3 py-2">走勢</th>
                <th className="px-3 py-2">備註</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const qrow = quoteMap.get(`${item.market}:${item.symbol}`);
                return (
                  <WatchRow
                    key={item.id}
                    item={item}
                    name={qrow?.name ?? item.symbol}
                    close={qrow?.close ?? null}
                    changePct={qrow?.changePct ?? null}
                    volume={qrow?.volumeShares ?? null}
                    convention={convention}
                    note={noteEdit[item.id] ?? item.note}
                    onNote={(v) => setNoteEdit((s) => ({ ...s, [item.id]: v }))}
                    onNoteSave={async () => {
                      await saveWatch({ ...item, note: noteEdit[item.id] ?? item.note });
                      qc.invalidateQueries({ queryKey: ["watch-local"] });
                    }}
                    onRemove={() => remove.mutate(item.id)}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}

function WatchRow({
  item,
  name,
  close,
  changePct,
  volume,
  convention,
  note,
  onNote,
  onNoteSave,
  onRemove,
}: {
  item: WatchlistItem;
  name: string;
  close: number | null;
  changePct: number | null;
  volume: number | null;
  convention: "tw" | "us";
  note: string;
  onNote: (v: string) => void;
  onNoteSave: () => void;
  onRemove: () => void;
}) {
  const hist = useQuery({
    queryKey: ["spark", item.market, item.symbol],
    queryFn: () => getHistory({ data: { market: item.market, symbol: item.symbol, months: 2 } }),
    staleTime: 60 * 60 * 1000,
  });
  const values =
    hist.data && hist.data.ok ? hist.data.data.slice(-20).map((b) => b.close) : [];
  const up = (changePct ?? 0) >= 0;
  return (
    <tr className="border-t border-border">
      <td className="px-3 py-2">
        <Link className="tabular font-medium underline-offset-4 hover:underline" to="/stock/$market/$symbol" params={{ market: item.market, symbol: item.symbol }}>
          {item.symbol}
        </Link>
      </td>
      <td className="px-3 py-2">
        {name}{" "}
        <Badge variant="outline" className="ml-1">
          {item.market === "TWSE" ? "上市" : "上櫃"}
        </Badge>
      </td>
      <td className="px-3 py-2 text-right tabular">{formatPrice(close)}</td>
      <td className={`px-3 py-2 text-right tabular ${toneClass(changePct, convention)}`}>
        {changeArrow(changePct)} {formatPct(changePct)}
      </td>
      <td className="px-3 py-2 text-right tabular">{formatSharesAsLots(volume)}</td>
      <td className="px-3 py-2">
        <Sparkline values={values} up={up} />
      </td>
      <td className="px-3 py-2">
        <Input
          value={note}
          onChange={(e) => onNote(e.target.value)}
          onBlur={onNoteSave}
          className="h-9 min-h-9"
        />
      </td>
      <td className="px-3 py-2">
        <Button variant="ghost" size="icon" onClick={onRemove} aria-label="移除">
          <Trash2 className="size-4" />
        </Button>
      </td>
    </tr>
  );
}

function AddSymbol({ onAdd }: { onAdd: (market: Market, symbol: string) => void }) {
  const [q, setQ] = useState("");
  const hits = useQuery({
    queryKey: ["search", q],
    queryFn: () => searchStocks({ data: { q } }),
    enabled: q.trim().length > 0,
  });
  return (
    <div className="relative w-64">
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="加入代號" />
      {hits.data && hits.data.length > 0 ? (
        <div className="absolute right-0 top-12 z-20 w-72 rounded-md border border-border bg-popover shadow-md">
          {hits.data.slice(0, 8).map((h) => (
            <button
              key={`${h.market}-${h.symbol}`}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-secondary"
              onClick={() => {
                onAdd(h.market, h.symbol);
                setQ("");
              }}
            >
              <span>
                <span className="tabular mr-2">{h.symbol}</span>
                {h.name}
              </span>
              <Plus className="size-4" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
