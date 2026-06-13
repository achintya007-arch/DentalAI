import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Protects the dashboard area. We only check that a valid session cookie
// exists here (Edge runtime can't touch the DB); detailed authz happens in the
// API routes / server components via getSession().

const PROTECTED_PREFIXES = ["/dashboard", "/leads", "/appointments", "/settings"];

async function hasValidSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get("dfa_session")?.value;
  if (await hasValidSession(token)) return NextResponse.next();

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dashboard/:path*", "/leads/:path*", "/appointments/:path*", "/settings/:path*"],
};
