import "server-only";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { mongo, mongoConfigured } from "@/lib/mongo";
import { isFullError, markPrimaryFull, storeOrder, type InquiryStore } from "@/lib/storage";

export type { InquiryStore };

export type InquiryInput = {
  name: string;
  email: string;
  phone: string | null;
  interest: string;
  message: string;
  sourceLabel: string;
  sourcePath: string;
};

export type InquiryReply = {
  id: string;
  inquiry_id: string;
  subject: string;
  body: string;
  sent_at: Date;
};

export type InquiryRecord = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  interest: string;
  source_label: string | null;
  source_path: string | null;
  message: string;
  status: string;
  created_at: Date;
  store: InquiryStore;
  replies: InquiryReply[];
};

type MongoInquiry = Omit<InquiryRecord, "id" | "store" | "replies"> & { _id: string };
type MongoReply = Omit<InquiryReply, "id"> & { _id: string };

const columns = "id, name, email, phone, interest, source_label, source_path, message, status, created_at";

async function atlasInquiries() {
  return (await mongo()).collection<MongoInquiry>("inquiries");
}

async function atlasReplies() {
  return (await mongo()).collection<MongoReply>("inquiry_replies");
}

function fromAtlas(doc: MongoInquiry, replies: InquiryReply[] = []): InquiryRecord {
  const { _id, ...rest } = doc;
  return { ...rest, id: _id, store: "atlas", replies };
}

function replyFromAtlas(doc: MongoReply): InquiryReply {
  const { _id, ...rest } = doc;
  return { ...rest, id: _id };
}

async function insertAtlas(id: string, input: InquiryInput) {
  await (await atlasInquiries()).insertOne({
    _id: id,
    name: input.name,
    email: input.email,
    phone: input.phone,
    interest: input.interest,
    message: input.message,
    source_label: input.sourceLabel,
    source_path: input.sourcePath,
    status: "new",
    created_at: new Date(),
  });
}

