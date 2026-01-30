// Stripe Price IDs - Replace these with your actual Stripe Price IDs
// You can find these in your Stripe Dashboard under Products > Prices

export const STRIPE_PRICES = {
  PRO_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY!,
  PRO_YEARLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY,
} as const

// Trial period in days
export const TRIAL_DAYS = 30

// Plan features for reference
export const PLANS = {
  none: {
    name: "Sin suscripción",
    executions: 0,
    strategies: 0,
    exchanges: 0,
    logRetention: 0,
    canActivateStrategies: false,
  },
  trial: {
    name: "Período de Prueba",
    executions: 100,
    strategies: 1,
    exchanges: 1,
    logRetention: 7,
    canActivateStrategies: true,
  },
  pro: {
    name: "Plan Pro",
    executions: Infinity,
    strategies: Infinity,
    exchanges: Infinity,
    logRetention: 90,
    canActivateStrategies: true,
  },
} as const
