import { NextRequest, NextResponse } from "next/server";
import { ApplyTrack } from "@prisma/client";
import { applySessionCookie } from "@/lib/auth/session";
import { registerUser } from "@/lib/auth/service";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validation/auth";

export async function POST(request: NextRequest) {
  const limited = rateLimit(clientKey(request, "register"), 8, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const roleParam = typeof body.role === "string" ? body.role.toUpperCase() : "";
    const applyTrack =
      parsed.data.applyTrack ??
      (roleParam === "MAN" ? ApplyTrack.MAN : roleParam === "WOMAN" ? ApplyTrack.WOMAN : undefined);

    const { user, jwt } = await registerUser({
      ...parsed.data,
      applyTrack,
      ip: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    const response = NextResponse.json({
      success: true,
      emailVerified: Boolean(user.emailVerifiedAt),
      next: parsed.data.next || "/verify-email",
    });
    return applySessionCookie(response, jwt);
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_IN_USE") {
      return NextResponse.json({ error: "EMAIL_IN_USE" }, { status: 409 });
    }
    console.error("[register]", error);
    return NextResponse.json({ error: "Unable to register" }, { status: 500 });
  }
}
