/**
 * Validador de webhooks de TradingView
 * Valida y limpia los datos recibidos del webhook
 * Basado en la lógica del código Python original
 */

import type { Spot } from "@binance/connector"
import type { UMFutures } from "@binance/futures-connector"
import { logger } from "@/lib/logger"

interface WebhookData {
  symbol?: string
  action?: string
  quantity?: number | string
  qty?: number | string
  percentage?: number | string
  usdt_amount?: number | string
  price?: number | string
  leverage?: number | string
  close_position?: boolean
  side?: "BUY" | "SELL"
  [key: string]: any
}

interface ValidationResult {
  valid: boolean
  error?: string
  log_summary?: string
  clean_data?: {
    symbol: string
    action: string
    quantity: string
    side?: "BUY" | "SELL"
    positionSide?: "LONG" | "SHORT"
    price?: number
    leverage?: number
    close_position?: boolean
  }
}

interface SymbolInfo {
  symbol: string
  baseAsset: string
  quoteAsset: string
  filters: Array<{
    filterType: string
    [key: string]: any
  }>
  [key: string]: any
}

interface Metadata {
  symbol_info: SymbolInfo
  account_info?: any
  balances: Record<string, number>
}

export class WebhookValidator {
  private spotClient: Spot
  private futuresClient: UMFutures
  private adjustmentMsg: string | null = null

  constructor(spotClient: Spot, futuresClient: UMFutures) {
    this.spotClient = spotClient
    this.futuresClient = futuresClient
  }

