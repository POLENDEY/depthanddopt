import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { readSession, sessionCookie } from "@/lib/auth";
import { deleteInquiry, markInquiryRead } from "@/lib/inquiry-store";

async function requireAdmin() {
  const session = await readSession((await cookies()).get(sessionCookie)?.value);
  return Boolean(session);
}

export async function PATCH(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Sign in again." }, { status: 401 });
  const { id } = await context.params;
  if (!(await markInquiryRead(id))) return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Sign in again." }, { status: 401 });
  const { id } = await context.params;
  if (!(await deleteInquiry(id))) return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
