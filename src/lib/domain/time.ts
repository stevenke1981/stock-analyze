import type { SessionKind } from "./types";

export const TAIPEI_TZ = "Asia/Taipei";

export function taipeiParts(date = new Date()): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number;
  isoDate: string;
} {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TAIPEI_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  });
  const map: Record<string, string> = {};
  for (const p of fmt.formatToParts(date)) {
    if (p.type !== "literal") map[p.type] = p.value;
  }
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const year = Number(map.year);
  const month = Number(map.month);
  const day = Number(map.day);
  return {
    year,
    month,
    day,
    hour: Number(map.hour),
    minute: Number(map.minute),
    weekday: weekdayMap[map.weekday ?? ""] ?? 0,
    isoDate: `${year}-${pad(month)}-${pad(day)}`,
  };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function parseMarketDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^20\d{2}\d{2}\d{2}$/.test(s)) return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  return rocToIso(s);
}

export function rocToIso(raw: string): string | null {
  const s = raw.trim().replace(/-/g, "/");
  const m = s.match(/^(\d{2,3})[\/]?(\d{2})[\/]?(\d{2})$/);
  if (!m) return null;
  const year = Number(m[1]) + 1911;
  return `${year}-${m[2]}-${m[3]}`;
}

export function isoToRocCompact(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${y - 1911}${pad(m)}${pad(d)}`;
}

export function isoToYmdSlash(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${y}/${m}/${d}`;
}

export function firstOfMonthIso(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

export function addMonthsIso(iso: string, delta: number): string {
  const [y, m] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-01`;
}

export function monthKeysGoingBack(fromIso: string, months: number): string[] {
  const start = firstOfMonthIso(fromIso);
  const keys: string[] = [];
  for (let i = 0; i < months; i += 1) {
    keys.push(addMonthsIso(start, -i));
  }
  return keys;
}

export function addDaysIso(iso: string, delta: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + delta));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

export function recentWeekdaysIso(fromIso?: string, n = 6): string[] {
  let iso = fromIso ?? taipeiParts().isoDate;
  const out: string[] = [];
  for (let i = 0; i < 21 && out.length < n; i += 1) {
    const [y, m, d] = iso.split("-").map(Number);
    const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    if (wd !== 0 && wd !== 6) out.push(iso);
    iso = addDaysIso(iso, -1);
  }
  return out;
}

export function classifySession(
  now = new Date(),
  holidays = new Set<string>(),
): SessionKind {
  const p = taipeiParts(now);
  if (p.weekday === 0 || p.weekday === 6 || holidays.has(p.isoDate)) {
    return "holiday";
  }
  const minutes = p.hour * 60 + p.minute;
  if (minutes >= 9 * 60 && minutes < 13 * 60 + 30) return "regular";
  if (minutes >= 13 * 60 + 30 && minutes < 24 * 60) return "after_hours";
  return "closed";
}

export function isoNow(): string {
  return new Date().toISOString();
}

export function tradingDateFromEvent(eventIsoDate: string | null): string {
  return eventIsoDate ?? taipeiParts().isoDate;
}
