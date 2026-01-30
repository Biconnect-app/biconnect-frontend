import Stripe from "stripe"

let stripeInstance: Stripe | null = null

export function getStripeServer(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not configured")
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-01-28.clover",
      typescript: true,
    })
  }
  return stripeInstance
}

// For backward compatibility - but prefer getStripeServer()
export const stripe = {
  get checkout() {
    return getStripeServer().checkout
  },
  get customers() {
    return getStripeServer().customers
  },
  get subscriptions() {
    return getStripeServer().subscriptions
  },
  get billingPortal() {
    return getStripeServer().billingPortal
  },
  get webhooks() {
    return getStripeServer().webhooks
  },
}
