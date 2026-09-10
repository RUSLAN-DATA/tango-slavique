import { PaymentStatus, PaymentType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getStripe, enrolmentAmount, monthlyAmount } from "@/lib/payments/stripe";

export async function createCheckoutSession(input: {
  userId: string;
  type: PaymentType;
  successUrl: string;
  cancelUrl: string;
}) {
  const stripe = getStripe();
  const amount = input.type === PaymentType.ENROLMENT ? enrolmentAmount() : monthlyAmount();

  const payment = await prisma.payment.create({
    data: {
      userId: input.userId,
      type: input.type,
      amountCents: amount,
      status: PaymentStatus.PENDING,
    },
  });

  if (!stripe) {
    return { payment, url: null, configured: false as const };
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    customer_email: undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: amount,
          product_data: {
            name:
              input.type === PaymentType.ENROLMENT
                ? "Tango Slavique enrolment"
                : "Tango Slavique monthly membership",
          },
        },
      },
    ],
    metadata: {
      paymentId: payment.id,
      userId: input.userId,
    },
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: { stripeCheckoutId: session.id },
  });

  return { payment, url: session.url, configured: true as const };
}
