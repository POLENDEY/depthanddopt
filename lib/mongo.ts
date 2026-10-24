import "server-only";
import { MongoClient, type Db } from "mongodb";

const globalForMongo = globalThis as unknown as { ddMongo?: Promise<MongoClient> };

export function mongoConfigured() {
  return Boolean(process.env.MONGODB_URI);
}

export async function mongo(): Promise<Db> {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not set");
  }
  if (!globalForMongo.ddMongo) {
    globalForMongo.ddMongo = new MongoClient(process.env.MONGODB_URI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 8000,
    })
      .connect()
      .catch((error) => {
        globalForMongo.ddMongo = undefined;
        throw error;
      });
  }
  const client = await globalForMongo.ddMongo;
  return client.db(process.env.MONGODB_DB || "depth_dot");
}
