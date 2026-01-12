import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ exchange: string }> }) {
  try {
    const { exchange } = await params
    const { searchParams } = new URL(request.url)
    const marketType = searchParams.get("marketType") || "spot"

    console.log("[v0] API Route called - Exchange:", exchange, "Market Type:", marketType)

    if (exchange.toLowerCase() !== "binance") {
      console.log("[v0] Unsupported exchange:", exchange)
      return NextResponse.json({ error: "Exchange not supported" }, { status: 400 })
    }

    const apiUrl =
      marketType === "futures"
        ? "https://fapi.binance.com/fapi/v1/exchangeInfo"
        : "https://api.binance.com/api/v3/exchangeInfo"

    console.log("[v0] Fetching from Binance API:", apiUrl)

    // Add timeout to fetch
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(apiUrl, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    clearTimeout(timeoutId)

    console.log("[v0] Binance API response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Binance API error response:", errorText)
      throw new Error(`Binance API returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    console.log("[v0] Received data from Binance, symbols count:", data.symbols?.length || 0)

    if (!data.symbols || !Array.isArray(data.symbols)) {
      console.error("[v0] Invalid response format from Binance:", data)
      throw new Error("Invalid response format from Binance API")
    }

    // Filter and format pairs
    const pairs = data.symbols
      .filter((symbol: any) => symbol.status === "TRADING")
      .map((symbol: any) => {
        // Format as "BASE/QUOTE" (e.g., "BTCUSDT" -> "BTC/USDT")
        const base = symbol.baseAsset
        const quote = symbol.quoteAsset
        return `${base}/${quote}`
      })

    const uniquePairs = [...new Set(pairs)].sort()

    console.log("[v0] Successfully processed pairs, count:", uniquePairs.length)
    console.log("[v0] Sample pairs:", uniquePairs.slice(0, 5))

    return NextResponse.json({ pairs: uniquePairs, count: uniquePairs.length })
  } catch (error) {
    console.error("[v0] Error in API route:", error)

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        console.error("[v0] Request timed out")
        return NextResponse.json(
          { error: "Request timed out", details: "Binance API took too long to respond" },
          { status: 504 },
        )
      }

      return NextResponse.json({ error: "Failed to fetch trading pairs", details: error.message }, { status: 500 })
    }

    return NextResponse.json({ error: "Failed to fetch trading pairs", details: String(error) }, { status: 500 })
  }
}
