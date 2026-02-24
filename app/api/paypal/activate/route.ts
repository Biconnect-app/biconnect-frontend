import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth/server"
import { query } from "@/lib/db"

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
    throw new Error(`Failed to get access token`)
  }
  return data.access_token
}

export async function POST(req: Request) {
  try {
    const { subscriptionId, planType } = await req.json()

    if (!subscriptionId) {
      return NextResponse.json({ error: "Missing subscriptionId" }, { status: 400 })
    }

    const authUser = await getAuthUser(req)
    if (!authUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Verify the subscription with PayPal
    const accessToken = await getAccessToken()
    const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 })
    }

    const subscription = await response.json()
    const subscriberId = subscription.subscriber?.payer_id || ""

    // Determine if it's in trial period
    const billingInfo = subscription.billing_info
    const nextBillingTime = billingInfo?.next_billing_time
    
    // Check if there's a trial cycle
    const trialCycle = subscription.billing_info?.cycle_executions?.find(
      (cycle: any) => cycle.tenure_type === "TRIAL"
    )
    const isTrialing = trialCycle && trialCycle.cycles_remaining > 0
    
    // Get the actual PayPal status
    const paypalStatus = subscription.status
    let status: string
    
    if (paypalStatus === "APPROVAL_PENDING") {
      status = "pending"
    } else if (paypalStatus === "APPROVED" || paypalStatus === "ACTIVE") {
      // If there's an active trial, mark as trialing
      status = isTrialing ? "trialing" : "active"
    } else if (paypalStatus === "SUSPENDED") {
      status = "suspended"
    } else if (paypalStatus === "CANCELLED") {
      status = "canceled"
    } else {
      status = "active"
    }

    // Calculate trial end date if in trial
    let trialEndsAt = null
    if (isTrialing && nextBillingTime) {
      trialEndsAt = nextBillingTime
    }

    // Update the profile with subscription info
    await query(
      "UPDATE public.profiles SET paypal_subscriber_id = $1, paypal_subscription_id = $2, paypal_plan_type = $3, paypal_status = $4, trial_ends_at = $5, paypal_next_billing_time = $6, paypal_cancel_at_period_end = false, updated_at = timezone('utc'::TEXT, now()) WHERE id = $7",
      [
        subscriberId,
        subscriptionId,
        planType || "monthly",
        status,
        trialEndsAt,
        nextBillingTime,
        authUser.uid,
      ]
    )

    return NextResponse.json({ 
      success: true, 
      status: status,
      isTrialing,
      trialEndsAt,
      nextBillingTime 
    })
  } catch (error) {
    console.error("PayPal activation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
