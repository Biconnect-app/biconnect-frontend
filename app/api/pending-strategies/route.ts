import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get("email")

  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 })
  }

  const result = await query(
    "SELECT * FROM public.pending_strategies WHERE email = $1 ORDER BY created_at DESC LIMIT 1",
    [email.toLowerCase()]
  )

  return NextResponse.json({ pendingStrategy: result.rows[0] || null })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { email, strategy_data } = body

  if (!email || !strategy_data) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 })
  }

  const result = await query(
    "INSERT INTO public.pending_strategies (email, strategy_data) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET strategy_data = EXCLUDED.strategy_data, created_at = now() RETURNING *",
    [email.toLowerCase(), strategy_data]
  )

  return NextResponse.json({ pendingStrategy: result.rows[0] })
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get("email")

  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 })
  }

  await query("DELETE FROM public.pending_strategies WHERE email = $1", [email.toLowerCase()])
  return NextResponse.json({ success: true })
}
