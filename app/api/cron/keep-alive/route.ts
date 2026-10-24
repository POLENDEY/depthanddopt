import { NextResponse } from "next/server";
import { limit } from "@/lib/rate-limit";
import { keepDatabasesAlive } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    if (request.headers.get("authorization") !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else if (!limit("keep-alive", 4, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const result = await keepDatabasesAlive();
  const ok = result.primary && result.atlas !== false;
  return NextResponse.json({ ok, ...result }, { status: ok ? 200 : 503 });
}