  /**
   * Valida los datos del webhook y retorna datos limpios
   */
  async validate(data: WebhookData): Promise<ValidationResult> {
    logger.info({ payload: data }, "[VALIDATOR] 📥 Payload recibido")
    this.adjustmentMsg = null // Reiniciar mensaje de ajuste

    // Validar campos requeridos
    const requiredFields = ["symbol", "action"]
    const missing = requiredFields.filter((f) => !data[f])

    // Validar que al menos uno de los campos opcionales esté presente y con valor válido
    const percentage = Number.parseFloat(String(data.percentage || 0))
    const usdt_amount = Number.parseFloat(String(data.usdt_amount || 0))
    const optionalValid = "quantity" in data || "qty" in data || percentage > 0 || usdt_amount > 0

    // Casteo de datos (seguro porque ya validamos presencia)
    let symbol: string
    let action: string
    let leverage: number | undefined
    let price: number | undefined
    let close_position: boolean
    let quantity: number | undefined
    const validActions = new Set(["buy", "sell", "long", "short"])

    try {
      symbol = String(data.symbol || "")
        .toUpperCase()
        .trim()
      action = String(data.action || "")
        .toLowerCase()
        .trim()
      const invalidAction = "action" in data && !validActions.has(action)
      leverage = action === "long" || action === "short" ? Number.parseInt(String(data.leverage || 1)) : undefined
      price = "price" in data ? Number.parseFloat(String(data.price)) : undefined
      close_position = Boolean(data.close_position || false)
      quantity = "quantity" in data || "qty" in data ? Number.parseFloat(String(data.quantity || data.qty)) : undefined

      if (missing.length > 0 || !optionalValid || invalidAction) {
        const msgLines: string[] = []

        if (missing.length > 0) {
          msgLines.push(`❌ Campos faltantes: ${missing.join(", ")}\n`)
        }

        if (invalidAction) {
          msgLines.push(
            `❌ Acción inválida: '${data.action}'. Las acciones permitidas son: ${Array.from(validActions).join(
              ", ",
            )}\n`,
          )
        }

        msgLines.push(
          `❌ El payload debe tener el siguiente formato:

{
    'symbol': string<symbol>,
    'action': string<action>,
    'quantity': float<quantity> (opcional),
    'percentage': float<percentage> (opcional, valor entre 0 y 100),
    'usdt_amount': float<usdt_amount> (opcional),
    'close_position': bool<close_position>(opcional, solo requerido si action es 'long' o 'short', por defecto es False)
}

⚠️ Al menos uno de los campos opcionales 'quantity', 'percentage' o 'usdt_amount' debe estar presente.`,
        )

        const msg = msgLines.join("\n")
        logger.error({ error: msg }, "[VALIDATOR] Validación fallida")
        return { valid: false, error: msg, log_summary: msg }
      }
    } catch (error: any) {
      const msg = `❌ Error de tipo en los campos: ${error.message}`
      logger.error({ error: msg, originalError: error }, "[VALIDATOR] Error de tipo en campos")
      return { valid: false, error: msg, log_summary: msg }
    }

    logger.info({ action, symbol }, "[VALIDATOR] 🧪 Validando acción")

    let priceResult: number
    let metadata: Metadata

    try {
      const result = await this._getInfo(symbol, action, price, close_position)
      priceResult = result.price
      metadata = result.metadata
    } catch (error: any) {
      const msg = error.message || String(error)
      logger.error({ error: msg, originalError: error }, "[VALIDATOR] Error obteniendo info")
      return { valid: false, error: msg, log_summary: msg }
    }

    // Calcular quantity si viene percentage o usdt_amount
    if (percentage > 0 || usdt_amount > 0) {
      try {
        quantity = await this._calculateQuantity(metadata, percentage, usdt_amount, priceResult, action, close_position)
      } catch (error: any) {
        const msg = error.message || String(error)
        logger.error({ error: msg, originalError: error }, "[VALIDATOR] Error calculando quantity")
        return { valid: false, error: msg, log_summary: msg }
      }
    }

    if (quantity === undefined || quantity === null) {
      const msg = "❌ No se pudo determinar la cantidad a operar."
      logger.error({ error: msg }, "[VALIDATOR] Cantidad no determinada")
      return { valid: false, error: msg, log_summary: msg }
    }

    logger.info({ action, symbol, quantity }, "[VALIDATOR] 🧪 Acción validada con cantidad")

    try {
      if (action === "buy" || action === "sell") {
        return await this._validateSpot(symbol, action, quantity, priceResult, metadata.balances, metadata.symbol_info)
      } else if (action === "long" || action === "short") {
        return await this._validateFutures(
          symbol,
          action,
          quantity,
          priceResult,
          close_position,
          leverage || 1,
          metadata.balances,
          metadata.symbol_info,
        )
      }
    } catch (error: any) {
      const msg = `❌ Error en Validate ${
        action === "buy" || action === "sell" ? "SPOT" : "FUTURES"
      }: ${error.message || error}`
      logger.error({ error: msg, originalError: error, action }, "[VALIDATOR] Error en validación")
      return { valid: false, error: msg, log_summary: msg }
    }

    const msg = `❌ Acción '${action}' no reconocida`
    return { valid: false, error: msg, log_summary: msg }
  }

  private async _getSpotSymbolInfo(symbol: string): Promise<SymbolInfo | null> {
    try {
      const exchangeInfo = await this.spotClient.exchangeInfo()
      const symbols = exchangeInfo.data.symbols || []
      return symbols.find((s: any) => s.symbol === symbol) || null
    } catch (error) {
      return null
    }
  }

  private async _getPrice(symbol: string, action: string): Promise<number> {
    try {
      let ticker: any
      if (action === "buy" || action === "sell") {
        ticker = await this.spotClient.tickerPrice(symbol)
      } else {
        ticker = await this.futuresClient.tickerPrice(symbol)
      }

      const price = Number.parseFloat(ticker.data.price || ticker.data)
      if (!price || isNaN(price)) {
        throw new Error("Precio inválido")
      }
      return price
    } catch (error: any) {
      throw new Error(
        `❌ No se pudo obtener el precio para el símbolo '${symbol}' en el mercado '${action.toUpperCase()}'`,
      )
    }
  }

