import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getAuthUser } from "@/lib/auth/server"

export async function GET(request: Request) {
  const authUser = await getAuthUser(request)
  if (!authUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const result = await query(
    "SELECT id, exchange_name, api_key, api_secret, testnet, created_at, updated_at FROM public.exchanges WHERE user_id = $1 ORDER BY created_at DESC",
    [authUser.uid]
  )

  return NextResponse.json({ exchanges: result.rows })
}

export async function POST(request: Request) {
  const authUser = await getAuthUser(request)
  if (!authUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const body = await request.json()
  const { exchange_name, api_key, api_secret, testnet } = body

  const result = await query(
    "INSERT INTO public.exchanges (user_id, exchange_name, api_key, api_secret, testnet) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    [authUser.uid, exchange_name, api_key || null, api_secret || null, testnet ?? true]
  )

  return NextResponse.json({ exchange: result.rows[0] })
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
    `UPDATE public.exchanges SET ${fields}, updated_at = timezone('utc'::TEXT, now()) WHERE id = $1 AND user_id = $${entries.length + 2} RETURNING *`,
    [id, ...values, authUser.uid]
  )

  return NextResponse.json({ exchange: result.rows[0] || null })
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

  await query("DELETE FROM public.exchanges WHERE id = $1 AND user_id = $2", [id, authUser.uid])

  return NextResponse.json({ success: true })
}
