import { NextResponse } from "next/server"

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY

function buildSafeContinueUrl(rawUrl: string | null, origin: string, fallbackPath: string) {
  try {
    const url = rawUrl ? new URL(rawUrl, origin) : new URL(fallbackPath, origin)
    if (url.origin !== origin) {
      return new URL(fallbackPath, origin)
    }
    return url
  } catch {
    return new URL(fallbackPath, origin)
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim()
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim()
  const origin = forwardedHost ? `${forwardedProto || "https"}://${forwardedHost}` : requestUrl.origin
  const mode = requestUrl.searchParams.get("mode") || ""
  const oobCode = requestUrl.searchParams.get("oobCode") || ""
  const continueUrlRaw = requestUrl.searchParams.get("continueUrl")

  const fallbackPath = mode === "resetPassword" ? "/recuperar/nueva-contrasena" : "/registro/confirmado"
  const redirectUrl = buildSafeContinueUrl(continueUrlRaw, origin, fallbackPath)

  if (mode === "resetPassword") {
    if (oobCode) {
      redirectUrl.searchParams.set("oobCode", oobCode)
    }
    redirectUrl.searchParams.set("mode", "resetPassword")
    return NextResponse.redirect(redirectUrl)
  }

  if (mode === "verifyEmail") {
    if (oobCode && FIREBASE_API_KEY) {
      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${FIREBASE_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ oobCode }),
        }
      )

      if (!response.ok) {
        redirectUrl.searchParams.set("status", "error")
      }
    } else {
      redirectUrl.searchParams.set("status", "error")
    }

    return NextResponse.redirect(redirectUrl)
  }

  if (oobCode) {
    redirectUrl.searchParams.set("oobCode", oobCode)
  }
  if (mode) {
    redirectUrl.searchParams.set("mode", mode)
  }

  return NextResponse.redirect(redirectUrl)
}