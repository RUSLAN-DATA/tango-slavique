import { NextRequest, NextResponse } from "next/server";
import { requestPasswordReset } from "@/lib/auth/service";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { emailSchema } from "@/lib/validation/auth";

export async function POST(request: NextRequest) {
  const limited = rateLimit(clientKey(request, "forgot"), 6, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  const parsed = emailSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ success: true });
  }

  await requestPasswordReset(parsed.data.email);
  return NextResponse.json({ success: true });
}
