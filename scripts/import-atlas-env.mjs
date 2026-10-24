import { readFileSync, writeFileSync } from "fs";

const source = process.argv[2];
if (!source) {
  console.error("Usage: node scripts/import-atlas-env.mjs <path-to-atlas-credentials.env>");
  process.exit(1);
}

const line = readFileSync(source, "utf8").split(/\r?\n/).find((l) => l.trim().startsWith("MONGODB_URI="));
if (!line) {
  console.error("MONGODB_URI not found in the credentials file");
  process.exit(1);
}
const value = line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");

const envPath = new URL("../.env.local", import.meta.url);
let env = readFileSync(envPath, "utf8");
const eol = env.includes("\r\n") ? "\r\n" : "\n";
if (/^MONGODB_URI=/m.test(env)) {
  env = env.replace(/^MONGODB_URI=.*$/m, `MONGODB_URI=${value}`);
} else {
  env += `${env.endsWith("\n") ? "" : eol}MONGODB_URI=${value}${eol}`;
}
if (!/^MONGODB_DB=/m.test(env)) env += `MONGODB_DB=depth_dot${eol}`;
writeFileSync(envPath, env);
console.log(`MONGODB_URI saved to .env.local (${value.split("@")[1]?.split("/")[0] ?? "host hidden"})`);
