import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getAuthUser } from "@/lib/auth/server"

export async function GET(request: Request) {
  const authUser = await getAuthUser(request)
  if (!authUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const result = await query(
    "SELECT id, first_name, last_name, username, plan, paypal_status, trial_ends_at, is_admin, paypal_plan_type, paypal_next_billing_time, paypal_cancel_at_period_end FROM public.profiles WHERE id = $1",
    [authUser.uid]
  )

  return NextResponse.json({ profile: result.rows[0] || null, email: authUser.email || null })
}

export async function POST(request: Request) {
  const authUser = await getAuthUser(request)
  if (!authUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const body = await request.json()
  const {
    first_name,
    last_name,
    username,
    plan,
  } = body

  let finalUsername = username || null
  if (!finalUsername && authUser.email) {
    const base = authUser.email.split("@")[0]
    let candidate = base
    let counter = 1

    while (true) {
      const existing = await query("SELECT 1 FROM public.profiles WHERE username = $1", [candidate])
      if (existing.rows.length === 0) {
        break
      }
      counter += 1
      candidate = `${base}${counter}`
    }

    finalUsername = candidate
  }

  const result = await query(
    "INSERT INTO public.profiles (id, first_name, last_name, username, plan) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, username = EXCLUDED.username, plan = EXCLUDED.plan RETURNING id",
    [authUser.uid, first_name || null, last_name || null, finalUsername, plan || "free"]
  )

  return NextResponse.json({ profile: result.rows[0] })
}

export async function PATCH(request: Request) {
  const authUser = await getAuthUser(request)
  if (!authUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const body = await request.json()
  const entries = Object.entries(body).filter(([_, value]) => value !== undefined)

  if (entries.length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 })
  }

  const fields = entries.map(([key], index) => `${key} = $${index + 2}`).join(", ")
  const values = entries.map(([_, value]) => value)

  const result = await query(
    `UPDATE public.profiles SET ${fields}, updated_at = timezone('utc'::TEXT, now()) WHERE id = $1 RETURNING id`,
    [authUser.uid, ...values]
  )

  return NextResponse.json({ profile: result.rows[0] || null })
}
