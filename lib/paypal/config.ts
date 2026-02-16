// PayPal Configuration

const isProduction = process.env.NODE_ENV === "production"

export const PAYPAL_CONFIG = {
  API_BASE: isProduction
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com",
  CLIENT_ID: process.env.PAYPAL_CLIENT_ID!,
  CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET!,
  WEBHOOK_ID: process.env.PAYPAL_WEBHOOK_ID!,
} as const

export const PAYPAL_PLANS = {
  PRO_MONTHLY: process.env.NEXT_PUBLIC_PAYPAL_PLAN_MONTHLY!,
  PRO_YEARLY: process.env.NEXT_PUBLIC_PAYPAL_PLAN_ANNUAL!,
} as const

// Trial period in days
export const TRIAL_DAYS = 30

// Plan features for reference
export const PLANS = {
  none: {
    name: "Sin suscripcion",
    executions: 0,
    strategies: 0,
    exchanges: 0,
    logRetention: 0,
    canActivateStrategies: false,
  },
  trial: {
    name: "Periodo de Prueba",
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
