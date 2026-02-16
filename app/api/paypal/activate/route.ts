"use server"

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

    const supabase = await createClient()

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
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

    // Update the profile with subscription info
    const { error } = await supabase
      .from("profiles")
      .update({
        paypal_subscriber_id: subscriberId,
        paypal_subscription_id: subscriptionId,
        paypal_plan_type: planType || "monthly",
        paypal_status: subscription.status === "ACTIVE" ? "active" : "trialing",
      })
      .eq("id", user.id)

    if (error) {
      console.error("Error updating profile:", error)
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    return NextResponse.json({ success: true, status: subscription.status })
  } catch (error) {
    console.error("PayPal activation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
