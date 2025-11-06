import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { exchange, apiKey, apiSecret, testnet } = body

    console.log("[v0] Testing connection for exchange:", exchange, "testnet:", testnet)

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ success: false, error: "API key y secret son requeridos" }, { status: 400 })
    }

    // Only Binance is supported for now
    if (exchange !== "binance") {
      return NextResponse.json({ success: false, error: "Solo Binance está soportado actualmente" }, { status: 400 })
    }

    // Determine the base URL based on testnet flag
    const baseUrl = testnet ? "https://testnet.binance.vision" : "https://api.binance.com"

    // Create signature for authenticated request
    const timestamp = Date.now()
    const queryString = `timestamp=${timestamp}`
    const signature = crypto.createHmac("sha256", apiSecret).update(queryString).digest("hex")

    // Test the connection by fetching account information
    const response = await fetch(`${baseUrl}/api/v3/account?${queryString}&signature=${signature}`, {
      method: "GET",
      headers: {
        "X-MBX-APIKEY": apiKey,
      },
    })

    console.log("[v0] Binance API response status:", response.status)

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[v0] Binance API error:", errorData)

      // Parse Binance error messages
      let errorMessage = "Error al conectar con Binance"
      if (errorData.msg) {
        if (errorData.msg.includes("Invalid API-key")) {
          errorMessage = "API Key inválida"
        } else if (errorData.msg.includes("Signature")) {
          errorMessage = "API Secret incorrecta"
        } else if (errorData.msg.includes("IP")) {
          errorMessage = "IP no autorizada. Verifica las restricciones de IP en Binance"
        } else {
          errorMessage = errorData.msg
        }
      }

      return NextResponse.json({ success: false, error: errorMessage }, { status: 400 })
    }

    const data = await response.json()
    console.log("[v0] Connection test successful, account type:", data.accountType)

    return NextResponse.json({
      success: true,
      message: "Conexión exitosa",
      accountType: data.accountType,
      canTrade: data.canTrade,
      canDeposit: data.canDeposit,
      canWithdraw: data.canWithdraw,
    })
  } catch (error) {
    console.error("[v0] Error testing connection:", error)
    return NextResponse.json(
      { success: false, error: "Error al probar la conexión. Verifica tus credenciales." },
      { status: 500 },
    )
  }
}
