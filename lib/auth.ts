import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { Secret, TOTP } from "otpauth";
import { db } from "@/lib/db";

const COOKIE = "dd_session";
export const sessionCookie = COOKIE;

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return createHash("sha256").update(secret).digest();
}

function passwordsMatch(input: string, expected: string) {
  const left = createHash("sha256").update(input).digest();
  const right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right);
}

export function encryptSecret(plain: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

export function decryptSecret(payload: string) {
  const data = Buffer.from(payload, "base64url");
  const iv = data.subarray(0, 12);
  const tag = data.subarray(12, 28);
  const encrypted = data.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export function verifyPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !password) return false;
  return passwordsMatch(password, expected);
}

export function adminEmail() {
  return process.env.ADMIN_EMAIL || process.env.SMTP_USER || "";
}

type AdminRow = {
  email: string;
  totp_secret: string | null;
  totp_confirmed: boolean;
};

export async function getAdmin() {
  const result = await db().query<AdminRow>(
    "SELECT email, totp_secret, totp_confirmed FROM depth_dot.admin_auth WHERE id = 1",
  );
  return result.rows[0] ?? null;
}

export async function ensureAdminRow() {
  const email = adminEmail();
  await db().query(
    `INSERT INTO depth_dot.admin_auth (id, email)
     VALUES (1, $1)
     ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, updated_at = now()`,
    [email],
  );
  return getAdmin();
}

export function totpFromSecret(secret: string) {
  return new TOTP({
    issuer: "Depth & Dot",
    label: adminEmail(),
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secret),
  });
}

export function createTotpSecret() {
  return new Secret({ size: 20 }).base32;
}

export function verifyCode(secret: string, code: string) {
  const token = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(token)) return false;
  const delta = totpFromSecret(secret).validate({ token, window: 1 });
  return delta !== null;
}

export async function signSession() {
  const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(adminEmail())
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret);
}

export async function readSession(token: string | undefined) {
  if (!token || !process.env.AUTH_SECRET) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET));
    if (payload.role !== "admin") return null;
    return payload;
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    name: COOKIE,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  };
}
