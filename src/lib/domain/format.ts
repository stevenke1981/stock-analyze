import type { QuoteStatus, SessionKind } from "./types";
import { taipeiParts } from "./time";

const tw = new Intl.NumberFormat("zh-TW");
const tw1 = new Intl.NumberFormat("zh-TW", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const tw2 = new Intl.NumberFormat("zh-TW", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatNumber(n: number | null | undefined, digits = 0): string {
  if (n == null || Number.isNaN(n)) return "—";
  if (digits === 0) return tw.format(Math.round(n));
  if (digits === 1) return tw1.format(n);
  return new Intl.NumberFormat("zh-TW", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

export function formatPrice(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  const digits = Math.abs(n) >= 1000 ? 0 : Math.abs(n) >= 100 ? 1 : 2;
  return formatNumber(n, digits);
}

export function formatPct(n: number | null | undefined, signed = true): string {
  if (n == null || Number.isNaN(n)) return "—";
  const body = tw2.format(n);
  if (!signed) return `${body}%`;
  if (n > 0) return `+${body}%`;
  return `${body}%`;
}

export function formatSigned(n: number | null | undefined, digits = 2): string {
  if (n == null || Number.isNaN(n)) return "—";
  const body = formatNumber(n, digits);
  if (n > 0) return `+${body}`;
  return body;
}

export function formatSharesAsLots(shares: number | null | undefined): string {
  if (shares == null || Number.isNaN(shares)) return "—";
  const lots = shares / 1000;
  if (Math.abs(lots) >= 10000) return `${formatNumber(lots / 10000, 2)} 萬張`;
  return `${formatNumber(lots, 0)} 張`;
}

export function formatTwd(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e12) return `${formatNumber(n / 1e12, 2)} 兆`;
  if (abs >= 1e8) return `${formatNumber(n / 1e8, 2)} 億`;
  if (abs >= 1e4) return `${formatNumber(n / 1e4, 2)} 萬`;
  return formatNumber(n, 0);
}

export function sessionLabel(session: SessionKind): string {
  switch (session) {
    case "regular":
      return "盤中";
    case "after_hours":
      return "盤後";
    case "holiday":
      return "休市";
    default:
      return "未開盤";
  }
}

export function statusLabel(status: QuoteStatus): string {
  switch (status) {
    case "realtime":
      return "即時";
    case "delayed":
      return "延遲";
    case "after_hours":
      return "盤後";
    case "stale":
      return "過期";
    default:
      return "無法取得";
  }
}

export function changeTone(
  n: number | null | undefined,
  convention: "tw" | "us",
): "up" | "down" | "flat" {
  if (n == null || n === 0 || Number.isNaN(n)) return "flat";
  const up = n > 0;
  if (convention === "tw") return up ? "up" : "down";
  return up ? "down" : "up";
}

export function changeArrow(n: number | null | undefined): string {
  if (n == null || n === 0 || Number.isNaN(n)) return "→";
  return n > 0 ? "▲" : "▼";
}

export function formatDateTimeTaipei(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = taipeiParts(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.year}/${pad(p.month)}/${pad(p.day)} ${pad(p.hour)}:${pad(p.minute)}`;
}

export function formatIsoDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return iso.slice(0, 10);
}
