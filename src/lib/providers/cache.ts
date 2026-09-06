type Entry<T> = { value: T; expiresAt: number; storedAt: number };

const store = new Map<string, Entry<unknown>>();

export function cacheGet<T>(key: string): T | undefined {
  const hit = store.get(key);
  if (!hit) return undefined;
  if (Date.now() > hit.expiresAt) return undefined;
  return hit.value as T;
}

export function cachePeek<T>(key: string): { value: T; storedAt: number; expired: boolean } | undefined {
  const hit = store.get(key);
  if (!hit) return undefined;
  return { value: hit.value as T, storedAt: hit.storedAt, expired: Date.now() > hit.expiresAt };
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs, storedAt: Date.now() });
}

export const TTL = {
  snapshot: 5 * 60_000,
  history: 6 * 60 * 60_000,
  universe: 12 * 60 * 60_000,
  fundamentals: 6 * 60 * 60_000,
  holidays: 24 * 60 * 60_000,
};