  private async _getInfo(
    symbol: string,
    action: string,
    price: number | undefined,
    close_position: boolean,
  ): Promise<{ price: number; metadata: Metadata }> {
    try {
      let symbolInfo: SymbolInfo | null
      let accountInfo: any
      let balances: Record<string, number>

      if (action === "buy" || action === "sell") {
        // ───── SPOT ─────
        try {
          accountInfo = await this.spotClient.account()
          const accountData = accountInfo.data || accountInfo
          balances = {}
          if (Array.isArray(accountData.balances)) {
            for (const b of accountData.balances) {
              balances[b.asset] = Number.parseFloat(b.free || 0)
            }
          }
        } catch (error: any) {
          throw new Error(`❌ Error al obtener información de cuenta SPOT: ${error.message}`)
        }

        try {
          symbolInfo = await this._getSpotSymbolInfo(symbol)
          if (!symbolInfo) {
            throw new Error()
          }
        } catch (error) {
          throw new Error(`❌ Símbolo '${symbol}' no existe o no se pudo obtener info en SPOT`)
        }

        // Validar fondos disponibles
        const assetRequired = action === "buy" ? symbolInfo.quoteAsset : symbolInfo.baseAsset
        const available = balances[assetRequired] || 0
        if (available === 0) {
          throw new Error(`❌ Fondos insuficientes en ${assetRequired}`)
        }
      } else if (action === "long" || action === "short") {
        // ───── FUTURES ─────
        try {
          accountInfo = await this.futuresClient.account()
          const exchangeInfo = await this.futuresClient.exchangeInfo()
          const symbols = exchangeInfo.data.symbols || []
          symbolInfo = symbols.find((s: any) => s.symbol === symbol) || null
          if (!symbolInfo) {
            throw new Error()
          }
        } catch (error: any) {
          throw new Error(`❌ Error al obtener info de cuenta o símbolo FUTURES: ${error.message}`)
        }

        if (close_position) {
          // En cierre de posición: obtener posición actual (posición abierta)
          try {
            const positions = await this.futuresClient.positionRisk({ symbol })
            const positionsData = Array.isArray(positions.data) ? positions.data : []
            const baseAsset = symbolInfo.baseAsset
            const positionData = positionsData.find((p: any) => p.symbol === symbol && p.positionSide === "BOTH")
            if (!positionData) {
              throw new Error(`❌ No se encontró posición abierta en ${symbol}`)
            }
            const positionAmt = Number.parseFloat(positionData.positionAmt || 0)
            if (positionAmt === 0) {
              throw new Error(`❌ No hay posición activa para cerrar en ${symbol}`)
            }
            balances = { [baseAsset]: Math.abs(positionAmt) }
          } catch (error: any) {
            throw new Error(`❌ Error al obtener posición abierta para cierre: ${error.message}`)
          }
        } else {
          // Para apertura de posición: usar balance de margen
          const accountData = accountInfo.data || accountInfo
          balances = {}
          if (Array.isArray(accountData.assets)) {
            for (const a of accountData.assets) {
              balances[a.asset] = Number.parseFloat(a.availableBalance || 0)
            }
          }
          const quoteAsset = symbolInfo.quoteAsset
          const available = balances[quoteAsset] || 0
          if (available === 0) {
            throw new Error(`❌ Fondos insuficientes en ${quoteAsset}`)
          }
        }
      } else {
        throw new Error(`❌ Acción '${action}' no reconocida para obtener info`)
      }

      // Obtener precio si no fue proporcionado
      if (price === undefined) {
        price = await this._getPrice(symbol, action)
      }

      const metadata: Metadata = {
        symbol_info: symbolInfo,
        account_info: accountInfo,
        balances,
      }

      return { price, metadata }
    } catch (error: any) {
      const msg = error.message || String(error)
      throw new Error(msg)
    }
  }

