import { PAYPAL_CONFIG } from "./config"

// Cache for access token
let cachedToken: { token: string; expiresAt: number } | null = null

/**
 * Get a PayPal access token using client credentials
 */
export async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.token
  }

  const auth = Buffer.from(
    `${PAYPAL_CONFIG.CLIENT_ID}:${PAYPAL_CONFIG.CLIENT_SECRET}`
  ).toString("base64")

  const response = await fetch(`${PAYPAL_CONFIG.API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("PayPal auth error:", errorText)
    throw new Error("Failed to get PayPal access token")
  }

  const data = await response.json()

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }

  return data.access_token
}

/**
 * Get subscription details from PayPal
 */
export async function getSubscriptionDetails(subscriptionId: string) {
  const accessToken = await getAccessToken()

  const response = await fetch(
    `${PAYPAL_CONFIG.API_BASE}/v1/billing/subscriptions/${subscriptionId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error("PayPal subscription fetch error:", errorText)
    throw new Error("Failed to get subscription details")
  }

  return response.json()
}

/**
 * Cancel a PayPal subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  reason: string = "User requested cancellation"
) {
  const accessToken = await getAccessToken()

  const response = await fetch(
    `${PAYPAL_CONFIG.API_BASE}/v1/billing/subscriptions/${subscriptionId}/cancel`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error("PayPal cancel error:", errorText)
    throw new Error("Failed to cancel subscription")
  }

  return true
}

/**
 * Verify a PayPal webhook signature
 */
export async function verifyWebhookSignature(
  headers: Record<string, string>,
  body: string
): Promise<boolean> {
  const accessToken = await getAccessToken()

  const verifyPayload = {
    auth_algo: headers["paypal-auth-algo"],
    cert_url: headers["paypal-cert-url"],
    transmission_id: headers["paypal-transmission-id"],
    transmission_sig: headers["paypal-transmission-sig"],
    transmission_time: headers["paypal-transmission-time"],
    webhook_id: PAYPAL_CONFIG.WEBHOOK_ID,
    webhook_event: JSON.parse(body),
  }

  const response = await fetch(
    `${PAYPAL_CONFIG.API_BASE}/v1/notifications/verify-webhook-signature`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(verifyPayload),
    }
  )

  if (!response.ok) {
    console.error("Webhook verification request failed:", await response.text())
    return false
  }

  const data = await response.json()
  return data.verification_status === "SUCCESS"
}
