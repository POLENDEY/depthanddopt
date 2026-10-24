import "server-only";
import { db } from "@/lib/db";
import { mongo, mongoConfigured } from "@/lib/mongo";

export type InquiryStore = "primary" | "atlas";
export type StorageMode = "auto" | "primary" | "atlas";

export const storageModes: StorageMode[] = ["auto", "primary", "atlas"];
export const capacityMb = Number(process.env.PG_CAPACITY_MB || 450);

const capacityBytes = capacityMb * 1024 * 1024;
const sizeCheckMs = 10 * 60 * 1000;
const modeKey = "inquiry_store";
const keepAliveKey = "last_keepalive";
const globalForStore = globalThis as unknown as { ddPgFull?: { full: boolean; checkedAt: number } };

type MongoSetting = { _id: string; value: string; updated_at: Date };
type MongoHeartbeat = { _id: string; at: Date; count?: number };

async function primarySizeBytes() {
  const result = await db().query<{ size: string }>("SELECT pg_database_size(current_database()) AS size");
  return Number(result.rows[0]?.size ?? 0);
}

export async function primaryIsFull() {
  const cached = globalForStore.ddPgFull;
  if (cached && Date.now() - cached.checkedAt < sizeCheckMs) return cached.full;
  try {
    const full = (await primarySizeBytes()) >= capacityBytes;
    globalForStore.ddPgFull = { full, checkedAt: Date.now() };
    return full;
  } catch {
    return false;
  }
}

export function markPrimaryFull() {
  globalForStore.ddPgFull = { full: true, checkedAt: Date.now() };
}

export function isFullError(error: unknown) {
  const code = (error as { code?: string })?.code;
  return code === "53100" || code === "25006" || code === "53400";
}

async function atlasSettings() {
  return (await mongo()).collection<MongoSetting>("app_settings");
}

async function atlasHeartbeats() {
  return (await mongo()).collection<MongoHeartbeat>("heartbeats");
}

async function readPrimarySetting(key: string) {
  const result = await db().query<{ value: string; updated_at: Date }>(
    "SELECT value, updated_at FROM depth_dot.app_settings WHERE key = $1",
    [key],
  );
  return result.rows[0] ?? null;
}

