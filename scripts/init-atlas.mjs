import { readFileSync } from "fs";
import { MongoClient } from "mongodb";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.trim().startsWith("#") && line.includes("="))
    .map((line) => [line.slice(0, line.indexOf("=")).trim(), line.slice(line.indexOf("=") + 1).trim()]),
);

if (!env.MONGODB_URI) {
  console.error("MONGODB_URI is missing from .env.local");
  process.exit(1);
}

const dbName = env.MONGODB_DB || "depth_dot";
const client = new MongoClient(env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });

const inquirySchema = {
  bsonType: "object",
  required: ["_id", "name", "email", "interest", "message", "status", "created_at"],
  properties: {
    _id: { bsonType: "string", description: "UUID shared with the Postgres id format" },
    name: { bsonType: "string", minLength: 2, maxLength: 80 },
    email: { bsonType: "string", maxLength: 120 },
    phone: { bsonType: ["string", "null"], maxLength: 40 },
    interest: { bsonType: "string", maxLength: 80 },
    message: { bsonType: "string", maxLength: 2000 },
    source_label: { bsonType: ["string", "null"], maxLength: 80 },
    source_path: { bsonType: ["string", "null"], maxLength: 120 },
    status: { enum: ["new", "read", "replied"] },
    created_at: { bsonType: "date" },
  },
};

const replySchema = {
  bsonType: "object",
  required: ["_id", "inquiry_id", "subject", "body", "sent_at"],
  properties: {
    _id: { bsonType: "string" },
    inquiry_id: { bsonType: "string" },
    subject: { bsonType: "string", maxLength: 140 },
    body: { bsonType: "string", maxLength: 5000 },
    sent_at: { bsonType: "date" },
  },
};

async function ensureCollection(db, name, schema) {
  const exists = await db.listCollections({ name }).hasNext();
  if (exists) {
    await db.command({ collMod: name, validator: { $jsonSchema: schema }, validationLevel: "strict" });
  } else {
    await db.createCollection(name, { validator: { $jsonSchema: schema }, validationLevel: "strict" });
  }
}

await client.connect();
const db = client.db(dbName);

await ensureCollection(db, "inquiries", inquirySchema);
await ensureCollection(db, "inquiry_replies", replySchema);
await db.collection("inquiries").createIndex({ created_at: -1 }, { name: "inquiries_created_at_idx" });
await db.collection("inquiries").createIndex({ status: 1, created_at: -1 }, { name: "inquiries_status_idx" });
await db.collection("inquiry_replies").createIndex({ inquiry_id: 1, sent_at: 1 }, { name: "replies_inquiry_idx" });
for (const name of ["app_settings", "heartbeats"]) {
  if (!(await db.listCollections({ name }).hasNext())) await db.createCollection(name);
}

const collections = (await db.listCollections().toArray()).map((c) => c.name).sort();
console.log(`Atlas database "${dbName}" collections:`);
for (const name of collections) {
  const count = await db.collection(name).countDocuments();
  console.log(`- ${name} (${count} documents)`);
}

await client.close();
