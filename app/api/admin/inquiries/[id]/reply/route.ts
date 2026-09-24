import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { readSession, sessionCookie } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/mail";

const schema = z.object({
  subject: z.string().trim().min(2).max(140),
  body: z.string().trim().min(2).max(5000),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await readSession((await cookies()).get(sessionCookie)?.value);
  if (!session) return NextResponse.json({ error: "Sign in again." }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Write a subject and a message." }, { status: 400 });

  const { id } = await context.params;
  const inquiry = await db().query<{ email: string; name: string }>(
    "SELECT email, name FROM depth_dot.inquiries WHERE id = $1",
    [id],
  );
  const row = inquiry.rows[0];
  if (!row) return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });

  await sendMail({
    to: row.email,
    subject: parsed.data.subject,
    text: `${parsed.data.body}\n\n— Depth & Dot`,
  });
  await db().query(
    "INSERT INTO depth_dot.inquiry_replies (id, inquiry_id, subject, body) VALUES ($1, $2, $3, $4)",
    [randomUUID(), id, parsed.data.subject, parsed.data.body],
  );
  await db().query("UPDATE depth_dot.inquiries SET status = 'replied' WHERE id = $1", [id]);

  return NextResponse.json({ ok: true });
}
