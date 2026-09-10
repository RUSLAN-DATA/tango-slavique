import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE } from "@/lib/constants";

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) {
    return null;
  }
  return new TextEncoder().encode(value);
}

async function sessionFromRequest(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const key = secret();
  if (!token || !key) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, key);
    return {
      userId: String(payload.sub || ""),
      role: String(payload.role || "USER"),
      emailVerified: Boolean(payload.emailVerified),
    };
  } catch {
    return null;
  }
}

function isApplyForm(pathname: string) {
  return pathname === "/apply/women/form" || pathname === "/apply/men/form";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await sessionFromRequest(request);

  if (pathname.startsWith("/account") || isApplyForm(pathname)) {
    if (!session) {
      const login = new URL("/login", request.url);
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }
  }

  if (pathname.startsWith("/admin")) {
    if (!session) {
      const login = new URL("/login", request.url);
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }
    if (session.role !== "ADMIN" && session.role !== "MATCHMAKER") {
      return NextResponse.redirect(new URL("/account", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/account/:path*",
    "/admin/:path*",
    "/apply/women/form",
    "/apply/men/form",
  ],
};
