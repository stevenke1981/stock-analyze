import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, EmptyState, PageTitle } from "@/components/layout/app-shell";
import { toneClass } from "@/components/quote/tone";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { changeArrow, formatNumber, formatPct, formatPrice, formatSigned, formatTwd } from "@/lib/domain/format";
import type { Market, Side, Transaction } from "@/lib/domain/types";
import { COST_METHOD_LABEL, holdingsFrom, parsePortfolioCsv, toCsv } from "@/lib/engine/portfolio";
import { getOverview, getUniverse } from "@/lib/server/market";
import { deleteTxn, getSettings, listTxns, replaceTxns, saveTxn } from "@/lib/storage/db";

export const Route = createFileRoute("/portfolio")({ component: PortfolioPage });

function PortfolioPage() {
  const qc = useQueryClient();
  const txnsQ = useQuery({ queryKey: ["txns"], queryFn: listTxns });
  const settings = useQuery({ queryKey: ["settings"], queryFn: getSettings });
  const overview = useQuery({ queryKey: ["overview"], queryFn: () => getOverview() });
  const universe = useQuery({ queryKey: ["universe"], queryFn: () => getUniverse() });
  const convention = settings.data?.colorConvention ?? "tw";
  const quotes = universe.data && universe.data.ok ? universe.data.data.quotes : overview.data && overview.data.ok ? overview.data.data.quotes : [];
  const marks = useMemo(() => {
    const m = new Map<string, { price: number | null; name?: string }>();
    for (const q of quotes) m.set(`${q.market}:${q.symbol}`, { price: q.close, name: q.name });
    return m;
  }, [quotes]);
  const model = useMemo(() => holdingsFrom(txnsQ.data ?? [], marks), [txnsQ.data, marks]);
  const [open, setOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);

  return (
    <AppShell>
      <PageTitle
        kicker="投資組合"
        title="持股與損益"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCsvOpen(true)}>
              CSV
            </Button>
            <Button onClick={() => setOpen(true)}>新增紀錄</Button>
          </div>
        }
      />
      <p className="mb-4 text-sm text-muted-foreground">
        成本算法：{COST_METHOD_LABEL}。買進成本含手續費與交易稅；賣出淨額扣除費用後計算已實現損益；現金股利計入已實現、不降低成本。幣別 TWD，未接匯率。第一版不串接下單。
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="市值" value={formatTwd(model.totalMtm)} />
        <Stat label="成本" value={formatTwd(model.totalCost)} />
        <Stat
          label="未實現損益"
          value={formatSigned(model.totalMtm - model.totalCost, 0)}
          tone={model.totalMtm - model.totalCost}
          convention={convention}
        />
      </div>
      <div className="mt-2 text-sm text-muted-foreground">已實現損益 {formatTwd(model.cashflowRealized)}</div>
      {model.holdings.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="尚無持股" body="新增買進紀錄或匯入 CSV。重啟瀏覽器後資料仍在。" />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-secondary text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2">標的</th>
                <th className="px-3 py-2 text-right">股數</th>
                <th className="px-3 py-2 text-right">均價</th>
                <th className="px-3 py-2 text-right">市價</th>
                <th className="px-3 py-2 text-right">未實現</th>
                <th className="px-3 py-2 text-right">權重</th>
              </tr>
            </thead>
            <tbody>
              {model.holdings.map((h) => (
                <tr key={`${h.market}-${h.symbol}`} className="border-t border-border">
                  <td className="px-3 py-2">
                    <Link className="underline-offset-4 hover:underline" to="/stock/$market/$symbol" params={{ market: h.market, symbol: h.symbol }}>
                      {h.symbol} {h.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-right tabular">{formatNumber(h.shares)}</td>
                  <td className="px-3 py-2 text-right tabular">{formatPrice(h.avgCost)}</td>
                  <td className="px-3 py-2 text-right tabular">{formatPrice(h.marketPrice)}</td>
                  <td className={`px-3 py-2 text-right tabular ${toneClass(h.unrealized, convention)}`}>
                    {changeArrow(h.unrealized)} {formatTwd(h.unrealized)} ({formatPct(h.unrealizedPct)})
                  </td>
                  <td className="px-3 py-2 text-right tabular">{formatPct(h.weight, false)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <h2 className="mt-8 mb-3 text-sm font-medium">交易明細</h2>
      <TxnTable
        rows={txnsQ.data ?? []}
        onDelete={async (id) => {
          await deleteTxn(id);
          qc.invalidateQueries({ queryKey: ["txns"] });
        }}
      />
      <TradeDialog
        open={open}
        onOpenChange={setOpen}
        onSave={async (t) => {
          await saveTxn(t);
          qc.invalidateQueries({ queryKey: ["txns"] });
          setOpen(false);
        }}
      />
      <CsvDialog
        open={csvOpen}
        onOpenChange={setCsvOpen}
        existing={txnsQ.data ?? []}
        onReplace={async (rows) => {
          await replaceTxns(rows);
          qc.invalidateQueries({ queryKey: ["txns"] });
          setCsvOpen(false);
        }}
      />
    </AppShell>
  );
}

function Stat({
  label,
  value,
  tone,
  convention,
}: {
  label: string;
  value: string;
  tone?: number;
  convention?: "tw" | "us";
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-2 tabular text-xl font-medium ${tone != null ? toneClass(tone, convention ?? "tw") : ""}`}>
        {value}
      </div>
    </div>
  );
}

function TxnTable({ rows, onDelete }: { rows: Transaction[]; onDelete: (id: string) => void }) {
  if (!rows.length) return <p className="text-sm text-muted-foreground">尚無交易。</p>;
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-secondary text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left">日期</th>
            <th className="px-3 py-2 text-left">方向</th>
            <th className="px-3 py-2 text-left">代號</th>
            <th className="px-3 py-2 text-right">股數</th>
            <th className="px-3 py-2 text-right">價格</th>
            <th className="px-3 py-2 text-right">費用</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id} className="border-t border-border">
              <td className="px-3 py-2 tabular">{t.tradeDate}</td>
              <td className="px-3 py-2">{sideLabel(t.side)}</td>
              <td className="px-3 py-2 tabular">{t.symbol}</td>
              <td className="px-3 py-2 text-right tabular">{formatNumber(t.shares)}</td>
              <td className="px-3 py-2 text-right tabular">{formatPrice(t.price)}</td>
              <td className="px-3 py-2 text-right tabular">{formatNumber(t.fee + t.tax)}</td>
              <td className="px-3 py-2 text-right">
                <button className="text-xs text-muted-foreground underline" onClick={() => onDelete(t.id)}>
                  刪除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function sideLabel(s: Side): string {
  return { buy: "買進", sell: "賣出", dividend: "股息", split: "拆併股", fee: "費用" }[s];
}

function TradeDialog({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (t: Transaction) => void;
}) {
  const [side, setSide] = useState<Side>("buy");
  const [market, setMarket] = useState<Market>("TWSE");
  const [symbol, setSymbol] = useState("2330");
  const [name, setName] = useState("");
  const [shares, setShares] = useState("1000");
  const [price, setPrice] = useState("");
  const [fee, setFee] = useState("0");
  const [tax, setTax] = useState("0");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>新增交易</DialogTitle>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="日期">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="方向">
            <Select value={side} onValueChange={(v) => setSide(v as Side)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buy">買進</SelectItem>
                <SelectItem value="sell">賣出</SelectItem>
                <SelectItem value="dividend">股息</SelectItem>
                <SelectItem value="split">拆併股（價格填倍數）</SelectItem>
                <SelectItem value="fee">費用</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="市場">
            <Select value={market} onValueChange={(v) => setMarket(v as Market)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TWSE">上市</SelectItem>
                <SelectItem value="TPEX">上櫃</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="代號">
            <Input value={symbol} onChange={(e) => setSymbol(e.target.value)} />
          </Field>
          <Field label="名稱">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="股數">
            <Input value={shares} onChange={(e) => setShares(e.target.value)} />
          </Field>
          <Field label="價格">
            <Input value={price} onChange={(e) => setPrice(e.target.value)} />
          </Field>
          <Field label="手續費">
            <Input value={fee} onChange={(e) => setFee(e.target.value)} />
          </Field>
          <Field label="交易稅">
            <Input value={tax} onChange={(e) => setTax(e.target.value)} />
          </Field>
        </div>
        <Field label="備註">
          <Input value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <Button
          className="mt-4 w-full"
          onClick={() =>
            onSave({
              id: crypto.randomUUID(),
              market,
              symbol: symbol.trim(),
              name,
              side,
              shares: Number(shares) || 0,
              price: Number(price) || 0,
              fee: Number(fee) || 0,
              tax: Number(tax) || 0,
              tradeDate: date,
              note,
              createdAt: new Date().toISOString(),
            })
          }
        >
          儲存
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function CsvDialog({
  open,
  onOpenChange,
  existing,
  onReplace,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  existing: Transaction[];
  onReplace: (rows: Transaction[]) => void;
}) {
  const [text, setText] = useState("");
  const parsed = text ? parsePortfolioCsv(text) : null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogTitle>CSV 匯入／匯出</DialogTitle>
        <p className="mt-2 text-sm text-muted-foreground">欄位：date,market,symbol,name,side,shares,price,fee,tax,note</p>
        <div className="mt-3 flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const blob = new Blob([toCsv(existing)], { type: "text/csv;charset=utf-8" });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = "hengyan-portfolio.csv";
              a.click();
            }}
          >
            匯出目前持股交易
          </Button>
        </div>
        <Textarea className="mt-3" value={text} onChange={(e) => setText(e.target.value)} placeholder="貼上 CSV" />
        {parsed ? (
          <div className="mt-3 text-sm">
            <div>預覽 {parsed.rows.length} 列，問題 {parsed.issues.length} 則</div>
            {parsed.issues.slice(0, 6).map((i) => (
              <div key={i.row} className="text-up">
                第 {i.row} 列：{i.message}
              </div>
            ))}
            <Button
              className="mt-3"
              disabled={!parsed.rows.length}
              onClick={() =>
                onReplace(
                  parsed.rows.map((r) => ({
                    id: crypto.randomUUID(),
                    ...r,
                    createdAt: new Date().toISOString(),
                  })),
                )
              }
            >
              驗證後覆蓋匯入
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
