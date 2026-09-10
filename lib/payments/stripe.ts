import Stripe from "stripe";
import { ENROLMENT_AMOUNT_CENTS, MONTHLY_AMOUNT_CENTS } from "@/lib/constants";

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    return null;
  }
  return new Stripe(key);
}

export function enrolmentAmount() {
  return ENROLMENT_AMOUNT_CENTS;
}

export function monthlyAmount() {
  return MONTHLY_AMOUNT_CENTS;
}
