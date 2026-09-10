import { NextRequest, NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/auth/service";
import { applySessionCookie, createSession } from "@/lib/auth/session";
import { verifyEmailSchema } from "@/lib/validation/auth";

export async function POST(request: NextRequest) {
  try {
    const parsed = verifyEmailSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 400 });
    }

    const user = await verifyEmailToken(parsed.data.token);
    const session = await createSession(user);
    const response = NextResponse.json({ success: true });
    return applySessionCookie(response, session.jwt);
  } catch {
    return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 400 });
  }
}
