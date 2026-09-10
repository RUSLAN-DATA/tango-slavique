import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/auth/tokens";
import { SESSION_COOKIE, SESSION_DAYS } from "@/lib/constants";

export type SessionPayload = {
  sub: string;
  email: string;
  role: Role;
  emailVerified: boolean;
};

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 16) {
    throw new Error("AUTH_SECRET is missing or too short");
  }
  return new TextEncoder().encode(value);
}

export function sessionMaxAgeSeconds() {
  return SESSION_DAYS * 24 * 60 * 60;
}

export async function signSessionJwt(payload: SessionPayload) {
  return new SignJWT({
    email: payload.email,
    role: payload.role,
    emailVerified: payload.emailVerified,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
}

export async function verifySessionJwt(token: string) {
  const { payload } = await jwtVerify(token, secret());
  if (
    typeof payload.sub !== "string" ||
    typeof payload.email !== "string" ||
    typeof payload.role !== "string"
  ) {
    return null;
  }

  return {
    sub: payload.sub,
    email: payload.email,
    role: payload.role as Role,
    emailVerified: Boolean(payload.emailVerified),
  } satisfies SessionPayload;
}

export function cookieOptions() {
  return {
    name: SESSION_COOKIE,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionMaxAgeSeconds(),
  };
}

export async function createSession(user: {
  id: string;
  email: string;
  role: Role;
  emailVerifiedAt: Date | null;
}, meta?: { ip?: string; userAgent?: string }) {
  const token = crypto.randomUUID() + crypto.randomUUID();
  const expiresAt = new Date(Date.now() + sessionMaxAgeSeconds() * 1000);

  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt,
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    },
  });

  const jwt = await signSessionJwt({
    sub: user.id,
    email: user.email,
    role: user.role,
    emailVerified: Boolean(user.emailVerifiedAt),
  });

  return { jwt, token };
}

export async function destroySession() {
  const jar = cookies();
  const jwt = jar.get(SESSION_COOKIE)?.value;
  if (jwt) {
    const payload = await verifySessionJwt(jwt).catch(() => null);
    if (payload) {
      await prisma.session.deleteMany({ where: { userId: payload.sub } });
    }
  }
  jar.set(SESSION_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
}

export function applySessionCookie(response: NextResponse, jwt: string) {
  response.cookies.set(SESSION_COOKIE, jwt, cookieOptions());
  return response;
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  try {
    return await verifySessionJwt(token);
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    include: {
      profile: true,
      application: true,
    },
  });

  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }
  return user;
}

export async function requireVerifiedUser() {
  const user = await requireUser();
  if (!user.emailVerifiedAt) {
    throw new Error("UNVERIFIED");
  }
  return user;
}

export async function requireStaff() {
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.role !== "MATCHMAKER") {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return user;
}
