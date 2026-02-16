const CLIENT_ID = process.env.PAYPAL_CLIENT_ID
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET
const PAYPAL_BASE_URL = "https://api-m.sandbox.paypal.com"
const WEBHOOK_URL = "https://cuanted.com/api/paypal/webhook"

async function getAccessToken() {
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`,
    },
    body: "grant_type=client_credentials",
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(`Failed to get access token: ${JSON.stringify(data)}`)
  }
  return data.access_token
}

async function createWebhook(accessToken) {
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/notifications/webhooks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      url: WEBHOOK_URL,
      event_types: [
        { name: "BILLING.SUBSCRIPTION.ACTIVATED" },
        { name: "BILLING.SUBSCRIPTION.CANCELLED" },
        { name: "BILLING.SUBSCRIPTION.EXPIRED" },
        { name: "BILLING.SUBSCRIPTION.SUSPENDED" },
        { name: "BILLING.SUBSCRIPTION.PAYMENT.FAILED" },
        { name: "PAYMENT.SALE.COMPLETED" },
      ],
    }),
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(`Failed to create webhook: ${JSON.stringify(data, null, 2)}`)
  }
  return data
}

async function main() {
  console.log("=== PayPal Webhook Setup ===\n")
  console.log(`Webhook URL: ${WEBHOOK_URL}\n`)

  const accessToken = await getAccessToken()
  console.log("Authenticated with PayPal successfully.\n")

  console.log("Creating webhook...")
  const webhook = await createWebhook(accessToken)

  console.log("\nWebhook created successfully!")
  console.log(`Webhook ID: ${webhook.id}`)
  console.log(`URL: ${webhook.url}`)
  console.log(`Events:`)
  webhook.event_types.forEach((e) => console.log(`  - ${e.name}`))

  console.log("\n=== IMPORTANT ===")
  console.log(`Add this as environment variable in v0 (Vars section):`)
  console.log(`  PAYPAL_WEBHOOK_ID = ${webhook.id}`)
}

main().catch((err) => {
  console.error("Error:", err.message)
  process.exit(1)
})
