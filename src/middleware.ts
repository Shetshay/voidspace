import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export const runtime = "experimental-edge";

const PUBLIC_PATHS = ["/", "/login", "/register", "/about", "/faq", "/tos"];

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || "voidspace-dev-secret-change-in-prod";
  return new TextEncoder().encode(secret);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths, API routes (they handle auth internally), and static assets
  if (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/uploads") ||
    pathname.match(/\.(png|jpg|ico|svg|webmanifest)$/)
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    await jwtVerify(token, getSecret());
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
