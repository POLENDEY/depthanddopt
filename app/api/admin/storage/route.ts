import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { readSession, sessionCookie } from "@/lib/auth";
import { keepDatabasesAlive, setStorageMode, storageModes, type StorageMode } from "@/lib/storage";

async function requireAdmin() {
  const session = await readSession((await cookies()).get(sessionCookie)?.value);
  return Boolean(session);
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Sign in again." }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { mode?: string; action?: string };

  if (body.action === "ping") {
    const result = await keepDatabasesAlive();
    return NextResponse.json({ ok: result.primary || result.atlas === true, ...result });
  }

  if (!storageModes.includes(body.mode as StorageMode)) {
    return NextResponse.json({ error: "Choose a valid database option." }, { status: 400 });
  }
  try {
    await setStorageMode(body.mode as StorageMode);
  } catch {
    return NextResponse.json({ error: "The setting could not be saved. Try again shortly." }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
