import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ exchange: string }> }) {
  const { exchange } = await params
  const { searchParams } = new URL(request.url)
  const marketType = searchParams.get("marketType") || "spot"

  console.log("[v0] Fetching pairs for exchange:", exchange, "marketType:", marketType)

  try {
    if (exchange.toLowerCase() !== "binance") {
      console.log("[v0] Exchange not supported:", exchange)
      return NextResponse.json({ error: "Exchange not supported" }, { status: 400 })
    }

    const apiUrl =
      marketType === "futures"
        ? "https://fapi.binance.com/fapi/v1/exchangeInfo"
        : "https://api.binance.com/api/v3/exchangeInfo"

    console.log("[v0] Fetching from Binance API:", apiUrl)

    const response = await fetch(apiUrl, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!response.ok) {
      console.log("[v0] Binance API response not OK:", response.status, response.statusText)
      throw new Error(`Binance API returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    console.log("[v0] Received symbols from Binance:", data.symbols?.length || 0)

    const pairs = data.symbols
      .filter((symbol: any) => symbol.status === "TRADING")
      .map((symbol: any) => symbol.symbol)
      .sort()

    console.log("[v0] Filtered trading pairs:", pairs.length)

    return NextResponse.json({ pairs, count: pairs.length })
  } catch (error) {
    console.error("[v0] Error fetching trading pairs:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch trading pairs",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
