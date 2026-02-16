/**
 * PayPal Plans Setup Script
 * 
 * Run this script to create the PayPal product and billing plans.
 * It will output the Plan IDs that need to be set as environment variables.
 * 
 * Prerequisites:
 * - PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be set
 * 
 * Usage: node scripts/setup-paypal-plans.mjs
 */

const PAYPAL_BASE_URL = process.env.PAYPAL_API_URL || "https://api-m.sandbox.paypal.com"
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("ERROR: PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be set")
  process.exit(1)
}

async function getAccessToken() {
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(`Failed to get access token: ${JSON.stringify(data)}`)
  }
  return data.access_token
}

async function createProduct(accessToken) {
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/catalogs/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      name: "Biconnect Pro",
      description: "Suscripcion Pro de Biconnect - Trading automatizado de criptomonedas",
      type: "SERVICE",
      category: "SOFTWARE",
    }),
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(`Failed to create product: ${JSON.stringify(data)}`)
  }
  console.log(`Product created: ${data.id}`)
  return data.id
}

async function createPlan(accessToken, productId, name, interval, price) {
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/plans`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      product_id: productId,
      name,
      description: `Plan ${name} de Biconnect Pro`,
      status: "ACTIVE",
      billing_cycles: [
        {
          frequency: {
            interval_unit: "DAY",
            interval_count: 30,
          },
          tenure_type: "TRIAL",
          sequence: 1,
          total_cycles: 1,
          pricing_scheme: {
            fixed_price: {
              value: "0",
              currency_code: "USD",
            },
          },
        },
        {
          frequency: {
            interval_unit: interval,
            interval_count: 1,
          },
          tenure_type: "REGULAR",
          sequence: 2,
          total_cycles: 0,
          pricing_scheme: {
            fixed_price: {
              value: price,
              currency_code: "USD",
            },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee: {
          value: "0",
          currency_code: "USD",
        },
        setup_fee_failure_action: "CONTINUE",
        payment_failure_threshold: 3,
      },
    }),
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(`Failed to create plan: ${JSON.stringify(data)}`)
  }
  console.log(`Plan "${name}" created: ${data.id}`)
  return data.id
}

async function main() {
  try {
    console.log("Getting PayPal access token...")
    const accessToken = await getAccessToken()

    console.log("Creating product...")
    const productId = await createProduct(accessToken)

    console.log("Creating monthly plan ($25/month with 30-day trial)...")
    const monthlyPlanId = await createPlan(accessToken, productId, "Pro Mensual", "MONTH", "25.00")

    console.log("Creating annual plan ($250/year with 30-day trial)...")
    const annualPlanId = await createPlan(accessToken, productId, "Pro Anual", "YEAR", "250.00")

    console.log("\n========================================")
    console.log("Setup complete! Set these environment variables:")
    console.log("========================================")
    console.log(`PAYPAL_PLAN_MONTHLY=${monthlyPlanId}`)
    console.log(`PAYPAL_PLAN_ANNUAL=${annualPlanId}`)
    console.log("========================================\n")
  } catch (error) {
    console.error("Setup failed:", error.message)
    process.exit(1)
  }
}

main()
