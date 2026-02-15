import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe/server"
import { STRIPE_PRICES, TRIAL_DAYS } from "@/lib/stripe/config"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { priceType, successUrl, cancelUrl } = await request.json()

    // Resolve price ID from server-side envs
    const priceId =
      priceType === "yearly" && STRIPE_PRICES.PRO_YEARLY
        ? STRIPE_PRICES.PRO_YEARLY
        : STRIPE_PRICES.PRO_MONTHLY

    // Debug: log price selection
    console.log("Received priceType:", priceType)
    console.log("Resolved priceId:", priceId)

    // Validate price ID
    const validPriceIds = [STRIPE_PRICES.PRO_MONTHLY, STRIPE_PRICES.PRO_YEARLY].filter(Boolean)
    if (!priceId || !validPriceIds.includes(priceId)) {
      console.log("Price validation failed. Valid:", validPriceIds, "Received:", priceId)
      return NextResponse.json({ error: "Precio inválido" }, { status: 400 })
    }

    // Check if user already has a Stripe customer ID
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    // Create a new customer if one doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id

      // Save the customer ID to the profile
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id)
    }

    // Create checkout session with 30-day free trial
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: TRIAL_DAYS,
        metadata: {
          supabase_user_id: user.id,
        },
      },
      success_url: successUrl || `${request.headers.get("origin")}/dashboard/estrategias?checkout=success`,
      cancel_url: cancelUrl || `${request.headers.get("origin")}/precios?checkout=cancelled`,
      metadata: {
        supabase_user_id: user.id,
      },
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      locale: "es",
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json(
      { error: "Error al crear la sesión de pago" },
      { status: 500 }
    )
  }
}
