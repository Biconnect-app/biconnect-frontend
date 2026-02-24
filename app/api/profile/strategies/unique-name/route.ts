import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getAuthUser } from "@/lib/auth/server"

export async function POST(request: Request) {
  const authUser = await getAuthUser(request)
  if (!authUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { baseName } = await request.json()
  if (!baseName) {
    return NextResponse.json({ error: "Missing baseName" }, { status: 400 })
  }

  let name = baseName
  let counter = 1

  while (true) {
    const result = await query(
      "SELECT 1 FROM public.strategies WHERE user_id = $1 AND name = $2",
      [authUser.uid, name]
    )

    if (result.rows.length === 0) {
      break
    }

    counter += 1
    name = `${baseName} (copia${counter === 2 ? "" : ` ${counter - 1}`})`
  }

  return NextResponse.json({ name })
}
