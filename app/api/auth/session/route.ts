import { NextResponse } from "next/server"
import { getAdminAuth } from "@/lib/firebase/admin"

const SESSION_COOKIE_NAME = "session"
const SESSION_MAX_AGE_MS = 5 * 24 * 60 * 60 * 1000

export async function POST(request: Request) {
  try {
    const { idToken, rememberMe } = await request.json()

    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 })
    }

    const adminAuth = getAdminAuth()
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE_MS,
    })

    const response = NextResponse.json({ success: true })
    const cookieOptions = {
      name: SESSION_COOKIE_NAME,
      value: sessionCookie,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    } as const

    if (rememberMe) {
      response.cookies.set({
        ...cookieOptions,
        maxAge: SESSION_MAX_AGE_MS / 1000,
      })
    } else {
      response.cookies.set(cookieOptions)
    }

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
    sameSite: "lax",
    maxAge: 0,
  })
  return response
}
