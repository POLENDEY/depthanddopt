import "server-only";
import { Pool } from "pg";

const globalForPg = globalThis as unknown as { ddPool?: Pool };

export function db() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!globalForPg.ddPool) {
    globalForPg.ddPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }
  return globalForPg.ddPool;
}
