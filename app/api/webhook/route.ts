import { type NextRequest, NextResponse } from "next/server"
import { WebhookValidator } from "@/lib/webhook-validator"
import { Spot } from "@binance/connector"
import { UMFutures } from "@binance/futures-connector"
import { logger } from "@/lib/logger"

/**
 * Endpoint principal para TradingView Webhook
 * Procesa las señales de TradingView y ejecuta órdenes en Binance
 *
 * El webhook URL debe contener un identificador de estrategia o se puede
 * identificar la estrategia por algún campo en el payload del webhook
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const url = new URL(request.url)

    logger.info({ payload: data, url: url.toString() }, "[WEBHOOK] 📥 Webhook recibido")

    const spotTestnetBaseURL = "https://testnet.binance.vision"
    const futuresTestnetBaseURL = "https://testnet.binancefuture.com"

    const binanceApikEY = " HARDCODE API KEY"
    const binanceApiSecret = " HARDCODE API SECRET"

    const spotClient = new Spot(binanceApikEY, binanceApiSecret, {
      baseURL: spotTestnetBaseURL,
    })
    const futuresClient = new UMFutures(binanceApikEY, binanceApiSecret, {
      baseURL: futuresTestnetBaseURL,
    })

    // Validar datos del webhook
    const validator = new WebhookValidator(spotClient, futuresClient)
    const validationResult = await validator.validate(data)

    if (!validationResult.valid) {
      logger.warn(
        {
          error: validationResult.error,
          log_summary: validationResult.log_summary,
        },
        "[WEBHOOK] ❌ Validación fallida",
      )
      return NextResponse.json(
        {
          status: "error",
          message: validationResult.error,
          log_summary: validationResult.log_summary,
        },
        { status: 400 },
      )
    }

    const trade_data = validationResult.clean_data!
    const action = trade_data.action
    const symbol = trade_data.symbol
    const quantity = Number.parseFloat(trade_data.quantity)

    let order: any

    // ──────────────────────────────────────────────
    // Ejecución en SPOT
    // ──────────────────────────────────────────────
    if (action === "buy" || action === "sell") {
      const side = action.toUpperCase() as "BUY" | "SELL"

      try {
        const response = await spotClient.newOrder(symbol, side, "MARKET", {
          quantity: quantity.toString(),
        })
        order = response.data

        logger.info({ order }, "[WEBHOOK] ✅ Orden SPOT ejecutada")
      } catch (error: any) {
        logger.error({ error, originalError: error }, "[WEBHOOK] ❌ Error ejecutando orden SPOT")
        const errorMessage = error?.response?.data?.msg || error?.message || "Error desconocido al crear orden SPOT"
        throw new Error(`Error ejecutando orden SPOT: ${errorMessage}`)
      }
    }
    // ──────────────────────────────────────────────
    // Ejecución en FUTURES
    // ──────────────────────────────────────────────
    else if (action === "long" || action === "short") {
      try {
        const orderParams: any = {
          quantity: quantity.toString(),
        }

        if (trade_data.close_position !== undefined) {
          orderParams.reduceOnly = trade_data.close_position.toString()
        }

        const response = await futuresClient.newOrder(symbol, trade_data.side!, "MARKET", orderParams)
        order = response.data

        logger.info({ order }, "[WEBHOOK] ✅ Orden FUTURES ejecutada")
      } catch (error: any) {
        logger.error({ error, originalError: error }, "[WEBHOOK] ❌ Error ejecutando orden FUTURES")
        const errorMessage = error?.response?.data?.msg || error?.message || "Error desconocido al crear orden FUTURES"
        throw new Error(`Error ejecutando orden FUTURES: ${errorMessage}`)
      }
    }

    // Respuesta unificada de éxito
    const response = NextResponse.json(
      {
        status: "success",
        message: `✅ Orden de tipo '${action.toUpperCase()}' ejecutada con éxito: acción=${action}, símbolo=${symbol}, cantidad=${quantity}.`,
        log_summary: `Orden ejecutada con éxito: acción=${action}, símbolo=${symbol}, cantidad=${quantity}. ${JSON.stringify(
          order,
        )}`,
      },
      { status: 200 },
    )

    // Agregar headers de seguridad
    response.headers.set("X-Frame-Options", "SAMEORIGIN")
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
    response.headers.set(
      "Content-Security-Policy",
      "default-src 'none'; script-src 'self'; connect-src 'none'; img-src 'self'; style-src 'self'; frame-ancestors 'none'; form-action 'self';",
    )

    return response
  } catch (error: any) {
    logger.error({ error, originalError: error }, "[WEBHOOK] ❌ Error en la ejecución del webhook")

    const errorResponse = NextResponse.json(
      {
        status: "error",
        message: error.message || "Error interno en la ejecución del webhook",
        log_summary: "Error interno en la ejecución del webhook",
      },
      { status: 500 },
    )

    // Headers de seguridad también en errores
    errorResponse.headers.set("X-Frame-Options", "SAMEORIGIN")
    errorResponse.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
    errorResponse.headers.set(
      "Content-Security-Policy",
      "default-src 'none'; script-src 'self'; connect-src 'none'; img-src 'self'; style-src 'self'; frame-ancestors 'none'; form-action 'self';",
    )

    return errorResponse
  }
}

// Método OPTIONS para CORS si es necesario
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
