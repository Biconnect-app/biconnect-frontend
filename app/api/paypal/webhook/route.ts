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
        const nextBillingTime = resource.billing_info?.next_billing_time

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

        // Check if there's a trial
        const trialCycle = resource.billing_info?.cycle_executions?.find(
          (cycle: any) => cycle.tenure_type === "TRIAL"
        )
        const isTrialing = trialCycle && trialCycle.cycles_remaining > 0
        const status = isTrialing ? "trialing" : "active"
        const trialEndsAt = isTrialing && nextBillingTime ? nextBillingTime : null

        const { error } = await supabase
          .from("profiles")
          .update({
            paypal_subscriber_id: subscriberId,
            paypal_subscription_id: subscriptionId,
            paypal_plan_type: planType,
            paypal_status: status,
            paypal_next_billing_time: nextBillingTime,
            trial_ends_at: trialEndsAt,
            paypal_cancel_at_period_end: false, // Reset cancellation flag
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

        // Get user ID from subscription
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("paypal_subscription_id", subscriptionId)
          .single()

        if (profile) {
          // Update subscription status
          const { error } = await supabase
            .from("profiles")
            .update({ 
              paypal_status: status,
              paypal_cancel_at_period_end: false,
            })
            .eq("paypal_subscription_id", subscriptionId)

          if (error) {
            console.error(`Error updating profile on ${eventType}:`, error)
          } else {
            console.log(`Subscription ${eventType} for: ${subscriptionId}`)
            
            // Deactivate all active strategies for this user
            const { error: strategiesError } = await supabase
              .from("strategies")
              .update({ is_active: false })
              .eq("user_id", profile.id)
              .eq("is_active", true)

            if (strategiesError) {
              console.error("Error deactivating strategies:", strategiesError)
            } else {
              console.log(`Deactivated all strategies for user ${profile.id}`)
            }
          }
        }
        break
      }

      case "BILLING.SUBSCRIPTION.CANCELLED": {
        const subscriptionId = resource.id

        // Don't change status yet, just mark it will cancel at period end
        // The subscription remains active until it expires
        const { error } = await supabase
          .from("profiles")
          .update({ paypal_cancel_at_period_end: true })
          .eq("paypal_subscription_id", subscriptionId)

        if (error) {
          console.error("Error updating profile on cancellation:", error)
        } else {
          console.log(`Subscription marked for cancellation: ${subscriptionId}`)
        }
        break
      }

      case "BILLING.SUBSCRIPTION.RENEWED":
      case "PAYMENT.SALE.COMPLETED": {
        // Payment went through, ensure subscription is marked active
        const subscriptionId = resource.billing_agreement_id || resource.id
        const nextBillingTime = resource.billing_info?.next_billing_time

        if (subscriptionId) {
          const updateData: any = { 
            paypal_status: "active",
            trial_ends_at: null, // Clear trial since payment went through
            paypal_cancel_at_period_end: false, // Clear cancellation flag since it renewed
          }
          
          if (nextBillingTime) {
            updateData.paypal_next_billing_time = nextBillingTime
          }

          const { error } = await supabase
            .from("profiles")
            .update(updateData)
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
