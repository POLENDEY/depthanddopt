import { jwtVerify, SignJWT } from "jose";
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
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, secretKey);
    if (payload.role !== "admin") throw new Error("role");
    const persistentToken = typeof payload.exp === "number"
      ? await new SignJWT({ role: "admin" })
          .setProtectedHeader({ alg: "HS256" })
          .setSubject(typeof payload.sub === "string" ? payload.sub : "admin")
          .setIssuedAt()
          .sign(secretKey)
      : token;
    const response = NextResponse.next();
    response.cookies.set("dd_session", persistentToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 400,
    });
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
