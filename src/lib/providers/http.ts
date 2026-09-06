export class HttpError extends Error {
  status: number;
  url: string;
  bodyPreview: string;
  constructor(status: number, url: string, bodyPreview: string) {
    super(`HTTP ${status} ${url}`);
    this.status = status;
    this.url = url;
    this.bodyPreview = bodyPreview;
  }
}

type QueueItem = {
  run: () => Promise<unknown>;
  resolve: (v: unknown) => void;
  reject: (e: unknown) => void;
};

const queue: QueueItem[] = [];
let active = 0;
let lastStart = 0;
const MAX_CONCURRENT = 5;
const MIN_GAP_MS = 80;

function pump() {
  if (active >= MAX_CONCURRENT) return;
  const item = queue.shift();
  if (!item) return;
  const wait = Math.max(0, MIN_GAP_MS - (Date.now() - lastStart));
  active += 1;
  lastStart = Date.now() + wait;
  const go = () => {
    item
      .run()
      .then(item.resolve, item.reject)
      .finally(() => {
        active -= 1;
        pump();
      });
  };
  if (wait > 0) setTimeout(go, wait);
  else go();
}

function enqueue<T>(run: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    queue.push({
      run: run as () => Promise<unknown>,
      resolve: resolve as (v: unknown) => void,
      reject,
    });
    pump();
  });
}

const DEFAULT_UA = "HengYan/1.0 (Taiwan equity research; data-source verification)";

export async function fetchJson<T>(
  url: string,
  opts?: { timeoutMs?: number; retries?: number; headers?: Record<string, string> },
): Promise<T> {
  return enqueue(() => fetchJsonOnce<T>(url, opts));
}

async function fetchJsonOnce<T>(
  url: string,
  opts?: { timeoutMs?: number; retries?: number; headers?: Record<string, string> },
): Promise<T> {
  const timeoutMs = opts?.timeoutMs ?? 18000;
  const retries = opts?.retries ?? 3;
  let lastErr: unknown;
  for (let attempt = 0; attempt < retries; attempt += 1) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        signal: ac.signal,
        headers: {
          Accept: "application/json,text/plain,*/*",
          "User-Agent": DEFAULT_UA,
          ...(opts?.headers ?? {}),
        },
      });
      const text = await res.text();
      if (res.status === 429 || res.status >= 500) {
        throw new HttpError(res.status, url, text.slice(0, 180));
      }
      if (res.status === 401 || res.status === 403) {
        throw new HttpError(res.status, url, text.slice(0, 180));
      }
      if (!res.ok) {
        throw new HttpError(res.status, url, text.slice(0, 180));
      }
      const trimmed = text.trim();
      if (trimmed.startsWith("<")) {
        throw new HttpError(res.status, url, "non-json html");
      }
      return JSON.parse(trimmed) as T;
    } catch (err) {
      lastErr = err;
      const status = err instanceof HttpError ? err.status : 0;
      const abort = err instanceof Error && err.name === "AbortError";
      const retryable = abort || status === 429 || status >= 500 || status === 0;
      if (!retryable || attempt === retries - 1) break;
      if (status === 401 || status === 403) break;
      const backoff = 400 * 2 ** attempt + Math.floor(Math.random() * 250);
      await sleep(backoff);
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function errorCode(err: unknown): "timeout" | "rate_limit" | "auth" | "unavailable" | "parse" {
  if (err instanceof Error && err.name === "AbortError") return "timeout";
  if (err instanceof HttpError) {
    if (err.status === 429) return "rate_limit";
    if (err.status === 401 || err.status === 403) return "auth";
    if (err.message.includes("JSON") || err.bodyPreview === "non-json html") return "parse";
  }
  if (err instanceof SyntaxError) return "parse";
  return "unavailable";
}

export function errorMessage(err: unknown): string {
  if (err instanceof HttpError) {
    if (err.status === 429) return "資料來源要求降速（HTTP 429）";
    if (err.status === 401 || err.status === 403) return "資料來源拒絕存取";
    return `資料來源回應 HTTP ${err.status}`;
  }
  if (err instanceof Error && err.name === "AbortError") return "連線逾時";
  if (err instanceof Error) return err.message;
  return "未知錯誤";
}
