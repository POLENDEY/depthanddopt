import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  (await cookies()).delete(sessionCookie);
  return NextResponse.redirect(new URL("/studio/login", request.url), 303);
}
