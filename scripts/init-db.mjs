import { randomBytes } from "crypto";
import { readFileSync, writeFileSync } from "fs";
import pg from "pg";

const envPath = new URL("../.env.local", import.meta.url);
const raw = readFileSync(envPath, "utf8");

function readEnv(text) {
  return Object.fromEntries(
    text
      .split(/\r?\n/)
      .filter((line) => line && !line.trim().startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
      }),
  );
}

let envText = raw;
const env = readEnv(envText);

function ensure(key, value) {
  if (env[key]) return;
  env[key] = value;
  envText += `${envText.endsWith("\n") ? "" : "\n"}${key}=${value}\n`;
}

ensure("DD_PUBLIC_URL", "http://localhost:3000");
ensure("ADMIN_EMAIL", env.SMTP_USER || "");
ensure("ADMIN_PASSWORD", randomBytes(18).toString("base64url"));
ensure("AUTH_SECRET", randomBytes(32).toString("base64url"));

if (envText !== raw) writeFileSync(envPath, envText);

if (!env.DATABASE_URL) {
  console.error("DATABASE_URL is missing from .env.local");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

await client.query("CREATE SCHEMA IF NOT EXISTS depth_dot");
await client.query(`
  CREATE TABLE IF NOT EXISTS depth_dot.admin_auth (
    id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    email text NOT NULL,
    totp_secret text,
    totp_confirmed boolean NOT NULL DEFAULT false,
    updated_at timestamptz NOT NULL DEFAULT now()
  )
`);
await client.query(`
  CREATE TABLE IF NOT EXISTS depth_dot.inquiries (
    id uuid PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    interest text NOT NULL,
    message text NOT NULL,
    status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
    created_at timestamptz NOT NULL DEFAULT now()
  )
`);
await client.query(`
  CREATE TABLE IF NOT EXISTS depth_dot.inquiry_replies (
    id uuid PRIMARY KEY,
    inquiry_id uuid NOT NULL REFERENCES depth_dot.inquiries (id) ON DELETE CASCADE,
    subject text NOT NULL,
    body text NOT NULL,
    sent_at timestamptz NOT NULL DEFAULT now()
  )
`);
await client.query(
  "CREATE INDEX IF NOT EXISTS inquiries_created_at_idx ON depth_dot.inquiries (created_at DESC)",
);
await client.query("ALTER TABLE depth_dot.inquiries ADD COLUMN IF NOT EXISTS source_label text");
await client.query("ALTER TABLE depth_dot.inquiries ADD COLUMN IF NOT EXISTS source_path text");

const check = await client.query(
  "SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema = 'depth_dot' ORDER BY table_name",
);
console.log("depth_dot tables:");
for (const row of check.rows) console.log(`- ${row.table_schema}.${row.table_name}`);
console.log("Existing public tables were not modified.");

await client.end();
