import { NextResponse } from "next/server"
import { getAdminAuth } from "@/lib/firebase/admin"

const SESSION_COOKIE_NAME = "session"
const SESSION_MAX_AGE_MS = 5 * 24 * 60 * 60 * 1000

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json()

    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 })
    }

    const adminAuth = getAdminAuth()
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE_MS,
    })

    const response = NextResponse.json({ success: true })
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionCookie,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE_MS / 1000,
      sameSite: "lax",
    })

    return response
  } catch (error) {
    console.error("Failed to create session cookie:", error)
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
    sameSite: "lax",
  })
  return response
}