async function insertPrimary(id: string, input: InquiryInput) {
  await db().query(
    `INSERT INTO depth_dot.inquiries (id, name, email, phone, interest, message, source_label, source_path)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, input.name, input.email, input.phone, input.interest, input.message, input.sourceLabel, input.sourcePath],
  );
}

export async function createInquiry(input: InquiryInput): Promise<{ id: string; store: InquiryStore }> {
  const id = randomUUID();
  const order = await storeOrder();
  let lastError: unknown;

  for (const store of order) {
    try {
      if (store === "primary") await insertPrimary(id, input);
      else await insertAtlas(id, input);
      return { id, store };
    } catch (error) {
      lastError = error;
      if (store === "primary" && isFullError(error)) markPrimaryFull();
      console.error(`The ${store} database rejected the inquiry; trying the next one.`, error);
    }
  }
  throw lastError;
}

async function primaryReplies(ids: string[]) {
  if (!ids.length) return [];
  const result = await db().query<InquiryReply>(
    "SELECT id, inquiry_id, subject, body, sent_at FROM depth_dot.inquiry_replies WHERE inquiry_id = ANY($1::uuid[]) ORDER BY sent_at ASC",
    [ids],
  );
  return result.rows;
}

async function overflowReplies(ids: string[]) {
  if (!ids.length || !mongoConfigured()) return [];
  try {
    const docs = await (await atlasReplies()).find({ inquiry_id: { $in: ids } }).sort({ sent_at: 1 }).toArray();
    return docs.map(replyFromAtlas);
  } catch (error) {
    console.error("Could not read replies from Atlas.", error);
    return [];
  }
}

function attachReplies(records: InquiryRecord[], replies: InquiryReply[]) {
  for (const record of records) {
    record.replies = replies
      .filter((reply) => reply.inquiry_id === record.id)
      .sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime());
  }
  return records;
}

export async function listInquiries(
  limit = 100,
): Promise<{ inquiries: InquiryRecord[]; atlasError: boolean; primaryError: boolean }> {
  const records: InquiryRecord[] = [];
  let primaryError = false;
  try {
    const primary = await db().query<Omit<InquiryRecord, "store" | "replies">>(
      `SELECT ${columns} FROM depth_dot.inquiries ORDER BY created_at DESC LIMIT $1`,
      [limit],
    );
    records.push(...primary.rows.map((row) => ({ ...row, store: "primary" as const, replies: [] })));
  } catch (error) {
    primaryError = true;
    console.error("Could not read inquiries from the main database.", error);
  }

  let atlasError = false;
  if (mongoConfigured()) {
    try {
      const docs = await (await atlasInquiries()).find().sort({ created_at: -1 }).limit(limit).toArray();
      records.push(...docs.map((doc) => fromAtlas(doc)));
    } catch (error) {
      atlasError = true;
      console.error("Could not read inquiries from Atlas.", error);
    }
  }

  records.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const visible = records.slice(0, limit);
  const ids = visible.map((record) => record.id);
  const replies = [
    ...(await primaryReplies(visible.filter((r) => r.store === "primary").map((r) => r.id)).catch(() => [])),
    ...(await overflowReplies(ids)),
  ];
  return { inquiries: attachReplies(visible, replies), atlasError, primaryError };
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getInquiry(id: string): Promise<InquiryRecord | null> {
  if (!uuidPattern.test(id)) return null;
  const primary = await db().query<Omit<InquiryRecord, "store" | "replies">>(
    `SELECT ${columns} FROM depth_dot.inquiries WHERE id = $1`,
    [id],
  );
  if (primary.rows[0]) {
    const record: InquiryRecord = { ...primary.rows[0], store: "primary", replies: [] };
    return attachReplies([record], [...(await primaryReplies([id])), ...(await overflowReplies([id]))])[0];
  }
  if (!mongoConfigured()) return null;
  const doc = await (await atlasInquiries()).findOne({ _id: id });
  if (!doc) return null;
  return attachReplies([fromAtlas(doc)], await overflowReplies([id]))[0];
}

export async function markInquiryRead(id: string): Promise<boolean> {
  if (!uuidPattern.test(id)) return false;
  const primary = await db().query("SELECT status FROM depth_dot.inquiries WHERE id = $1", [id]);
  if (primary.rowCount) {
    await db()
      .query("UPDATE depth_dot.inquiries SET status = 'read' WHERE id = $1 AND status = 'new'", [id])
      .catch((error) => console.error("Could not mark the inquiry as read.", error));
    return true;
  }
  if (!mongoConfigured()) return false;
  const doc = await (await atlasInquiries()).findOne({ _id: id }, { projection: { status: 1 } });
  if (!doc) return false;
  if (doc.status === "new") await (await atlasInquiries()).updateOne({ _id: id }, { $set: { status: "read" } });
  return true;
}

export async function deleteInquiry(id: string): Promise<boolean> {
  if (!uuidPattern.test(id)) return false;
  const primary = await db().query("DELETE FROM depth_dot.inquiries WHERE id = $1", [id]);
  let found = Boolean(primary.rowCount);
  if (mongoConfigured()) {
    const atlas = await (await atlasInquiries()).deleteOne({ _id: id });
    await (await atlasReplies()).deleteMany({ inquiry_id: id });
    found = found || atlas.deletedCount > 0;
  }
  return found;
}

export async function addReply(record: InquiryRecord, subject: string, body: string) {
  const reply = { id: randomUUID(), subject, body };
  if (record.store === "primary") {
    try {
      await db().query(
        "INSERT INTO depth_dot.inquiry_replies (id, inquiry_id, subject, body) VALUES ($1, $2, $3, $4)",
        [reply.id, record.id, subject, body],
      );
      await db().query("UPDATE depth_dot.inquiries SET status = 'replied' WHERE id = $1", [record.id]);
      return;
    } catch (error) {
      if (!mongoConfigured()) throw error;
      if (isFullError(error)) markPrimaryFull();
      console.error("Primary database rejected the reply; saving it to Atlas instead.", error);
    }
  }
  await (await atlasReplies()).insertOne({ _id: reply.id, inquiry_id: record.id, subject, body, sent_at: new Date() });
  if (record.store === "atlas") {
    await (await atlasInquiries()).updateOne({ _id: record.id }, { $set: { status: "replied" } });
  }
}
