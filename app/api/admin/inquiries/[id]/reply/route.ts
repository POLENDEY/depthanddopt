import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { readSession, sessionCookie } from "@/lib/auth";
import { addReply, getInquiry } from "@/lib/inquiry-store";
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
  const inquiry = await getInquiry(id);
  if (!inquiry) return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });

  await sendMail({
    to: inquiry.email,
    subject: parsed.data.subject,
    text: `${parsed.data.body}\n\n— Depth & Dot`,
  });
  await addReply(inquiry, parsed.data.subject, parsed.data.body);

  return NextResponse.json({ ok: true });
}
