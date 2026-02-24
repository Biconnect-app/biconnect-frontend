import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getAuthUser } from "@/lib/auth/server"

export async function POST(request: Request) {
  const authUser = await getAuthUser(request)
  if (!authUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { id, is_active } = await request.json()
  if (!id || typeof is_active !== "boolean") {
    return NextResponse.json({ error: "Missing data" }, { status: 400 })
  }

  const result = await query(
    "UPDATE public.strategies SET is_active = $1, updated_at = timezone('utc'::TEXT, now()) WHERE id = $2 AND user_id = $3 RETURNING id, is_active",
    [is_active, id, authUser.uid]
  )

  return NextResponse.json({ strategy: result.rows[0] || null })
}
