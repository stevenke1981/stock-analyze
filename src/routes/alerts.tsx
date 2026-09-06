import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, EmptyState, PageTitle } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPrice } from "@/lib/domain/format";
import type { Market } from "@/lib/domain/types";
import { getOverview, getUniverse } from "@/lib/server/market";
import { listAlerts, saveAlert } from "@/lib/storage/db";

export const Route = createFileRoute("/alerts")({ component: AlertsPage });

function AlertsPage() {
  const qc = useQueryClient();
  const alerts = useQuery({ queryKey: ["alerts"], queryFn: listAlerts });
  const overview = useQuery({ queryKey: ["overview"], queryFn: () => getOverview() });
  const universe = useQuery({ queryKey: ["universe"], queryFn: () => getUniverse() });
  const [symbol, setSymbol] = useState("2330");
  const [market, setMarket] = useState<Market>("TWSE");
  const [op, setOp] = useState<"gte" | "lte">("gte");
  const [price, setPrice] = useState("");

  useEffect(() => {
    if ((!overview.data || !overview.data.ok) && (!universe.data || !universe.data.ok)) return;
    if (!alerts.data) return;
    const quotes =
      (universe.data && universe.data.ok ? universe.data.data.quotes : null) ??
      (overview.data && overview.data.ok ? overview.data.data.quotes : []);
    for (const a of alerts.data) {
      if (!a.enabled || a.triggeredAt) continue;
      const q = quotes.find((x) => x.market === a.market && x.symbol === a.symbol);
      if (q?.close == null) continue;
      const hit = a.op === "gte" ? q.close >= a.price : q.close <= a.price;
      if (hit) {
        saveAlert({ ...a, triggeredAt: new Date().toISOString() }).then(() =>
          qc.invalidateQueries({ queryKey: ["alerts"] }),
        );
      }
    }
  }, [overview.data, universe.data, alerts.data, qc]);

  return (
    <AppShell>
      <PageTitle kicker="提醒" title="價格條件" />
      <p className="mb-4 text-sm text-muted-foreground">
        站內提醒：重新整理行情時檢查。桌面系統通知需要應用持續開啟，此網頁版不會在背景推播。
      </p>
      <div className="flex flex-wrap gap-2">
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
        <Select value={op} onValueChange={(v) => setOp(v as "gte" | "lte")}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gte">≥</SelectItem>
            <SelectItem value="lte">≤</SelectItem>
          </SelectContent>
        </Select>
        <Input className="w-28" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="價格" />
        <Button
          onClick={async () => {
            await saveAlert({
              id: crypto.randomUUID(),
              market,
              symbol,
              op,
              price: Number(price),
              note: "",
              enabled: true,
              triggeredAt: null,
            });
            qc.invalidateQueries({ queryKey: ["alerts"] });
          }}
        >
          新增
        </Button>
      </div>
      <div className="mt-6 space-y-2">
        {(alerts.data ?? []).length === 0 ? (
          <EmptyState title="沒有提醒" body="設定價格條件後，載入盤後行情時會標記觸發。" />
        ) : (
          (alerts.data ?? []).map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3 text-sm">
              <div>
                {a.symbol} {a.op === "gte" ? "≥" : "≤"} {formatPrice(a.price)}
              </div>
              <div className="text-xs text-muted-foreground">{a.triggeredAt ? `已觸發 ${a.triggeredAt.slice(0, 16)}` : "監聽中"}</div>
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}
