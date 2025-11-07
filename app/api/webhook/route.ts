import { type NextRequest, NextResponse } from "next/server"
import { WebhookValidator } from "@/lib/webhook-validator"
import { Spot } from "@binance/connector"
import { UMFutures } from "@binance/futures-connector"
import { logger } from "@/lib/logger"
import { createClient } from "@/lib/supabase/server"

/**
 * Endpoint principal para TradingView Webhook
 * Procesa las señales de TradingView y ejecuta órdenes en Binance
 *
 * El webhook URL debe contener user_id y strategy_id para identificar la estrategia
 * y las credenciales del exchange
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const url = new URL(request.url)

    logger.info({ payload: data, url: url.toString() }, "[WEBHOOK] 📥 Webhook recibido")

    const { user_id, strategy_id } = data

    if (!user_id || !strategy_id) {
      logger.warn("[WEBHOOK] ❌ Faltan user_id o strategy_id en el payload")
      return NextResponse.json(
        {
          status: "error",
          message: "Se requiere user_id y strategy_id en el payload",
          log_summary: "Faltan user_id o strategy_id",
        },
        { status: 400 },
      )
    }

    const supabase = await createClient()

    const { data: strategy, error: strategyError } = await supabase
      .from("strategies")
      .select("*")
      .eq("id", strategy_id)
      .eq("user_id", user_id)
      .single()

    if (strategyError || !strategy) {
      logger.error({ error: strategyError }, "[WEBHOOK] ❌ Error al obtener estrategia")
      return NextResponse.json(
        {
          status: "error",
          message: "Estrategia no encontrada",
          log_summary: "Estrategia no encontrada o no pertenece al usuario",
        },
        { status: 404 },
      )
    }

    const { data: exchange, error: exchangeError } = await supabase
      .from("exchanges")
      .select("*")
      .eq("user_id", user_id)
      .eq("exchange_name", strategy.exchange_name)
      .single()

    if (exchangeError || !exchange) {
      logger.error({ error: exchangeError }, "[WEBHOOK] ❌ Error al obtener exchange")
      return NextResponse.json(
        {
          status: "error",
          message: "Exchange no configurado",
          log_summary: `Exchange ${strategy.exchange_name} no configurado para este usuario`,
        },
        { status: 404 },
      )
    }

    if (!exchange.api_key || !exchange.api_secret) {
      logger.warn("[WEBHOOK] ❌ API key o secret no configuradas")
      return NextResponse.json(
        {
          status: "error",
          message: "Credenciales del exchange no configuradas",
          log_summary: "API key o secret no configuradas",
        },
        { status: 400 },
      )
    }

    const spotTestnetBaseURL = "https://testnet.binance.vision"
    const futuresTestnetBaseURL = "https://testnet.binancefuture.com"
    const spotProductionBaseURL = "https://api.binance.com"
    const futuresProductionBaseURL = "https://fapi.binance.com"

    const isTestnet = exchange.testnet || false
    const apiKey = exchange.api_key
    const apiSecret = exchange.api_secret

    const spotClient = new Spot(apiKey, apiSecret, {
      baseURL: isTestnet ? spotTestnetBaseURL : spotProductionBaseURL,
    })
    const futuresClient = new UMFutures(apiKey, apiSecret, {
      baseURL: isTestnet ? futuresTestnetBaseURL : futuresProductionBaseURL,
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
    const symbol = trade_data.symbol || strategy.trading_pair
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