  private async _calculateQuantity(
    metadata: Metadata,
    percentage: number,
    usdt_amount: number,
    price: number,
    action: string,
    close_position: boolean,
  ): Promise<number> {
    const symbolInfo = metadata.symbol_info
    const balances = metadata.balances

    const baseAsset = symbolInfo.baseAsset
    const quoteAsset = symbolInfo.quoteAsset

    if (action === "buy" || action === "sell") {
      // SPOT: comportamiento estándar
      if (action === "buy") {
        const available = balances[quoteAsset] || 0
        const amountToUse = percentage > 0 ? (available * percentage) / 100 : usdt_amount
        return amountToUse / price
      } else {
        // "sell"
        const available = balances[baseAsset] || 0
        if (percentage > 0) {
          return (available * percentage) / 100
        } else if (usdt_amount > 0) {
          return usdt_amount / price
        } else {
          throw new Error("Debe especificarse porcentaje o usdt_amount para vender.")
        }
      }
    } else if (action === "long" || action === "short") {
      if (close_position) {
        // Estamos cerrando posición → vendemos base asset
        const available = balances[baseAsset] || 0
        if (percentage > 0) {
          return (available * percentage) / 100
        } else if (usdt_amount > 0) {
          return usdt_amount / price
        } else {
          throw new Error("Debe especificarse porcentaje o usdt_amount para cerrar posición.")
        }
      } else {
        // Estamos abriendo posición → usamos quote asset (ej: USDT)
        const available = balances[quoteAsset] || 0
        const amountToUse = percentage > 0 ? (available * percentage) / 100 : usdt_amount
        return amountToUse / price
      }
    } else {
      throw new Error(`Acción no soportada: ${action}`)
    }
  }

  private async _validateSpot(
    symbol: string,
    action: string,
    quantity: number,
    price: number,
    balances: Record<string, number>,
    symbolInfo: SymbolInfo,
  ): Promise<ValidationResult> {
    try {
      const errors: string[] = []

      const baseAsset = symbolInfo.baseAsset
      const quoteAsset = symbolInfo.quoteAsset
      const filters: Record<string, any> = {}
      if (Array.isArray(symbolInfo.filters)) {
        for (const f of symbolInfo.filters) {
          filters[f.filterType] = f
        }
      }

      const minQty = Number.parseFloat(filters["LOT_SIZE"]?.minQty || "0")
      const stepSize = Number.parseFloat(filters["LOT_SIZE"]?.stepSize || "0")

      // Truncar la cantidad al stepSize válido
      const originalQuantity = quantity
      const quantityStr = this._truncateQuantityToStep(quantity, stepSize)
      const truncatedQuantity = Number.parseFloat(quantityStr)

      if (truncatedQuantity !== originalQuantity) {
        logger.info(
          { originalQuantity, truncatedQuantity, stepSize },
          "[VALIDATOR] ⚠️ Cantidad ajustada según stepSize (SPOT)",
        )
        this.adjustmentMsg = `⚠️ Cantidad ajustada de ${originalQuantity} a ${truncatedQuantity} según stepSize de ${stepSize}.\n`
      } else {
        this.adjustmentMsg = null
      }

      const minNotional =
        Number.parseFloat(filters["MIN_NOTIONAL"]?.minNotional || "0") ||
        Number.parseFloat(filters["NOTIONAL"]?.minNotional || "0")

      logger.info({ minQty, stepSize, minNotional }, "[VALIDATOR] 📊 Reglas SPOT")

      // Validar cantidad mínima
      if (truncatedQuantity < minQty) {
        const minUsdtRequired = minQty * price
        const available = balances[action === "buy" ? quoteAsset : baseAsset] || 0
        if (available > 0) {
          const minPctRequired = (minUsdtRequired / available) * 100
          errors.push(
            `❌ La cantidad (${truncatedQuantity})${baseAsset} es menor al mínimo permitido (${minQty})${baseAsset}. Necesitás al menos ${minUsdtRequired.toFixed(
              2,
            )} ${quoteAsset}, equivalente a ~${minPctRequired.toFixed(
              2,
            )}% de tu balance disponible (${available.toFixed(2)} ${quoteAsset}).`,
          )
        } else {
          errors.push(
            `❌ La cantidad mínima para operar '${symbol}' es ${minQty}, equivalente a ${minUsdtRequired.toFixed(
              2,
            )} ${quoteAsset}, y no se detectó balance disponible.`,
          )
        }
      }

      // Validar múltiplos válidos
      const remainder = (truncatedQuantity - minQty) % stepSize
      if (remainder !== 0 && stepSize > 0) {
        errors.push(`❌ La cantidad '${truncatedQuantity}'${baseAsset} no es múltiplo válido de ${stepSize}`)
      }

      const notional = truncatedQuantity * price

      // Validar notional mínimo
      if (minNotional > 0 && notional < minNotional) {
        errors.push(
          `❌ Valor total de la orden (${notional.toFixed(2)}) menor al mínimo requerido (${minNotional.toFixed(2)})`,
        )
      }

      // Validar fondos
      if (action === "buy") {
        const available = balances[quoteAsset] || 0
        if (available < notional) {
          errors.push(
            `❌ Fondos insuficientes en ${quoteAsset}: se requieren ${notional.toFixed(
              2,
            )}, disponibles ${available.toFixed(2)}`,
          )
        }
      } else {
        const available = balances[baseAsset] || 0
        if (available < truncatedQuantity) {
          errors.push(
            `❌ Fondos insuficientes en ${baseAsset}: se requieren ${truncatedQuantity.toFixed(
              8,
            )}, disponibles ${available.toFixed(8)}`,
          )
        }
      }

      // Si hay errores, retornarlos
      if (errors.length > 0) {
        const errorMsg = errors.join("\n")
        logger.warn({ errors: errorMsg }, "[VALIDATOR] Errores de validación SPOT")
        return { valid: false, error: errorMsg, log_summary: errorMsg }
      }

      const summary = `${
        this.adjustmentMsg || ""
      }✅ SPOT: ${action.toUpperCase()} ${truncatedQuantity} ${baseAsset} a ${price} ${quoteAsset}`
      logger.info(
        {
          summary,
          action,
          quantity: truncatedQuantity,
          baseAsset,
          price,
          quoteAsset,
        },
        "[VALIDATOR] ✅ SPOT validado",
      )

      return {
        valid: true,
        clean_data: {
          symbol,
          action,
          quantity: quantityStr,
          price,
        },
        log_summary: summary,
      }
    } catch (error: any) {
      const msg = `❌ Error al validar SPOT: ${error.message || error}`
      logger.error({ error: msg, originalError: error }, "[VALIDATOR] Error validando SPOT")
      return { valid: false, error: msg, log_summary: msg }
    }
  }

