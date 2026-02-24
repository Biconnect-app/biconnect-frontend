import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getAdminAuth } from "@/lib/firebase/admin"

export async function POST(request: Request) {
  try {
    const { username } = await request.json()

    if (!username) {
      return NextResponse.json({ error: "Missing username" }, { status: 400 })
    }

    const result = await query<{ id: string }>(
      "SELECT id FROM public.profiles WHERE username = $1 LIMIT 1",
      [username]
    )

    const profile = result.rows[0]
    if (!profile?.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const adminAuth = getAdminAuth()
    const userRecord = await adminAuth.getUser(profile.id)
    if (!userRecord.email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 })
    }

    return NextResponse.json({ email: userRecord.email })
  } catch (error) {
    console.error("Failed to resolve username:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
