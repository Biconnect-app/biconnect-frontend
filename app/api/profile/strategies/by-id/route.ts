import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getAuthUser } from "@/lib/auth/server"

export async function POST(request: Request) {
  const authUser = await getAuthUser(request)
  if (!authUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { id } = await request.json()
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  }

  const result = await query(
    "SELECT * FROM public.strategies WHERE id = $1 AND user_id = $2",
    [id, authUser.uid]
  )

  return NextResponse.json({ strategy: result.rows[0] || null })
}
