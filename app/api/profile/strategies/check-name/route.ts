import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getAuthUser } from "@/lib/auth/server"

export async function POST(request: Request) {
  const authUser = await getAuthUser(request)
  if (!authUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { name } = await request.json()
  if (!name) {
    return NextResponse.json({ error: "Missing name" }, { status: 400 })
  }

  const result = await query(
    "SELECT name FROM public.strategies WHERE user_id = $1 AND name = $2",
    [authUser.uid, name]
  )

  return NextResponse.json({ exists: result.rows.length > 0 })
}
