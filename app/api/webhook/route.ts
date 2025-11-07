import { type NextRequest, NextResponse } from "next/server"
import { WebhookValidator } from "@/lib/webhook-validator"
import { Spot } from "@binance/connector"
import { UMFutures } from "@binance/futures-connector"
import { logger } from "@/lib/logger"
import { createClient } from "@supabase/supabase-js"

/**
 * Endpoint principal para TradingView Webhook
 * Procesa las señales de TradingView y ejecuta órdenes en Binance
 *
 * El payload debe contener:
 * - user_id: ID del usuario
 * - strategy_id: ID de la estrategia
 * - action: "buy" | "sell" | "long" | "short"
 * - close_position: boolean (opcional, solo para futures)
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    logger.info({ payload: data }, "[WEBHOOK] 📥 Webhook recibido")

    const { user_id, strategy_id, action, close_position } = data

    if (!user_id || !strategy_id || !action) {
      logger.warn("[WEBHOOK] ❌ Faltan campos requeridos en el payload")
      return NextResponse.json(
        {
          status: "error",
          message: "Se requiere user_id, strategy_id y action en el payload",
          log_summary: "Faltan campos requeridos: user_id, strategy_id o action",
        },
        { status: 400 },
      )
    }

    const validActions = ["buy", "sell", "long", "short"]
    if (!validActions.includes(action.toLowerCase())) {
      logger.warn("[WEBHOOK] ❌ Action inválido")
      return NextResponse.json(
        {
          status: "error",
          message: `Action debe ser uno de: ${validActions.join(", ")}`,
          log_summary: `Action inválido: ${action}`,
        },
        { status: 400 },
      )
    }

    const supabaseUrl = process.env.SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseUrl || !supabaseServiceKey) {
      logger.error("[WEBHOOK] ❌ Variables de entorno de Supabase no configuradas")
      return NextResponse.json(
        {
          status: "error",
          message: "Configuración de Supabase incompleta",
          log_summary: "Variables de entorno de Supabase no configuradas",
        },
        { status: 500 },
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: strategy, error: strategyError } = await supabase
      .from("strategies")
      .select("trading_pair, market_type, leverage, risk_type, risk_value, is_active, exchange_name")
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

    if (!strategy.is_active) {
      logger.warn("[WEBHOOK] ⚠️ Estrategia inactiva")
      return NextResponse.json(
        {
          status: "warning",
          message: "La estrategia está inactiva. Por favor, actívala desde el panel de control para continuar.",
          log_summary: "Estrategia inactiva - no se puede ejecutar",
        },
        { status: 403 },
      )
    }

    const normalizedAction = action.toLowerCase()
    if (strategy.market_type === "spot") {
      if (normalizedAction !== "buy" && normalizedAction !== "sell") {
        logger.warn("[WEBHOOK] ❌ Action incompatible con estrategia SPOT")
        return NextResponse.json(
          {
            status: "error",
            message: `Para estrategias SPOT solo se permiten acciones 'buy' o 'sell'. Recibido: '${action}'`,
            log_summary: `Action '${action}' incompatible con estrategia SPOT`,
          },
          { status: 400 },
        )
      }
    } else if (strategy.market_type === "futures") {
      if (normalizedAction !== "long" && normalizedAction !== "short") {
        logger.warn("[WEBHOOK] ❌ Action incompatible con estrategia FUTURES")
        return NextResponse.json(
          {
            status: "error",
            message: `Para estrategias FUTURES solo se permiten acciones 'long' o 'short'. Recibido: '${action}'`,
            log_summary: `Action '${action}' incompatible con estrategia FUTURES`,
          },
          { status: 400 },
        )
      }
    }

    const { data: exchange, error: exchangeError } = await supabase
      .from("exchanges")
      .select("api_key, api_secret, testnet")
      .eq("user_id", user_id)
      .eq("exchange_name", strategy.exchange_name)
      .single()

    if (exchangeError || !exchange) {
      logger.error({ error: exchangeError }, "[WEBHOOK] ❌ Error al obtener exchange")
      return NextResponse.json(
        {
          status: "error",
          message: `Exchange ${strategy.exchange_name} no configurado para este usuario`,
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

    console.log("[v0] API Key length:", exchange.api_key.length)
    console.log("[v0] API Secret length:", exchange.api_secret.length)
    console.log("[v0] Testnet mode:", exchange.testnet)
    console.log("[v0] Exchange name:", strategy.exchange_name)
    console.log("[v0] API Key primeros 10 chars:", exchange.api_key.substring(0, 10))
    console.log("[v0] API Secret primeros 10 chars:", exchange.api_secret.substring(0, 10))

    const binanceSymbol = strategy.trading_pair.replace("/", "")

    const completePayload: any = {
      symbol: binanceSymbol,
      action: action.toLowerCase(),
    }

    if (strategy.risk_type === "fixed_amount") {
      completePayload.usdt_amount = strategy.risk_value
    } else if (strategy.risk_type === "percentage") {
      completePayload.percentage = strategy.risk_value
    }

    if (strategy.market_type === "futures") {
      completePayload.leverage = strategy.leverage || 1
      completePayload.close_position = close_position !== undefined ? close_position : false
    }

    logger.info(
      {
        strategy: {
          trading_pair: strategy.trading_pair,
          binance_symbol: binanceSymbol,
          market_type: strategy.market_type,
          leverage: strategy.leverage,
          risk_type: strategy.risk_type,
          risk_value: strategy.risk_value,
        },
        completePayload,
      },
      "[WEBHOOK] 📦 Payload construido desde estrategia",
    )

    const spotTestnetBaseURL = "https://testnet.binance.vision"
    const futuresTestnetBaseURL = "https://testnet.binancefuture.com"
    const spotProductionBaseURL = "https://api.binance.com"
    const futuresProductionBaseURL = "https://fapi.binance.com"

    const isTestnet = exchange.testnet || false
    const apiKey = exchange.api_key
    const apiSecret = exchange.api_secret

    console.log("[v0] Usando testnet:", isTestnet)
    console.log("[v0] Base URL SPOT:", isTestnet ? spotTestnetBaseURL : spotProductionBaseURL)
    console.log("[v0] Base URL FUTURES:", isTestnet ? futuresTestnetBaseURL : futuresProductionBaseURL)

    const spotClient = new Spot(apiKey, apiSecret, {
      baseURL: isTestnet ? spotTestnetBaseURL : spotProductionBaseURL,
    })
    console.log("[v0] Cliente SPOT inicializado correctamente")

    const futuresClient = new UMFutures(apiKey, apiSecret, {
      baseURL: isTestnet ? futuresTestnetBaseURL : futuresProductionBaseURL,
    })
    console.log("[v0] Cliente FUTURES inicializado correctamente")

    console.log("[v0] Payload a validar:", JSON.stringify(completePayload, null, 2))

    console.log("[v0] Iniciando validación del payload...")
    const validator = new WebhookValidator(spotClient, futuresClient)

    let validationResult
    try {
      validationResult = await validator.validate(completePayload)
      console.log("[v0] Validación completada, resultado:", validationResult.valid ? "VÁLIDO" : "INVÁLIDO")
    } catch (error: any) {
      console.error("[v0] Error durante la validación:", error.message)
      console.error("[v0] Stack trace:", error.stack)
      throw error
    }

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
    const tradeAction = trade_data.action
    const symbol = trade_data.symbol
    const quantity = Number.parseFloat(trade_data.quantity)

    let order: any

    if (tradeAction === "buy" || tradeAction === "sell") {
      const side = tradeAction.toUpperCase() as "BUY" | "SELL"

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
    } else if (tradeAction === "long" || tradeAction === "short") {
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

    const response = NextResponse.json(
      {
        status: "success",
        message: `✅ Orden de tipo '${tradeAction.toUpperCase()}' ejecutada con éxito: acción=${tradeAction}, símbolo=${symbol}, cantidad=${quantity}.`,
        log_summary: `Orden ejecutada con éxito: acción=${tradeAction}, símbolo=${symbol}, cantidad=${quantity}. ${JSON.stringify(
          order,
        )}`,
      },
      { status: 200 },
    )

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

    errorResponse.headers.set("X-Frame-Options", "SAMEORIGIN")
    errorResponse.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
    errorResponse.headers.set(
      "Content-Security-Policy",
      "default-src 'none'; script-src 'self'; connect-src 'none'; img-src 'self'; style-src 'self'; frame-ancestors 'none'; form-action 'self';",
    )

    return errorResponse
  }
}

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
