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
