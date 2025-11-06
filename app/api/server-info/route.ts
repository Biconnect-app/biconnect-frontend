import { NextResponse } from "next/server"

export async function GET(request: Request) {
  // Get the IP from headers
  const forwarded = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")

  // Vercel-specific headers
  const vercelRegion = request.headers.get("x-vercel-id")?.split("::")[0] || "unknown"
  const vercelIp = request.headers.get("x-vercel-forwarded-for")

  // Try to get external IP by calling an external service
  let externalIp = "unknown"
  try {
    const response = await fetch("https://api.ipify.org?format=json", {
      signal: AbortSignal.timeout(5000),
    })
    const data = await response.json()
    externalIp = data.ip
  } catch (error) {
    console.error("Error fetching external IP:", error)
  }

  return NextResponse.json({
    serverIp: externalIp,
    forwardedFor: forwarded,
    realIp: realIp,
    vercelIp: vercelIp,
    vercelRegion: vercelRegion,
    allHeaders: Object.fromEntries(request.headers.entries()),
    timestamp: new Date().toISOString(),
  })
}
