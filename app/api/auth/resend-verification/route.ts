import { NextRequest, NextResponse } from "next/server";
import { generateToken, hashToken } from "@/lib/auth/tokens";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { EMAIL_VERIFY_HOURS } from "@/lib/constants";
import { sendEmail } from "@/lib/email/send";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const limited = rateLimit(clientKey(request, "resend"), 4, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  const user = await requireUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }
  if (user.emailVerifiedAt) {
    return NextResponse.json({ success: true });
  }

  const token = generateToken();
  await prisma.verificationToken.create({
    data: {
      userId: user.id,
      type: "EMAIL_VERIFY",
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + EMAIL_VERIFY_HOURS * 60 * 60 * 1000),
    },
  });

  const appUrl = process.env.APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
  await sendEmail({
    to: user.email,
    event: "verification",
    data: { link: `${appUrl}/verify-email?token=${token}` },
  });

  return NextResponse.json({ success: true });
}
