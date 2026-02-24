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
    const authUser = await getAuthUser(req)
    if (!authUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get subscription ID from profile
    const profileResult = await query<{ paypal_subscription_id: string | null }>(
      "SELECT paypal_subscription_id FROM public.profiles WHERE id = $1",
      [authUser.uid]
    )

    const profile = profileResult.rows[0]
    if (!profile?.paypal_subscription_id) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 400 })
    }

    // Cancel the subscription on PayPal
    const accessToken = await getAccessToken()
    const response = await fetch(
      `${PAYPAL_BASE_URL}/v1/billing/subscriptions/${profile.paypal_subscription_id}/cancel`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          reason: "User requested cancellation from dashboard",
        }),
      }
    )

    if (!response.ok && response.status !== 204) {
      const errorData = await response.text()
      console.error("PayPal cancel error:", errorData)
      return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 })
    }

    // Mark the subscription as "will cancel at period end" but keep it active
    // PayPal keeps the subscription active until the end of the billing period
    await query(
      "UPDATE public.profiles SET paypal_cancel_at_period_end = true, updated_at = timezone('utc'::TEXT, now()) WHERE id = $1",
      [authUser.uid]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("PayPal cancel error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
