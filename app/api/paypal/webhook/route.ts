import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const PAYPAL_BASE_URL = process.env.PAYPAL_API_URL || "https://api-m.sandbox.paypal.com"

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials not configured")
  }

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(`Failed to get access token: ${JSON.stringify(data)}`)
  }
  return data.access_token
}

async function verifyWebhookSignature(headers: Headers, body: string): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID

  if (!webhookId) {
    console.error("PAYPAL_WEBHOOK_ID not configured, skipping verification")
    return false
  }

  try {
    const accessToken = await getAccessToken()

    const response = await fetch(`${PAYPAL_BASE_URL}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        auth_algo: headers.get("paypal-auth-algo") || "",
        cert_url: headers.get("paypal-cert-url") || "",
        transmission_id: headers.get("paypal-transmission-id") || "",
        transmission_sig: headers.get("paypal-transmission-sig") || "",
        transmission_time: headers.get("paypal-transmission-time") || "",
        webhook_id: webhookId,
        webhook_event: JSON.parse(body),
      }),
    })

    const data = await response.json()
    return data.verification_status === "SUCCESS"
  } catch (error) {
    console.error("Webhook signature verification failed:", error)
    return false
  }
}

function mapPaypalStatus(paypalStatus: string): string {
  switch (paypalStatus) {
    case "ACTIVE":
      return "active"
    case "SUSPENDED":
    case "EXPIRED":
      return "inactive"
    case "CANCELLED":
      return "canceled"
    default:
      return "inactive"
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const headers = req.headers

    // Verify webhook signature in production
    if (process.env.NODE_ENV === "production") {
      const isValid = await verifyWebhookSignature(headers, body)
      if (!isValid) {
        console.error("Invalid webhook signature")
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    const event = JSON.parse(body)
    const eventType = event.event_type
    const resource = event.resource

    console.log(`PayPal webhook received: ${eventType}`)

    const supabase = await createClient()

    switch (eventType) {
      case "BILLING.SUBSCRIPTION.ACTIVATED": {
        const subscriptionId = resource.id
        const subscriberId = resource.subscriber?.payer_id
        const planId = resource.plan_id
        const customId = resource.custom_id // We pass the user ID as custom_id

        if (!customId) {
          console.error("No custom_id (user ID) in subscription")
          break
        }

        // Determine plan type from plan ID
        const monthlyPlanId = process.env.NEXT_PUBLIC_PAYPAL_PLAN_MONTHLY
        const annualPlanId = process.env.NEXT_PUBLIC_PAYPAL_PLAN_ANNUAL
        let planType = "monthly"
        if (planId === annualPlanId) {
          planType = "annual"
        }

        const { error } = await supabase
          .from("profiles")
          .update({
            paypal_subscriber_id: subscriberId,
            paypal_subscription_id: subscriptionId,
            paypal_plan_type: planType,
            paypal_status: "active",
          })
          .eq("id", customId)

        if (error) {
          console.error("Error updating profile on activation:", error)
        } else {
          console.log(`Subscription activated for user ${customId}: ${subscriptionId}`)
        }
        break
      }

      case "BILLING.SUBSCRIPTION.SUSPENDED":
      case "BILLING.SUBSCRIPTION.EXPIRED": {
        const subscriptionId = resource.id
        const status = mapPaypalStatus(resource.status)

        const { error } = await supabase
          .from("profiles")
          .update({ paypal_status: status })
          .eq("paypal_subscription_id", subscriptionId)

        if (error) {
          console.error(`Error updating profile on ${eventType}:`, error)
        } else {
          console.log(`Subscription ${eventType} for: ${subscriptionId}`)
        }
        break
      }

      case "BILLING.SUBSCRIPTION.CANCELLED": {
        const subscriptionId = resource.id

        const { error } = await supabase
          .from("profiles")
          .update({ paypal_status: "canceled" })
          .eq("paypal_subscription_id", subscriptionId)

        if (error) {
          console.error("Error updating profile on cancellation:", error)
        } else {
          console.log(`Subscription cancelled: ${subscriptionId}`)
        }
        break
      }

      case "BILLING.SUBSCRIPTION.RENEWED":
      case "PAYMENT.SALE.COMPLETED": {
        // Payment went through, ensure subscription is marked active
        const subscriptionId = resource.billing_agreement_id || resource.id

        if (subscriptionId) {
          const { error } = await supabase
            .from("profiles")
            .update({ paypal_status: "active" })
            .eq("paypal_subscription_id", subscriptionId)

          if (error) {
            console.error("Error updating profile on renewal:", error)
          }
        }
        break
      }

      case "BILLING.SUBSCRIPTION.PAYMENT.FAILED": {
        const subscriptionId = resource.id
        console.log(`Payment failed for subscription: ${subscriptionId}`)
        // PayPal will retry, no immediate status change needed
        break
      }

      default:
        console.log(`Unhandled PayPal webhook event: ${eventType}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("PayPal webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
