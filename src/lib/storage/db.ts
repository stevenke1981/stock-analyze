import type {
  Note,
  PriceAlert,
  SavedScreener,
  Transaction,
  WatchlistGroup,
  WatchlistItem,
} from "@/lib/domain/types";

const DB_NAME = "hengyan";
const DB_VERSION = 1;

export interface SettingsRow {
  colorConvention: "tw" | "us";
  theme: "dark" | "light" | "system";
  aiBaseUrl: string;
  aiModel: string;
  sendHoldings: boolean;
  seeded: boolean;
}

const DEFAULT_SETTINGS: SettingsRow = {
  colorConvention: "tw",
  theme: "dark",
  aiBaseUrl: "",
  aiModel: "grok-4.5",
  sendHoldings: false,
  seeded: false,
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("kv")) db.createObjectStore("kv");
      if (!db.objectStoreNames.contains("groups")) db.createObjectStore("groups", { keyPath: "id" });
      if (!db.objectStoreNames.contains("watch")) {
        const s = db.createObjectStore("watch", { keyPath: "id" });
        s.createIndex("by_group", "groupId");
        s.createIndex("by_symbol", ["market", "symbol"], { unique: false });
      }
      if (!db.objectStoreNames.contains("txns")) {
        const s = db.createObjectStore("txns", { keyPath: "id" });
        s.createIndex("by_symbol", ["market", "symbol"]);
        s.createIndex("by_date", "tradeDate");
      }
      if (!db.objectStoreNames.contains("notes")) db.createObjectStore("notes", { keyPath: "id" });
      if (!db.objectStoreNames.contains("alerts")) db.createObjectStore("alerts", { keyPath: "id" });
      if (!db.objectStoreNames.contains("screeners")) db.createObjectStore("screeners", { keyPath: "id" });
      if (!db.objectStoreNames.contains("bars")) db.createObjectStore("bars");
      if (!db.objectStoreNames.contains("ai")) db.createObjectStore("ai");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(
  store: string,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction(store, mode);
        const s = t.objectStore(store);
        const req = fn(s);
        t.oncomplete = () => resolve((req as IDBRequest<T> | undefined)?.result as T);
        t.onerror = () => reject(t.error);
        if (req && "onsuccess" in req) {
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        }
      }),
  );
}

function getAll<T>(store: string): Promise<T[]> {
  return tx(store, "readonly", (s) => s.getAll()) as Promise<T[]>;
}

export async function getSettings(): Promise<SettingsRow> {
  const row = await tx<SettingsRow | undefined>("kv", "readonly", (s) => s.get("settings"));
  return row ?? DEFAULT_SETTINGS;
}

export async function saveSettings(patch: Partial<SettingsRow>): Promise<SettingsRow> {
  const cur = await getSettings();
  const next = { ...cur, ...patch };
  await tx("kv", "readwrite", (s) => s.put(next, "settings"));
  return next;
}

export async function listGroups(): Promise<WatchlistGroup[]> {
  const rows = await getAll<WatchlistGroup>("groups");
  return rows.sort((a, b) => a.sort - b.sort);
}

export async function saveGroup(g: WatchlistGroup): Promise<void> {
  await tx("groups", "readwrite", (s) => s.put(g));
}

export async function deleteGroup(id: string): Promise<void> {
  await tx("groups", "readwrite", (s) => s.delete(id));
}

export async function listWatch(): Promise<WatchlistItem[]> {
  const rows = await getAll<WatchlistItem>("watch");
  return rows.sort((a, b) => a.sort - b.sort);
}

export async function saveWatch(item: WatchlistItem): Promise<void> {
  await tx("watch", "readwrite", (s) => s.put(item));
}

export async function deleteWatch(id: string): Promise<void> {
  await tx("watch", "readwrite", (s) => s.delete(id));
}

export async function listTxns(): Promise<Transaction[]> {
  const rows = await getAll<Transaction>("txns");
  return rows.sort((a, b) => a.tradeDate.localeCompare(b.tradeDate));
}

export async function saveTxn(t: Transaction): Promise<void> {
  await tx("txns", "readwrite", (s) => s.put(t));
}

export async function deleteTxn(id: string): Promise<void> {
  await tx("txns", "readwrite", (s) => s.delete(id));
}

