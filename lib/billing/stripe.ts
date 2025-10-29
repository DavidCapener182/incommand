import Stripe from 'stripe';

let stripe: Stripe | null = null;

export function getStripeClient(): Stripe | null {
  if (stripe !== null) {
    return stripe;
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    stripe = null;
    return stripe;
  }

  stripe = new Stripe(secret, { apiVersion: '2023-10-16' });
  return stripe;
}
