import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getAuthUser } from "@/lib/auth/server"

export async function GET(request: Request) {
  const authUser = await getAuthUser(request)
  if (!authUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const result = await query(
    "SELECT * FROM public.strategies WHERE user_id = $1 ORDER BY created_at DESC",
    [authUser.uid]
  )

  return NextResponse.json({ strategies: result.rows })
}

export async function POST(request: Request) {
  const authUser = await getAuthUser(request)
  if (!authUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const body = await request.json()
  const {
    id,
    name,
    description,
    exchange_id,
    exchange_name,
    trading_pair,
    market_type,
    leverage,
    risk_type,
    risk_value,
    webhook_url,
    is_active,
    position_side,
  } = body

  const hasId = Boolean(id)
  const columns = hasId
    ? "id, user_id, name, description, exchange_id, exchange_name, trading_pair, market_type, leverage, risk_type, risk_value, webhook_url, is_active, position_side"
    : "user_id, name, description, exchange_id, exchange_name, trading_pair, market_type, leverage, risk_type, risk_value, webhook_url, is_active, position_side"

  const values = hasId
    ? "$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14"
    : "$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13"

  const params = hasId
    ? [
        id,
        authUser.uid,
        name,
        description || null,
        exchange_id || null,
        exchange_name || null,
        trading_pair || null,
        market_type || null,
        leverage ?? null,
        risk_type || null,
        risk_value ?? null,
        webhook_url,
        is_active ?? true,
        position_side || null,
      ]
    : [
        authUser.uid,
        name,
        description || null,
        exchange_id || null,
        exchange_name || null,
        trading_pair || null,
        market_type || null,
        leverage ?? null,
        risk_type || null,
        risk_value ?? null,
        webhook_url,
        is_active ?? true,
        position_side || null,
      ]

  const result = await query(
    `INSERT INTO public.strategies (${columns}) VALUES (${values}) RETURNING *`,
    params
  )

  return NextResponse.json({ strategy: result.rows[0] })
}

export async function PATCH(request: Request) {
  const authUser = await getAuthUser(request)
  if (!authUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const body = await request.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  }

  const entries = Object.entries(updates).filter(([_, value]) => value !== undefined)
  if (entries.length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 })
  }

  const fields = entries.map(([key], index) => `${key} = $${index + 2}`).join(", ")
  const values = entries.map(([_, value]) => value)

  const result = await query(
    `UPDATE public.strategies SET ${fields}, updated_at = timezone('utc'::TEXT, now()) WHERE id = $1 AND user_id = $${entries.length + 2} RETURNING *`,
    [id, ...values, authUser.uid]
  )

  return NextResponse.json({ strategy: result.rows[0] || null })
}

export async function DELETE(request: Request) {
  const authUser = await getAuthUser(request)
  if (!authUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  }

  await query("DELETE FROM public.strategies WHERE id = $1 AND user_id = $2", [id, authUser.uid])

  return NextResponse.json({ success: true })
}
