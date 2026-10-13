import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { readSession, sessionCookie } from "@/lib/auth";
import { db } from "@/lib/db";

async function requireAdmin() {
  const session = await readSession((await cookies()).get(sessionCookie)?.value);
  return Boolean(session);
}

export async function PATCH(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Sign in again." }, { status: 401 });
  const { id } = await context.params;
  const result = await db().query(
    "UPDATE depth_dot.inquiries SET status = 'read' WHERE id = $1 AND status = 'new'",
    [id],
  );
  if (result.rowCount === 0) {
    const existing = await db().query("SELECT id FROM depth_dot.inquiries WHERE id = $1", [id]);
    if (!existing.rowCount) return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Sign in again." }, { status: 401 });
  const { id } = await context.params;
  const result = await db().query("DELETE FROM depth_dot.inquiries WHERE id = $1", [id]);
  if (!result.rowCount) return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
