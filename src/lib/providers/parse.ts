export function parseTwNumber(value: unknown): number | null {
  if (value == null) return null;
  let s = String(value).replace(/<[^>]*>/g, "").replace(/,/g, "").trim();
  if (!s || s === "--" || s === "---" || s === "-" || s === "x" || s === "X" || s === "n/a") {
    return null;
  }
  const neg = s.startsWith("−") || s.startsWith("-") || s.includes("▼");
  const token = s.match(/[+-]?\d+(?:\.\d+)?/);
  if (!token) return null;
  const n = Number(token[0]);
  if (!Number.isFinite(n)) return null;
  if (neg && n > 0 && !token[0].startsWith("-")) return -n;
  return n;
}

export function parseCountWithLimit(raw: unknown): { count: number | null; limit: number | null } {
  const s = String(raw ?? "").replace(/,/g, "").trim();
  const m = s.match(/^(-?\d+)(?:\((\d+)\))?/);
  if (!m) return { count: null, limit: null };
  return { count: Number(m[1]), limit: m[2] ? Number(m[2]) : null };
}

export function parseChangePair(
  signRaw: unknown,
  magRaw: unknown,
): number | null {
  const mag = parseTwNumber(magRaw);
  if (mag == null) return null;
  const signText = String(signRaw ?? "")
    .replace(/<[^>]*>/g, "")
    .trim();
  if (signText === "-" || signText === "−" || signText.includes("green")) return -Math.abs(mag);
  if (signText === "+" || signText.includes("red")) return Math.abs(mag);
  return mag;
}

export function isLikelyEtf(symbol: string, name: string): boolean {
  if (/^00\d{3,4}$/.test(symbol)) return true;
  if (/^\d{4}$/.test(symbol)) {
    const n = Number(symbol);
    return n < 1000;
  }
  return /ETF|指數|正2|反1|槓桿|債券|高股息/.test(name);
}

export function looksLikeEquitySymbol(symbol: string): boolean {
  if (/^\d{4,6}$/.test(symbol)) return true;
  if (/^\d{4,6}[A-Z]$/i.test(symbol)) return true;
  return false;
}
