import { NextResponse } from "next/server"
import { getAdminAuth } from "@/lib/firebase/admin"

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY

export async function POST(request: Request) {
  try {
    if (!FIREBASE_API_KEY) {
      console.error("Missing FIREBASE_API_KEY")
      return NextResponse.json({ error: "config" }, { status: 500 })
    }

    const { idToken } = await request.json()
    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json({ error: "invalid" }, { status: 400 })
    }

    const auth = getAdminAuth()
    const decoded = await auth.verifyIdToken(idToken)

    if (decoded.email_verified) {
      return NextResponse.json({ ok: true })
    }

    const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/registro/confirmado`
      : ""

    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType: "VERIFY_EMAIL",
          idToken,
          continueUrl: redirectUrl || undefined,
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Resend verification failed:", errorText)
      return NextResponse.json({ error: "send_failed" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Resend verification error:", error)
    return NextResponse.json({ error: "server" }, { status: 500 })
  }
}
