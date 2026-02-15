import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe/server"
import { createServerClient } from "@supabase/ssr"
import Stripe from "stripe"

// Disable body parsing, we need the raw body for webhook verification
export const runtime = "nodejs"

async function getSupabaseAdmin() {
  // Use service role key for admin operations
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {},
      },
    }
  )
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    console.error("No stripe signature found")
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    )
  }

  const supabase = await getSupabaseAdmin()

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.supabase_user_id

        if (userId && session.subscription) {
          // Get subscription details
          const subscriptionResponse = await stripe.subscriptions.retrieve(
            session.subscription as string
          )
          const subscription = subscriptionResponse as Stripe.Subscription

          // Update user profile to Pro
          const { error } = await supabase
            .from("profiles")
            .update({
              plan: "pro",
              stripe_subscription_id: subscription.id,
              stripe_subscription_status: subscription.status,
              stripe_current_period_end: new Date(
                (subscription as unknown as { current_period_end: number }).current_period_end * 1000
              ).toISOString(),
              trial_ends_at: subscription.trial_end
                ? new Date(subscription.trial_end * 1000).toISOString()
                : null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId)

          if (error) {
            console.error("Error updating user plan:", error)
          } else {
            console.log(`User ${userId} upgraded to Pro`)
          }
        }
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.supabase_user_id
        const currentPeriodEnd = (subscription as unknown as { current_period_end: number }).current_period_end

        if (userId) {
          const plan = subscription.status === "active" || subscription.status === "trialing" ? "pro" : "free"

          const { error } = await supabase
            .from("profiles")
            .update({
              plan,
              stripe_subscription_status: subscription.status,
              stripe_current_period_end: new Date(
                currentPeriodEnd * 1000
              ).toISOString(),
              trial_ends_at: subscription.trial_end
                ? new Date(subscription.trial_end * 1000).toISOString()
                : null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId)

          if (error) {
            console.error("Error updating subscription:", error)
          }
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.supabase_user_id

        if (userId) {
          // Downgrade to free plan
          const { error } = await supabase
            .from("profiles")
            .update({
              plan: "free",
              stripe_subscription_status: "canceled",
              stripe_subscription_id: null,
              stripe_current_period_end: null,
              trial_ends_at: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId)

          if (error) {
            console.error("Error downgrading user:", error)
          } else {
            console.log(`User ${userId} downgraded to free`)
          }
        }
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = (invoice as unknown as { subscription: string }).subscription

        if (subscriptionId) {
          const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId)
          const subscription = subscriptionResponse as Stripe.Subscription
          const userId = subscription.metadata?.supabase_user_id

          if (userId) {
            // Mark subscription as past_due
            const { error } = await supabase
              .from("profiles")
              .update({
                stripe_subscription_status: "past_due",
                updated_at: new Date().toISOString(),
              })
              .eq("id", userId)

            if (error) {
              console.error("Error updating payment status:", error)
            }
          }
        }
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = (invoice as unknown as { subscription: string }).subscription

        if (subscriptionId) {
          const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId)
          const subscription = subscriptionResponse as Stripe.Subscription
          const userId = subscription.metadata?.supabase_user_id
          const currentPeriodEnd = (subscription as unknown as { current_period_end: number }).current_period_end

          if (userId) {
            // Ensure plan is active
            const { error } = await supabase
              .from("profiles")
              .update({
                plan: "pro",
                stripe_subscription_status: subscription.status,
                stripe_current_period_end: new Date(
                  currentPeriodEnd * 1000
                ).toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("id", userId)

            if (error) {
              console.error("Error updating after payment:", error)
            }
          }
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }
}
