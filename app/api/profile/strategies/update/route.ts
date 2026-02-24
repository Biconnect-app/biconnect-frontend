import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getAuthUser } from "@/lib/auth/server"

export async function POST(request: Request) {
  const authUser = await getAuthUser(request)
  if (!authUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const body = await request.json()
  const { id, updates } = body

  if (!id || !updates) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 })
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
