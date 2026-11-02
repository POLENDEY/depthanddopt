import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mongoConfigured } from "@/lib/mongo";
import { readSession, sessionCookie } from "@/lib/auth";
import { mongoPhoto } from "@/lib/product-photos";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = await readSession((await cookies()).get(sessionCookie)?.value);
  try {
    if (!mongoConfigured()) return new NextResponse(null, { status: 404 });
    const image = await mongoPhoto(id, Boolean(session));
    if (!image) return new NextResponse(null, { status: 404 });
    return new NextResponse(new Uint8Array(image), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": session ? "private, no-store" : "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Could not read the MongoDB product photo.", error);
    return NextResponse.json({ error: "The photo could not be loaded." }, { status: 503 });
  }
}
