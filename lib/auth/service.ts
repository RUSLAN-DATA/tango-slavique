import { ApplyTrack } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { generateToken, hashToken } from "@/lib/auth/tokens";
import {
  applySessionCookie,
  createSession,
  destroySession,
} from "@/lib/auth/session";
import { EMAIL_VERIFY_HOURS, PASSWORD_RESET_HOURS } from "@/lib/constants";
import { sendEmail } from "@/lib/email/send";
import { NextResponse } from "next/server";

function appUrl() {
  return process.env.APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
}

export async function registerUser(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  applyTrack?: ApplyTrack;
  ip?: string;
  userAgent?: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new Error("EMAIL_IN_USE");
  }

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash: await hashPassword(input.password),
      applyTrack: input.applyTrack,
      profile: {
        create: {
          firstName: input.firstName,
          lastName: input.lastName,
        },
      },
      partnerPreferences: { create: {} },
    },
  });

  const token = generateToken();
  await prisma.verificationToken.create({
    data: {
      userId: user.id,
      type: "EMAIL_VERIFY",
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + EMAIL_VERIFY_HOURS * 60 * 60 * 1000),
    },
  });

  await sendEmail({
    to: user.email,
    event: "verification",
    data: { link: `${appUrl()}/verify-email?token=${token}` },
  });

  const session = await createSession(user, {
    ip: input.ip,
    userAgent: input.userAgent,
  });

  return { user, jwt: session.jwt };
}

export async function loginUser(input: {
  email: string;
  password: string;
  ip?: string;
  userAgent?: string;
}) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new Error("INVALID_CREDENTIALS");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const session = await createSession(user, {
    ip: input.ip,
    userAgent: input.userAgent,
  });

  return { user, jwt: session.jwt };
}

export async function verifyEmailToken(token: string) {
  const tokenHash = hashToken(token);
  const record = await prisma.verificationToken.findUnique({
    where: { tokenHash },
  });

  if (!record || record.type !== "EMAIL_VERIFY" || record.expiresAt < new Date()) {
    throw new Error("INVALID_TOKEN");
  }

  const user = await prisma.user.update({
    where: { id: record.userId },
    data: { emailVerifiedAt: new Date() },
  });

  await prisma.verificationToken.delete({ where: { id: record.id } });

  await sendEmail({
    to: user.email,
    event: "welcome",
  });

  return user;
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return;
  }

  const token = generateToken();
  await prisma.verificationToken.create({
    data: {
      userId: user.id,
      type: "PASSWORD_RESET",
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + PASSWORD_RESET_HOURS * 60 * 60 * 1000),
    },
  });

  await sendEmail({
    to: user.email,
    event: "password_reset",
    data: { link: `${appUrl()}/reset-password?token=${token}` },
  });
}

export async function resetPasswordWithToken(token: string, password: string) {
  const tokenHash = hashToken(token);
  const record = await prisma.verificationToken.findUnique({
    where: { tokenHash },
  });

  if (!record || record.type !== "PASSWORD_RESET" || record.expiresAt < new Date()) {
    throw new Error("INVALID_TOKEN");
  }

  await prisma.user.update({
    where: { id: record.userId },
    data: { passwordHash: await hashPassword(password) },
  });

  await prisma.verificationToken.delete({ where: { id: record.id } });
  await prisma.session.deleteMany({ where: { userId: record.userId } });
}

export async function logoutResponse() {
  await destroySession();
  const response = NextResponse.json({ success: true });
  applySessionCookie(response, "");
  response.cookies.set({
    name: "ts_session",
    value: "",
    maxAge: 0,
    path: "/",
  });
  return response;
}