  private async _validateFutures(
    symbol: string,
    action: string,
    quantity: number,
    price: number,
    close_position: boolean,
    leverage: number,
    balances: Record<string, number>,
    symbolInfo: SymbolInfo,
  ): Promise<ValidationResult> {
    try {
      const errors: string[] = []

      const baseAsset = symbolInfo.baseAsset
      const quoteAsset = symbolInfo.quoteAsset
      const filters: Record<string, any> = {}
      if (Array.isArray(symbolInfo.filters)) {
        for (const f of symbolInfo.filters) {
          filters[f.filterType] = f
        }
      }

      // ─────────────────────────────────────────────
      // 🔁 Truncamiento de cantidad según stepSize
      // ─────────────────────────────────────────────
      const stepSize = Number.parseFloat(filters["LOT_SIZE"]?.stepSize || "0")
      const minQty = Number.parseFloat(filters["LOT_SIZE"]?.minQty || "0")
      const maxQty = Number.parseFloat(filters["LOT_SIZE"]?.maxQty || "0")

      const originalQuantity = quantity
      const quantityStr = this._truncateQuantityToStep(quantity, stepSize)
      const truncatedQuantity = Number.parseFloat(quantityStr)

      if (truncatedQuantity !== originalQuantity) {
        logger.info(
          { originalQuantity, truncatedQuantity, stepSize },
          "[VALIDATOR] ⚠️ Cantidad ajustada según stepSize (FUTURES)",
        )
        this.adjustmentMsg = `⚠️ Cantidad ajustada de ${originalQuantity} a ${truncatedQuantity} según stepSize de ${stepSize}.\n`
      } else {
        this.adjustmentMsg = null
      }

      // ─────────────────────────────────────────────
      // ✅ Validaciones básicas post-truncamiento
      // ─────────────────────────────────────────────
      if (truncatedQuantity < minQty) {
        errors.push(`❌ La cantidad (${truncatedQuantity}) es menor al mínimo permitido (${minQty})`)
      }
      if (truncatedQuantity > maxQty) {
        errors.push(`❌ La cantidad (${truncatedQuantity}) excede el máximo permitido (${maxQty})`)
      }

      // ─────────────────────────────────────────────
      // ➕ Lógica de apertura o cierre de posición
      // ─────────────────────────────────────────────
      const sideResult = this._determineOrderSide(action, close_position)
      if (!sideResult.side || !sideResult.positionSide) {
        errors.push(`❌ Acción '${action}' no reconocida.`)
        return {
          valid: false,
          error: errors.join("\n"),
          log_summary: errors.join("\n"),
        }
      }

      if (close_position) {
        const closeErrors = await this._validateClosePosition(symbol, sideResult.positionSide, truncatedQuantity)
        errors.push(...closeErrors)
      } else {
        const openErrors = await this._validateOpenPosition(
          filters,
          price,
          truncatedQuantity,
          leverage,
          balances[quoteAsset] || 0,
          quoteAsset,
          symbol,
          symbolInfo,
        )
        errors.push(...openErrors)
      }

      // ─────────────────────────────────────────────
      // ❌ Retornar si hubo errores
      // ─────────────────────────────────────────────
      if (errors.length > 0) {
        const errorMsg = errors.join("\n")
        logger.warn({ errors: errorMsg }, "[VALIDATOR] Errores de validación FUTURES")
        return { valid: false, error: errorMsg, log_summary: errorMsg }
      }

      // ─────────────────────────────────────────────
      // ✅ Resumen exitoso
      // ─────────────────────────────────────────────
      const summary = `${
        this.adjustmentMsg || ""
      }✅ FUTURES: ${action.toUpperCase()} ${truncatedQuantity} ${symbol} x${leverage} a ${price} ${quoteAsset}`
      logger.info(
        {
          summary,
          action,
          quantity: truncatedQuantity,
          symbol,
          leverage,
          price,
          quoteAsset,
        },
        "[VALIDATOR] ✅ FUTURES validado",
      )

      return {
        valid: true,
        clean_data: {
          symbol,
          action,
          side: sideResult.side,
          positionSide: sideResult.positionSide,
          quantity: quantityStr,
          price,
          leverage,
          close_position,
        },
        log_summary: summary,
      }
    } catch (error: any) {
      const msg = `❌ Error inesperado en la validación de FUTURES: ${error.message || error}`
      logger.error({ error: msg, originalError: error }, "[VALIDATOR] Error validando FUTURES")
      return { valid: false, error: msg, log_summary: msg }
    }
  }