async function writePrimarySetting(key: string, value: string) {
  await db().query(
    `INSERT INTO depth_dot.app_settings (key, value, updated_at) VALUES ($1, $2, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [key, value],
  );
}

function isMode(value: unknown): value is StorageMode {
  return typeof value === "string" && (storageModes as string[]).includes(value);
}

export async function getStorageMode(): Promise<StorageMode> {
  const [primary, atlas] = await Promise.all([
    readPrimarySetting(modeKey).catch(() => null),
    mongoConfigured() ? atlasSettings().then((c) => c.findOne({ _id: modeKey })).catch(() => null) : null,
  ]);
  const newest = [primary, atlas]
    .filter((row): row is { value: string; updated_at: Date } => Boolean(row))
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];
  return isMode(newest?.value) ? newest.value : "auto";
}

export async function setStorageMode(mode: StorageMode) {
  const results = await Promise.allSettled([
    writePrimarySetting(modeKey, mode),
    mongoConfigured()
      ? atlasSettings().then((c) =>
          c.updateOne({ _id: modeKey }, { $set: { value: mode, updated_at: new Date() } }, { upsert: true }),
        )
      : Promise.reject(new Error("Atlas is not configured")),
  ]);
  if (results.every((result) => result.status === "rejected")) {
    throw new Error("Neither database accepted the setting.");
  }
}

export async function storeOrder(): Promise<InquiryStore[]> {
  if (!mongoConfigured()) return ["primary"];
  const mode = await getStorageMode();
  if (mode === "atlas") return ["atlas", "primary"];
  if (mode === "primary") return ["primary", "atlas"];
  return (await primaryIsFull()) ? ["atlas", "primary"] : ["primary", "atlas"];
}

export async function keepDatabasesAlive() {
  const at = new Date();
  const result: { at: string; primary: boolean; atlas: boolean | null } = {
    at: at.toISOString(),
    primary: false,
    atlas: mongoConfigured() ? false : null,
  };

  try {
    await db().query("SELECT 1");
    result.primary = true;
    await writePrimarySetting(keepAliveKey, result.at);
  } catch (error) {
    console.error("Keep-alive: the main database did not respond to the write.", error);
  }

  if (mongoConfigured()) {
    try {
      await (await mongo()).command({ ping: 1 });
      result.atlas = true;
      await (await atlasHeartbeats()).updateOne(
        { _id: "keepalive" },
        { $set: { at }, $inc: { count: 1 } },
        { upsert: true },
      );
    } catch (error) {
      console.error("Keep-alive: Atlas did not respond.", error);
    }
  }

  return result;
}

export type StorageStatus = {
  mode: StorageMode;
  active: InquiryStore | null;
  reason: string;
  primary: { online: boolean; sizeMb: number | null; capacityMb: number; count: number | null; lastPing: string | null };
  atlas: { configured: boolean; online: boolean; count: number | null; lastPing: string | null };
};

export async function storageStatus(): Promise<StorageStatus> {
  const mode = await getStorageMode();

  const primary: StorageStatus["primary"] = { online: false, sizeMb: null, capacityMb, count: null, lastPing: null };
  try {
    const [size, count, ping] = await Promise.all([
      primarySizeBytes(),
      db().query<{ count: string }>("SELECT count(*) AS count FROM depth_dot.inquiries"),
      readPrimarySetting(keepAliveKey),
    ]);
    primary.online = true;
    primary.sizeMb = Math.round((size / 1024 / 1024) * 10) / 10;
    primary.count = Number(count.rows[0]?.count ?? 0);
    primary.lastPing = ping?.value ?? null;
    globalForStore.ddPgFull = { full: size >= capacityBytes, checkedAt: Date.now() };
  } catch (error) {
    console.error("Storage status: the main database is unreachable.", error);
  }

  const atlas: StorageStatus["atlas"] = { configured: mongoConfigured(), online: false, count: null, lastPing: null };
  if (atlas.configured) {
    try {
      const database = await mongo();
      const [count, heartbeat] = await Promise.all([
        database.collection("inquiries").countDocuments(),
        (await atlasHeartbeats()).findOne({ _id: "keepalive" }),
      ]);
      atlas.online = true;
      atlas.count = count;
      atlas.lastPing = heartbeat ? new Date(heartbeat.at).toISOString() : null;
    } catch (error) {
      console.error("Storage status: Atlas is unreachable.", error);
    }
  }

  const primaryFull = primary.sizeMb !== null && primary.sizeMb >= capacityMb;
  let active: InquiryStore | null = null;
  let reason = "";

  if (mode === "atlas") {
    if (atlas.online) [active, reason] = ["atlas", "You chose Atlas for new inquiries."];
    else if (primary.online) [active, reason] = ["primary", "You chose Atlas, but it is unreachable, so new inquiries go to Supabase."];
  } else if (mode === "primary" || !atlas.configured) {
    if (primary.online) [active, reason] = ["primary", mode === "primary" ? "You chose Supabase for new inquiries." : "Atlas is not set up, so Supabase is used."];
    else if (atlas.online) [active, reason] = ["atlas", "Supabase is unreachable, so new inquiries go to Atlas."];
  } else if (primary.online && !primaryFull) {
    [active, reason] = ["primary", `Automatic: Supabase is used until it reaches ${capacityMb} MB.`];
  } else if (atlas.online) {
    [active, reason] = ["atlas", primaryFull ? `Automatic: Supabase reached ${capacityMb} MB, so new inquiries go to Atlas.` : "Automatic: Supabase is unreachable, so new inquiries go to Atlas."];
  } else if (primary.online) {
    [active, reason] = ["primary", "Automatic: Supabase is full but Atlas is unreachable, so Supabase is still tried."];
  }

  if (!active) reason = "Neither database is reachable right now. New inquiries will fail to save.";
  return { mode, active, reason, primary, atlas };
}
