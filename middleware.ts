import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/studio") || pathname.startsWith("/studio/login")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("dd_session")?.value;
  const secret = process.env.AUTH_SECRET;
  if (!token || !secret) {
    return NextResponse.redirect(new URL("/studio/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    if (payload.role !== "admin") throw new Error("role");
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch {
    return NextResponse.redirect(new URL("/studio/login", request.url));
  }
}

export const config = {
  matcher: ["/studio/:path*"],
};
