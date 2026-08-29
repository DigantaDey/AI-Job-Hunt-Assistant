// Lightweight local-first JSON-file store.
// Chosen over Prisma/SQLite so the app runs with ZERO native binaries and
// works in sandboxes and the live preview. Data lives in a single JSON file
// (configurable via JOBHUNT_DATA_FILE) and is fully exportable.

import { promises as fs } from "fs";
import path from "path";

export type Row = Record<string, any>;

export interface DbShape {
  meta: { schemaVersion: number; createdAt: string; updatedAt: string };
  [collection: string]: Row[] | DbShape["meta"] | undefined;
}

const DEFAULT_DATA_FILE = path.join(
  process.cwd(),
  "data",
  "jobhunt.json",
);

let dataFile = process.env.JOBHUNT_DATA_FILE || DEFAULT_DATA_FILE;
let cache: DbShape | null = null;
let writeQueue: Promise<void> = Promise.resolve();

function nowIso(): string {
  return new Date().toISOString();
}

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

async function load(): Promise<DbShape> {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(dataFile, "utf8");
    cache = JSON.parse(raw) as DbShape;
  } catch {
    cache = {
      meta: { schemaVersion: 1, createdAt: nowIso(), updatedAt: nowIso() },
    };
  }
  return cache;
}

/** Serialize cache to disk. Serialized to avoid interleaved writes. */
function persist(): void {
  if (!cache) return;
  cache.meta.updatedAt = nowIso();
  const payload = JSON.stringify(cache, null, 2);
  writeQueue = writeQueue.then(async () => {
    await fs.mkdir(path.dirname(dataFile), { recursive: true });
    await fs.writeFile(dataFile, payload, "utf8");
  });
}

function coll(db: DbShape, name: string): Row[] {
  if (!db[name]) db[name] = [];
  return db[name] as Row[];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function listAll<T>(name: string): Promise<T[]> {
  const db = await load();
  return coll(db, name) as T[];
}

export async function getById<T>(name: string, id: string): Promise<T | null> {
  const db = await load();
  const rows = coll(db, name);
  return (rows.find((r) => r.id === id) as T) ?? null;
}

export async function where<T>(name: string, pred: (r: T) => boolean): Promise<T[]> {
  const db = await load();
  return (coll(db, name).filter(pred as any) as T[]);
}

export async function findOne<T>(name: string, pred: (r: T) => boolean): Promise<T | null> {
  const db = await load();
  return (coll(db, name).find(pred as any) as T) ?? null;
}

export async function create<T extends { id: string }>(
  name: string,
  data: any,
): Promise<T> {
  const db = await load();
  const rows = coll(db, name);
  const row: Row = {
    ...(data as any),
    id: data.id || newId(name.slice(0, 2)),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  rows.push(row);
  persist();
  return row as T;
}

export async function update<T extends { id: string }>(
  name: string,
  id: string,
  patch: Partial<T>,
): Promise<T | null> {
  const db = await load();
  const rows = coll(db, name);
  const row = rows.find((r) => r.id === id);
  if (!row) return null;
  Object.assign(row, patch, { id, updatedAt: nowIso() });
  persist();
  return row as T;
}

export async function remove(name: string, id: string): Promise<boolean> {
  const db = await load();
  const rows = coll(db, name);
  const idx = rows.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  rows.splice(idx, 1);
  persist();
  return true;
}

export async function count(name: string): Promise<number> {
  const db = await load();
  return coll(db, name).length;
}

export async function upsertSetting(
  name: string,
  id: string,
  data: Omit<any, "id" | "updatedAt">,
): Promise<any> {
  const db = await load();
  const rows = coll(db, name);
  const row = rows.find((r) => r.id === id);
  if (row) {
    Object.assign(row, data, { id, updatedAt: nowIso() });
  } else {
    rows.push({ ...data, id, createdAt: nowIso(), updatedAt: nowIso() });
  }
  persist();
  return rows.find((r) => r.id === id);
}

export async function flush(): Promise<void> {
  persist();
  await writeQueue;
}

export { newId, nowIso };
