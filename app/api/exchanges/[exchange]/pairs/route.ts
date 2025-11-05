import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { exchange: string } }) {
  const { exchange } = params
  const { searchParams } = new URL(request.url)
  const marketType = searchParams.get("marketType") || "spot"

  try {
    if (exchange.toLowerCase() !== "binance") {
      return NextResponse.json({ error: "Exchange not supported" }, { status: 400 })
    }

    const apiUrl =
      marketType === "futures"
        ? "https://fapi.binance.com/fapi/v1/exchangeInfo"
        : "https://api.binance.com/api/v3/exchangeInfo"

    const response = await fetch(apiUrl, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!response.ok) {
      throw new Error("Failed to fetch from Binance API")
    }

    const data = await response.json()

    const pairs = data.symbols
      .filter((symbol: any) => symbol.status === "TRADING")
      .map((symbol: any) => symbol.symbol)
      .sort()

    return NextResponse.json({ pairs, count: pairs.length })
  } catch (error) {
    console.error("[v0] Error fetching trading pairs:", error)
    return NextResponse.json({ error: "Failed to fetch trading pairs" }, { status: 500 })
  }
}