export async function replaceTxns(rows: Transaction[]): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction("txns", "readwrite");
    t.objectStore("txns").clear();
    for (const r of rows) t.objectStore("txns").put(r);
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}

export async function listNotes(): Promise<Note[]> {
  const rows = await getAll<Note>("notes");
  return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function saveNote(n: Note): Promise<void> {
  await tx("notes", "readwrite", (s) => s.put(n));
}

export async function deleteNote(id: string): Promise<void> {
  await tx("notes", "readwrite", (s) => s.delete(id));
}

export async function listAlerts(): Promise<PriceAlert[]> {
  return getAll<PriceAlert>("alerts");
}

export async function saveAlert(a: PriceAlert): Promise<void> {
  await tx("alerts", "readwrite", (s) => s.put(a));
}

export async function deleteAlert(id: string): Promise<void> {
  await tx("alerts", "readwrite", (s) => s.delete(id));
}

export async function listScreeners(): Promise<SavedScreener[]> {
  return getAll<SavedScreener>("screeners");
}

export async function saveScreener(s: SavedScreener): Promise<void> {
  await tx("screeners", "readwrite", (s0) => s0.put(s));
}

export async function cacheBars(key: string, payload: unknown): Promise<void> {
  await tx("bars", "readwrite", (s) => s.put({ at: Date.now(), payload }, key));
}

export async function readBars<T>(key: string): Promise<T | null> {
  const row = await tx<{ at: number; payload: T } | undefined>("bars", "readonly", (s) => s.get(key));
  return row?.payload ?? null;
}

export async function cacheAi(key: string, payload: unknown): Promise<void> {
  await tx("ai", "readwrite", (s) => s.put(payload, key));
}

export async function readAi<T>(key: string): Promise<T | null> {
  const row = await tx<T | undefined>("ai", "readonly", (s) => s.get(key));
  return row ?? null;
}

export async function exportAll(): Promise<string> {
  const [settings, groups, watch, txns, notes, alerts, screeners] = await Promise.all([
    getSettings(),
    listGroups(),
    listWatch(),
    listTxns(),
    listNotes(),
    listAlerts(),
    listScreeners(),
  ]);
  return JSON.stringify({ v: 1, settings, groups, watch, txns, notes, alerts, screeners }, null, 2);
}

export async function importAll(json: string): Promise<void> {
  const data = JSON.parse(json) as {
    settings?: SettingsRow;
    groups?: WatchlistGroup[];
    watch?: WatchlistItem[];
    txns?: Transaction[];
    notes?: Note[];
    alerts?: PriceAlert[];
    screeners?: SavedScreener[];
  };
  if (data.settings) await saveSettings(data.settings);
  for (const g of data.groups ?? []) await saveGroup(g);
  for (const w of data.watch ?? []) await saveWatch(w);
  if (data.txns) await replaceTxns(data.txns);
  for (const n of data.notes ?? []) await saveNote(n);
  for (const a of data.alerts ?? []) await saveAlert(a);
  for (const s of data.screeners ?? []) await saveScreener(s);
}

export async function seedIfNeeded(): Promise<void> {
  const s = await getSettings();
  if (s.seeded) return;
  const now = new Date().toISOString();
  await saveGroup({ id: "default", name: "核心觀察", sort: 0, createdAt: now });
  const seeds: Array<[string, string, string]> = [
    ["TWSE", "2330", "台積電"],
    ["TWSE", "2317", "鴻海"],
    ["TWSE", "2454", "聯發科"],
    ["TWSE", "2308", "台達電"],
    ["TWSE", "2412", "中華電"],
    ["TWSE", "2881", "富邦金"],
    ["TWSE", "0050", "元大台灣50"],
    ["TWSE", "00878", "國泰永續高股息"],
    ["TPEX", "6488", "環球晶"],
    ["TPEX", "5483", "中美晶"],
  ];
  let i = 0;
  for (const [market, symbol] of seeds) {
    await saveWatch({
      id: crypto.randomUUID(),
      groupId: "default",
      market: market as "TWSE" | "TPEX",
      symbol,
      note: "",
      sort: i,
      createdAt: now,
    });
    i += 1;
  }
  await saveSettings({ seeded: true });
}

export { DEFAULT_SETTINGS };
