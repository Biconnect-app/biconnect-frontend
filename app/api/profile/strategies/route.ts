import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getAuthUser } from "@/lib/auth/server"

export async function GET(request: Request) {
  const authUser = await getAuthUser(request)
  if (!authUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const result = await query(
    "SELECT id FROM public.strategies WHERE user_id = $1 LIMIT 1",
    [authUser.uid]
  )

  return NextResponse.json({ hasStrategies: result.rows.length > 0 })
}
