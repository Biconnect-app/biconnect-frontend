import { NextResponse } from "next/server"
import { getAdminAuth } from "@/lib/firebase/admin"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ exists: false }, { status: 400 })
    }

    const adminAuth = getAdminAuth()
    const user = await adminAuth.getUserByEmail(email)
    return NextResponse.json({ exists: !!user })
  } catch (err) {
    if ((err as { code?: string })?.code === "auth/user-not-found") {
      return NextResponse.json({ exists: false })
    }
    console.error("Unexpected error:", err)
    return NextResponse.json({ exists: true })
  }
}
