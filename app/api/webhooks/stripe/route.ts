import { NextRequest, NextResponse } from "next/server";
import { handleStripeWebhook } from "@/lib/payments/webhooks";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  try {
    const rawBody = await request.text();
    const type = await handleStripeWebhook(rawBody, signature);
    return NextResponse.json({ received: true, type });
  } catch (error) {
    console.error("[stripe-webhook]", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }
}