  private _determineOrderSide(
    action: string,
    close_position: boolean,
  ): { side: "BUY" | "SELL" | null; positionSide: "LONG" | "SHORT" | null } {
    if (close_position) {
      if (action === "long") {
        return { side: "SELL", positionSide: "LONG" }
      } else if (action === "short") {
        return { side: "BUY", positionSide: "SHORT" }
      }
    } else {
      if (action === "long") {
        return { side: "BUY", positionSide: "LONG" }
      } else if (action === "short") {
        return { side: "SELL", positionSide: "SHORT" }
      }
    }
    return { side: null, positionSide: null }
  }

  private async _validateClosePosition(
    symbol: string,
    positionSide: "LONG" | "SHORT",
    quantity: number,
  ): Promise<string[]> {
    const errors: string[] = []
    try {
      const positions = await this.futuresClient.positionRisk({ symbol })
      const positionsData = Array.isArray(positions.data) ? positions.data : []
      let positionAmt = 0.0

      for (const pos of positionsData) {
        if (pos.symbol === symbol && pos.positionSide === "BOTH") {
          positionAmt = Number.parseFloat(pos.positionAmt || 0)
          break
        }
      }

      if (positionAmt > 0) {
        // Posición LONG
        if (quantity > positionAmt) {
          errors.push(
            `❌ Fondos insuficientes para cerrar la posición LONG: se requieren ${quantity.toFixed(
              8,
            )}, disponibles ${positionAmt.toFixed(8)}`,
          )
        }
      } else if (positionAmt < 0) {
        // Posición SHORT
        if (quantity > Math.abs(positionAmt)) {
          errors.push(
            `❌ Fondos insuficientes para cerrar la posición SHORT: se requieren ${quantity.toFixed(
              8,
            )}, disponibles ${Math.abs(positionAmt).toFixed(8)}`,
          )
        }
      } else {
        errors.push("❌ No hay posición abierta para cerrar.")
      }
    } catch (error: any) {
      errors.push(`❌ Error al validar cierre de posición: ${error.message || error}`)
    }
    return errors
  }

