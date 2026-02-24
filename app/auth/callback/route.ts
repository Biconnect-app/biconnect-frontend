import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim()
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim()
  const origin = forwardedHost ? `${forwardedProto || "https"}://${forwardedHost}` : requestUrl.origin

  return NextResponse.redirect(`${origin}/login`)
}
