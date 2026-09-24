import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { z } from "zod";
import {
  adminEmail,
  createTotpSecret,
  encryptSecret,
  decryptSecret,
  ensureAdminRow,
  sessionCookieOptions,
  signSession,
  totpFromSecret,
  verifyCode,
  verifyPassword,
} from "@/lib/auth";
import { db } from "@/lib/db";
import { limit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
  code: z.string().optional(),
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!limit(`login:${ip}`, 8, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Wait a few minutes." }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || parsed.data.email.toLowerCase() !== adminEmail().toLowerCase() || !verifyPassword(parsed.data.password)) {
    return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
  }

  const admin = await ensureAdminRow();
  let secret = admin?.totp_secret ? decryptSecret(admin.totp_secret) : "";
  if (!admin?.totp_confirmed) {
    if (!secret) {
      secret = createTotpSecret();
      await db().query(
        "UPDATE depth_dot.admin_auth SET totp_secret = $1, totp_confirmed = false, updated_at = now() WHERE id = 1",
        [encryptSecret(secret)],
      );
    }
    const qr = await QRCode.toDataURL(totpFromSecret(secret).toString(), { margin: 1, width: 220 });
    if (!verifyCode(secret, parsed.data.code || "")) {
      return NextResponse.json(
        { error: "Scan the QR code in Google Authenticator, then enter the 6-digit code.", qr },
        { status: 401 },
      );
    }
    await db().query("UPDATE depth_dot.admin_auth SET totp_confirmed = true, updated_at = now() WHERE id = 1");
  } else if (!verifyCode(secret, parsed.data.code || "")) {
    return NextResponse.json({ error: "Authenticator code is incorrect." }, { status: 401 });
  }

  const cookie = sessionCookieOptions();
  (await cookies()).set(cookie.name, await signSession(), cookie);
  return NextResponse.json({ ok: true });
}
