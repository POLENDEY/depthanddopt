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
await client.query(`
  CREATE TABLE IF NOT EXISTS depth_dot.app_settings (
    key text PRIMARY KEY,
    value text NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
  )
`);

await client.query(`
  CREATE TABLE IF NOT EXISTS depth_dot.product_photos (
    id uuid PRIMARY KEY,
    product_slug text NOT NULL,
    url text NOT NULL,
    storage_path text NOT NULL,
    style text NOT NULL DEFAULT 'white' CHECK (style IN ('white', 'raw')),
    sort_order integer NOT NULL DEFAULT 0,
    width integer,
    height integer,
    bytes integer,
    created_at timestamptz NOT NULL DEFAULT now()
  )
`);
await client.query(
  "CREATE INDEX IF NOT EXISTS product_photos_slug_order_idx ON depth_dot.product_photos (product_slug, sort_order)",
);
await client.query("ALTER TABLE depth_dot.product_photos ADD COLUMN IF NOT EXISTS alt text");
await client.query("ALTER TABLE depth_dot.product_photos ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT true");
await client.query(`
  CREATE TABLE IF NOT EXISTS depth_dot.product_content (
    product_slug text PRIMARY KEY,
    draft jsonb,
    published jsonb,
    draft_updated_at timestamptz,
    published_at timestamptz
  )
`);

const check = await client.query(
  "SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema = 'depth_dot' ORDER BY table_name",
);
console.log("depth_dot tables:");
for (const row of check.rows) console.log(`- ${row.table_schema}.${row.table_name}`);
console.log("Existing public tables were not modified.");

await client.end();

const bucket = env.PRODUCT_PHOTO_BUCKET || "depth-dot-products";
if (env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
  const storage = `${env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")}/storage/v1`;
  const headers = {
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    "Content-Type": "application/json",
  };
  const settings = {
    public: true,
    file_size_limit: 5 * 1024 * 1024,
    allowed_mime_types: ["image/webp"],
  };
  const existing = await fetch(`${storage}/bucket/${bucket}`, { headers });
  const response = existing.ok
    ? await fetch(`${storage}/bucket/${bucket}`, { method: "PUT", headers, body: JSON.stringify({ id: bucket, ...settings }) })
    : await fetch(`${storage}/bucket`, { method: "POST", headers, body: JSON.stringify({ id: bucket, name: bucket, ...settings }) });
  console.log(
    response.ok
      ? `Storage bucket "${bucket}" is ready (public, WebP only, 5 MB max).`
      : `Storage bucket "${bucket}" could not be prepared: ${response.status} ${await response.text()}`,
  );
} else {
  console.log("NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing, so the photo bucket was not created.");
}
