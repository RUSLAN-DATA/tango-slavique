import { PaymentStatus } from "@prisma/client";
import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/payments/stripe";

export async function handleStripeWebhook(rawBody: string, signature: string) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripe || !secret) {
    throw new Error("Stripe is not configured");
  }

  const event = stripe.webhooks.constructEvent(rawBody, signature, secret);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const paymentId = session.metadata?.paymentId;
    if (paymentId) {
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.PAID,
          stripePaymentIntentId:
            typeof session.payment_intent === "string" ? session.payment_intent : undefined,
        },
      });
    }
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    const intentId = typeof charge.payment_intent === "string" ? charge.payment_intent : null;
    if (intentId) {
      await prisma.payment.updateMany({
        where: { stripePaymentIntentId: intentId },
        data: { status: PaymentStatus.REFUNDED },
      });
    }
  }

  return event.type;
}
