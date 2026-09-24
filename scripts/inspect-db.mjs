import { readFileSync } from "fs";
import pg from "pg";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.trim().startsWith("#") && line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
    }),
);

const client = new pg.Client({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

const databases = await client.query(
  "SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname",
);
const schemas = await client.query(
  "SELECT nspname FROM pg_namespace WHERE nspname NOT LIKE 'pg_%' AND nspname <> 'information_schema' ORDER BY 1",
);
const tables = await client.query(
  "SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog', 'information_schema') ORDER BY 1, 2",
);

console.log("DATABASES");
for (const row of databases.rows) console.log(row.datname);
console.log("SCHEMAS");
for (const row of schemas.rows) console.log(row.nspname);
console.log("TABLES");
for (const row of tables.rows) console.log(`${row.table_schema}.${row.table_name}`);

await client.end();
