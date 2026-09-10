import { NextRequest, NextResponse } from "next/server";
import { resetPasswordWithToken } from "@/lib/auth/service";
import { resetPasswordSchema } from "@/lib/validation/auth";

export async function POST(request: NextRequest) {
  const parsed = resetPasswordSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 400 });
  }

  try {
    await resetPasswordWithToken(parsed.data.token, parsed.data.password);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 400 });
  }
}
