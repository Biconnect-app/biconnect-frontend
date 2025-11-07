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
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    logger.info({ payload: data }, "[WEBHOOK] 📥 Webhook recibido")

    const { user_id, strategy_id } = data

    if (!user_id || !strategy_id) {
      logger.warn("[WEBHOOK] ❌ Faltan campos requeridos en el payload")
      return NextResponse.json(
        {
          status: "error",
          message: "Se requiere user_id y strategy_id en el payload",
          log_summary: "Faltan campos requeridos: user_id o strategy_id",
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

    const completePayload = {
      symbol: strategy.trading_pair,
      action: determineAction(strategy.market_type, strategy.risk_type),
      quantity: calculateQuantity(strategy.risk_type, strategy.risk_value),
      leverage: strategy.leverage,
    }

    logger.info(
      {
        strategy: {
          trading_pair: strategy.trading_pair,
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

    const spotClient = new Spot(apiKey, apiSecret, {
      baseURL: isTestnet ? spotTestnetBaseURL : spotProductionBaseURL,
    })
    const futuresClient = new UMFutures(apiKey, apiSecret, {
      baseURL: isTestnet ? futuresTestnetBaseURL : futuresProductionBaseURL,
    })

    // Validar datos completos del webhook
    const validator = new WebhookValidator(spotClient, futuresClient)
    const validationResult = await validator.validate(completePayload)

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

    // ──────────────────────────────────────────────
    // Ejecución en SPOT
    // ──────────────────────────────────────────────
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
    }
    // ──────────────────────────────────────────────
    // Ejecución en FUTURES
    // ──────────────────────────────────────────────
    else if (tradeAction === "long" || tradeAction === "short") {
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
        message: `✅ Orden de tipo '${tradeAction.toUpperCase()}' ejecutada con éxito: acción=${tradeAction}, símbolo=${symbol}, cantidad=${quantity}.`,
        log_summary: `Orden ejecutada con éxito: acción=${tradeAction}, símbolo=${symbol}, cantidad=${quantity}. ${JSON.stringify(
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

function determineAction(market_type: string, risk_type: string): string {
  // Determinar la acción basada en market_type
  // Esto debe adaptarse a tu lógica de negocio
  if (market_type === "spot") {
    return "buy" // o "sell" según tu lógica
  } else if (market_type === "futures") {
    return "long" // o "short" según tu lógica
  }
  return "buy"
}

function calculateQuantity(risk_type: string, risk_value: number): string {
  // Calcular la cantidad basada en risk_type y risk_value
  // Esto debe adaptarse a tu lógica de negocio
  if (risk_type === "fixed") {
    return risk_value.toString()
  } else if (risk_type === "percentage") {
    // Aquí necesitarías el balance para calcular el porcentaje
    // Por ahora retornamos el valor directamente
    return risk_value.toString()
  }
  return risk_value.toString()
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
