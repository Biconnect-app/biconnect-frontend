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
      let errorMessage = "unknown"
      try {
        const errorJson = await response.json()
        errorMessage = errorJson?.error?.message || errorMessage
      } catch (parseError) {
        console.error("Failed to parse resend error payload:", parseError)
      }

      console.error("Resend verification failed:", errorMessage)

      const status = errorMessage === "TOO_MANY_ATTEMPTS_TRY_LATER" ? 429 : 500
      return NextResponse.json(
        { error: "send_failed", code: errorMessage },
        { status }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Resend verification error:", error)
    return NextResponse.json({ error: "server" }, { status: 500 })
  }
}