  private async _validateOpenPosition(
    filters: Record<string, any>,
    price: number,
    quantity: number,
    leverage: number,
    available: number,
    quoteAsset: string,
    symbol: string,
    symbolInfo: SymbolInfo,
  ): Promise<string[]> {
    const errors: string[] = []

    // Validar PRICE_FILTER
    if ("PRICE_FILTER" in filters) {
      const tickSize = Number.parseFloat(filters["PRICE_FILTER"].tickSize || "0")
      const minPrice = Number.parseFloat(filters["PRICE_FILTER"].minPrice || "0")
      const maxPrice = Number.parseFloat(filters["PRICE_FILTER"].maxPrice || "0")

      const pricePrecision = Math.max(0, Math.round(-Math.log10(tickSize || 0.00000001)))
      const roundedPrice = Number.parseFloat(price.toFixed(pricePrecision))

      if ((minPrice > 0 && roundedPrice < minPrice) || (maxPrice > 0 && roundedPrice > maxPrice)) {
        errors.push(`❌ El precio ${roundedPrice} está fuera de los límites permitidos (${minPrice} - ${maxPrice}).`)
      }
    }

    const notional = quantity * price
    logger.info({ leverage, price, notional }, "[VALIDATOR] 📊 FUTURES — leverage, precio, notional")

    // Validar NOTIONAL mínimo
    const minNotional =
      Number.parseFloat(filters["MIN_NOTIONAL"]?.notional || "0") ||
      Number.parseFloat(filters["MIN_NOTIONAL"]?.minNotional || "0") ||
      Number.parseFloat(filters["NOTIONAL"]?.notional || "0") ||
      Number.parseFloat(filters["NOTIONAL"]?.minNotional || "0")

    if (minNotional > 0 && notional < minNotional) {
      errors.push(
        `❌ El valor total de la orden (${notional.toFixed(
          2,
        )} ${quoteAsset}) es menor al mínimo permitido (${minNotional.toFixed(2)} ${quoteAsset}).`,
      )
    }

    // Validar margen suficiente
    const requiredMargin = notional / leverage
    if (available < requiredMargin) {
      errors.push(
        `❌ Fondos insuficientes para abrir posición con x${leverage}. Se requieren ${requiredMargin.toFixed(
          2,
        )} ${quoteAsset}, disponibles ${available.toFixed(2)} ${quoteAsset}.`,
      )
    }

    // Establecer apalancamiento
    try {
      await this.futuresClient.changeLeverage({
        symbol,
        leverage,
      })
    } catch (error: any) {
      logger.warn(
        { error: error.message || error, originalError: error },
        "[VALIDATOR] ⚠️ No se pudo establecer apalancamiento",
      )
    }

    return errors
  }

  private _truncateQuantityToStep(quantity: number, stepSize: number): string {
    if (stepSize <= 0) {
      return quantity.toString()
    }

    const precision = Math.max(0, Math.round(-Math.log10(stepSize)))
    const stepDecimal = Math.floor(quantity / stepSize)
    const truncated = stepDecimal * stepSize
    return truncated.toFixed(precision)
  }
}
