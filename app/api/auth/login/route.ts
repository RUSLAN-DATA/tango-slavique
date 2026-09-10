import { NextRequest, NextResponse } from "next/server";
import { applySessionCookie } from "@/lib/auth/session";
import { loginUser } from "@/lib/auth/service";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation/auth";

export async function POST(request: NextRequest) {
  const limited = rateLimit(clientKey(request, "login"), 12, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  try {
    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    const { user, jwt } = await loginUser({
      ...parsed.data,
      ip: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    const response = NextResponse.json({
      success: true,
      emailVerified: Boolean(user.emailVerifiedAt),
      role: user.role,
    });
    return applySessionCookie(response, jwt);
  } catch {
    return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
  }
}
