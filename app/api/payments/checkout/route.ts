import { NextRequest, NextResponse } from "next/server";
import { PaymentType } from "@prisma/client";
import { requireVerifiedUser } from "@/lib/auth/session";
import { createCheckoutSession } from "@/lib/payments/checkout";

export async function POST(request: NextRequest) {
  try {
    const user = await requireVerifiedUser();
    const body = (await request.json()) as { type?: string };
    const type = body.type === "MONTHLY" ? PaymentType.MONTHLY : PaymentType.ENROLMENT;
    const origin = request.nextUrl.origin;
    const result = await createCheckoutSession({
      userId: user.id,
      type,
      successUrl: `${origin}/account/settings?paid=1`,
      cancelUrl: `${origin}/account/settings`,
    });
    return NextResponse.json({
      success: true,
      url: result.url,
      configured: result.configured,
    });
  } catch {
    return NextResponse.json({ error: "Unable to start payment" }, { status: 400 });
  }
}
