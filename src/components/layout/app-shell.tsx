import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Bookmark,
  CandlestickChart,
  ClipboardList,
  LayoutDashboard,
  Search,
  Settings,
  SlidersHorizontal,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sessionLabel } from "@/lib/domain/format";
import { classifySession } from "@/lib/domain/time";
import type { Instrument } from "@/lib/domain/types";
import { searchStocks } from "@/lib/server/market";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "市場", icon: LayoutDashboard },
  { to: "/watchlist", label: "自選", icon: Bookmark },
  { to: "/portfolio", label: "持股", icon: Wallet },
  { to: "/screener", label: "選股", icon: SlidersHorizontal },
  { to: "/backtest", label: "回測", icon: CandlestickChart },
  { to: "/notes", label: "筆記", icon: ClipboardList },
  { to: "/alerts", label: "提醒", icon: Bell },
  { to: "/settings", label: "設定", icon: Settings },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const session = classifySession();
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-52 border-r border-border bg-card/80 px-3 py-5 md:flex md:flex-col">
        <Link to="/" className="mb-8 px-2">
          <div className="font-medium tracking-wide">衡研</div>
          <div className="text-xs text-muted-foreground">台股投資研究</div>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex min-h-11 items-center gap-2 rounded-sm px-3 text-sm",
                  active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-2 text-[11px] text-faint">盤後資料 · 非即時 · 非投資建議</div>
      </aside>
      <div className="md:pl-52">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
          <Link to="/" className="md:hidden font-medium">
            衡研
          </Link>
          <StockSearch />
          <div className="ml-auto hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <span>{session ? sessionLabel(session) : "市場狀態確認中"}</span>
            <span>Asia/Taipei</span>
          </div>
        </header>
        <main className="px-4 py-5 pb-28 md:pb-8">{children}</main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-card md:hidden">
        {NAV.slice(0, 5).map((item) => {
          const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 text-[11px]",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function StockSearch() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<Instrument[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!q.trim()) {
      setHits([]);
      return;
    }
    const t = setTimeout(() => {
      setBusy(true);
      searchStocks({ data: { q } })
        .then(setHits)
        .catch(() => setHits([]))
        .finally(() => setBusy(false));
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  const empty = useMemo(() => q.trim() && !busy && hits.length === 0, [q, busy, hits.length]);

  return (
    <div className="relative w-full max-w-xl">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
      <Input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 180)}
        placeholder="搜尋代號或名稱"
        className="pl-9"
        aria-label="搜尋股票"
      />
      {open && (hits.length > 0 || empty || busy) ? (
        <div className="absolute top-[calc(100%+6px)] z-40 w-full overflow-hidden rounded-md border border-border bg-popover shadow-md">
          {busy ? <div className="px-3 py-3 text-sm text-muted-foreground">搜尋中…</div> : null}
          {empty ? <div className="px-3 py-3 text-sm text-muted-foreground">沒有符合的標的</div> : null}
          {hits.map((h) => (
            <button
              key={`${h.market}-${h.symbol}`}
              className="flex w-full items-center justify-between px-3 py-3 text-left text-sm hover:bg-secondary"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setOpen(false);
                setQ("");
                navigate({ to: "/stock/$market/$symbol", params: { market: h.market, symbol: h.symbol } });
              }}
            >
              <span>
                <span className="tabular mr-2 font-medium">{h.symbol}</span>
                {h.name}
              </span>
              <span className="text-xs text-muted-foreground">{h.market === "TWSE" ? "上市" : "上櫃"}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function PageTitle({
  kicker,
  title,
  actions,
}: {
  kicker?: string;
  title: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        {kicker ? <div className="mb-1 text-xs tracking-wide text-muted-foreground">{kicker}</div> : null}
        <h1 className="text-2xl font-medium tracking-tight">{title}</h1>
      </div>
      {actions}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card px-5 py-10 text-center">
      <div className="text-sm font-medium">{title}</div>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ title, body, onRetry }: { title: string; body: string; onRetry?: () => void }) {
  return (
    <div className="rounded-lg border border-border bg-card px-5 py-8">
      <div className="text-sm font-medium">{title}</div>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      {onRetry ? (
        <Button className="mt-4" variant="outline" onClick={onRetry}>
          重試
        </Button>
      ) : null}
    </div>
  );
}
