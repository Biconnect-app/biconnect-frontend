"""
Validador de webhooks de TradingView
Valida y limpia los datos recibidos del webhook
Basado en la lógica del código TypeScript/Python original
"""

from typing import Dict, Any, Optional, List, Tuple
from binance.spot import Spot
from binance.um_futures import UMFutures
from api.services.logger import logger
import math

class WebhookValidator:
    """
    Clase para validar payloads de webhook de TradingView
    Verifica fondos, límites de Binance y calcula cantidades
    """
    
    def __init__(self, spot_client: Spot, futures_client: UMFutures):
        self.spot_client = spot_client
        self.futures_client = futures_client
        self.adjustment_msg: Optional[str] = None
    
    async def validate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Valida los datos del webhook y retorna datos limpios"""
        logger.info("📥 Payload recibido", payload=data)
        self.adjustment_msg = None  # Reiniciar mensaje de ajuste
        
        # Validar campos requeridos
        required_fields = ["symbol", "action"]
        missing = [f for f in required_fields if f not in data]
        
        # Validar que al menos uno de los campos opcionales esté presente
        percentage = float(data.get("percentage", 0))
        usdt_amount = float(data.get("usdt_amount", 0))
        optional_valid = "quantity" in data or "qty" in data or percentage > 0 or usdt_amount > 0
        
        # Casteo de datos
        try:
            symbol = str(data.get("symbol", "")).upper().strip()
            action = str(data.get("action", "")).lower().strip()
            valid_actions = {"buy", "sell", "long", "short"}
            invalid_action = "action" in data and action not in valid_actions
            
            leverage = int(data.get("leverage", 1)) if action in ["long", "short"] else None
            price = float(data.get("price")) if "price" in data else None
            close_position = bool(data.get("close_position", False))
            quantity = float(data.get("quantity") or data.get("qty", 0)) if "quantity" in data or "qty" in data else None
            
            if missing or not optional_valid or invalid_action:
                msg_lines = []
                
                if missing:
                    msg_lines.append(f"❌ Campos faltantes: {', '.join(missing)}\n")
                
                if invalid_action:
                    msg_lines.append(
                        f"❌ Acción inválida: '{data.get('action')}'. "
                        f"Las acciones permitidas son: {', '.join(valid_actions)}\n"
                    )
                
                msg_lines.append(
                    "❌ El payload debe tener el siguiente formato:\n\n"
                    "{\n"
                    "    'symbol': string<symbol>,\n"
                    "    'action': string<action>,\n"
                    "    'quantity': float<quantity> (opcional),\n"
                    "    'percentage': float<percentage> (opcional, valor entre 0 y 100),\n"
                    "    'usdt_amount': float<usdt_amount> (opcional),\n"
                    "    'close_position': bool<close_position> (opcional, solo requerido si action es 'long' o 'short', por defecto es False)\n"
                    "}\n\n"
                    "⚠️ Al menos uno de los campos opcionales 'quantity', 'percentage' o 'usdt_amount' debe estar presente."
                )
                
                msg = "\n".join(msg_lines)
                logger.error("Validación fallida", error=msg)
                return {"valid": False, "error": msg, "log_summary": msg}
        
        except Exception as e:
            msg = f"❌ Error de tipo en los campos: {str(e)}"
            logger.error("Error de tipo en campos", error=msg, exception=str(e))
            return {"valid": False, "error": msg, "log_summary": msg}
        
        logger.info("🧪 Validando acción", action=action, symbol=symbol)
        
        # Obtener información del símbolo y precio
        try:
            price_result, metadata = await self._get_info(symbol, action, price, close_position)
        except Exception as e:
            msg = str(e)
            logger.error("Error obteniendo info", error=msg, exception=str(e))
            return {"valid": False, "error": msg, "log_summary": msg}
        
        # Calcular quantity si viene percentage o usdt_amount
        if percentage > 0 or usdt_amount > 0:
            try:
                quantity = await self._calculate_quantity(
                    metadata, percentage, usdt_amount, price_result, action, close_position
                )
            except Exception as e:
                msg = str(e)
                logger.error("Error calculando quantity", error=msg, exception=str(e))
                return {"valid": False, "error": msg, "log_summary": msg}
        
        if quantity is None or quantity == 0:
            msg = "❌ No se pudo determinar la cantidad a operar."
            logger.error("Cantidad no determinada", error=msg)
            return {"valid": False, "error": msg, "log_summary": msg}
        
        logger.info("🧪 Acción validada con cantidad", action=action, symbol=symbol, quantity=quantity)
        
        # Validar según tipo de mercado
        try:
            if action in ["buy", "sell"]:
                return await self._validate_spot(
                    symbol, action, quantity, price_result,
                    metadata["balances"], metadata["symbol_info"]
                )
            elif action in ["long", "short"]:
                return await self._validate_futures(
                    symbol, action, quantity, price_result, close_position,
                    leverage or 1, metadata["balances"], metadata["symbol_info"]
                )
        except Exception as e:
            market_type = "SPOT" if action in ["buy", "sell"] else "FUTURES"
            msg = f"❌ Error en Validate {market_type}: {str(e)}"
            logger.error(f"Error en validación {market_type}", error=msg, exception=str(e), action=action)
            return {"valid": False, "error": msg, "log_summary": msg}
        
        msg = f"❌ Acción '{action}' no reconocida"
        return {"valid": False, "error": msg, "log_summary": msg}
    
    async def _get_spot_symbol_info(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Obtiene información del símbolo en SPOT"""
        try:
            exchange_info = self.spot_client.exchange_info()
            symbols = exchange_info.get("symbols", [])
            return next((s for s in symbols if s["symbol"] == symbol), None)
        except Exception:
            return None
    
    async def _get_price(self, symbol: str, action: str) -> float:
        """Obtiene el precio actual del símbolo"""
        try:
            if action in ["buy", "sell"]:
                ticker = self.spot_client.ticker_price(symbol)
            else:
                ticker = self.futures_client.ticker_price(symbol)
            
            price = float(ticker.get("price", ticker))
            if not price or math.isnan(price):
                raise ValueError("Precio inválido")
            return price
        except Exception as e:
            raise Exception(
                f"❌ No se pudo obtener el precio para el símbolo '{symbol}' "
                f"en el mercado '{action.upper()}'"
            )
    
    async def _get_info(
        self, symbol: str, action: str, price: Optional[float], close_position: bool
    ) -> Tuple[float, Dict[str, Any]]:
        """Obtiene información del símbolo, cuenta y precio"""
        try:
            symbol_info = None
            account_info = None
            balances = {}
            
            if action in ["buy", "sell"]:
                # ───── SPOT ─────
                try:
                    account_info = self.spot_client.account()
                    balances = {}
                    for b in account_info.get("balances", []):
                        balances[b["asset"]] = float(b.get("free", 0))
                except Exception as e:
                    raise Exception(f"❌ Error al obtener información de cuenta SPOT: {str(e)}")
                
                try:
                    symbol_info = await self._get_spot_symbol_info(symbol)
                    if not symbol_info:
                        raise Exception()
                except Exception:
                    raise Exception(f"❌ Símbolo '{symbol}' no existe o no se pudo obtener info en SPOT")
                
                # Validar fondos disponibles
                asset_required = symbol_info["quoteAsset"] if action == "buy" else symbol_info["baseAsset"]
                available = balances.get(asset_required, 0)
                if available == 0:
                    raise Exception(f"❌ Fondos insuficientes en {asset_required}")
            
            elif action in ["long", "short"]:
                # ───── FUTURES ─────
                try:
                    account_info = self.futures_client.account()
                    exchange_info = self.futures_client.exchange_info()
                    symbols = exchange_info.get("symbols", [])
                    symbol_info = next((s for s in symbols if s["symbol"] == symbol), None)
                    if not symbol_info:
                        raise Exception()
                except Exception as e:
                    raise Exception(f"❌ Error al obtener info de cuenta o símbolo FUTURES: {str(e)}")
                
                if close_position:
                    # Obtener posición actual
                    try:
                        positions = self.futures_client.get_position_risk(symbol=symbol)
                        base_asset = symbol_info["baseAsset"]
                        position_data = next(
                            (p for p in positions if p["symbol"] == symbol and p["positionSide"] == "BOTH"),
                            None
                        )
                        if not position_data:
                            raise Exception(f"❌ No se encontró posición abierta en {symbol}")
                        
                        position_amt = float(position_data.get("positionAmt", 0))
                        if position_amt == 0:
                            raise Exception(f"❌ No hay posición activa para cerrar en {symbol}")
                        
                        balances = {base_asset: abs(position_amt)}
                    except Exception as e:
                        raise Exception(f"❌ Error al obtener posición abierta para cierre: {str(e)}")
                else:
                    # Para apertura de posición: usar balance de margen
                    balances = {}
                    for a in account_info.get("assets", []):
                        balances[a["asset"]] = float(a.get("availableBalance", 0))
                    
                    quote_asset = symbol_info["quoteAsset"]
                    available = balances.get(quote_asset, 0)
                    if available == 0:
                        raise Exception(f"❌ Fondos insuficientes en {quote_asset}")
            else:
                raise Exception(f"❌ Acción '{action}' no reconocida para obtener info")
            
            # Obtener precio si no fue proporcionado
            if price is None:
                price = await self._get_price(symbol, action)
            
            metadata = {
                "symbol_info": symbol_info,
                "account_info": account_info,
                "balances": balances
            }
            
            return price, metadata
        
        except Exception as e:
            raise Exception(str(e))
    
    async def _calculate_quantity(
        self, metadata: Dict[str, Any], percentage: float, usdt_amount: float,
        price: float, action: str, close_position: bool
    ) -> float:
        """Calcula la cantidad a operar según porcentaje o monto USDT"""
        symbol_info = metadata["symbol_info"]
        balances = metadata["balances"]
        
        base_asset = symbol_info["baseAsset"]
        quote_asset = symbol_info["quoteAsset"]
        
        if action in ["buy", "sell"]:
            # SPOT
            if action == "buy":
                available = balances.get(quote_asset, 0)
                amount_to_use = (available * percentage / 100) if percentage > 0 else usdt_amount
                return amount_to_use / price
            else:  # sell
                available = balances.get(base_asset, 0)
                if percentage > 0:
                    return available * percentage / 100
                elif usdt_amount > 0:
                    return usdt_amount / price
                else:
                    raise Exception("Debe especificarse porcentaje o usdt_amount para vender.")
        
        elif action in ["long", "short"]:
            if close_position:
                # Cerrando posición
                available = balances.get(base_asset, 0)
                if percentage > 0:
                    return available * percentage / 100
                elif usdt_amount > 0:
                    return usdt_amount / price
                else:
                    raise Exception("Debe especificarse porcentaje o usdt_amount para cerrar posición.")
            else:
                # Abriendo posición
                available = balances.get(quote_asset, 0)
                amount_to_use = (available * percentage / 100) if percentage > 0 else usdt_amount
                return amount_to_use / price
        else:
            raise Exception(f"Acción no soportada: {action}")
    
    async def _validate_spot(
        self, symbol: str, action: str, quantity: float, price: float,
        balances: Dict[str, float], symbol_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Valida una orden SPOT"""
        try:
            errors = []
            
            base_asset = symbol_info["baseAsset"]
            quote_asset = symbol_info["quoteAsset"]
            filters = {f["filterType"]: f for f in symbol_info.get("filters", [])}
            
            min_qty = float(filters.get("LOT_SIZE", {}).get("minQty", 0))
            step_size = float(filters.get("LOT_SIZE", {}).get("stepSize", 0))
            
            # Truncar cantidad según stepSize
            original_quantity = quantity
            quantity_str = self._truncate_quantity_to_step(quantity, step_size)
            truncated_quantity = float(quantity_str)
            
            if truncated_quantity != original_quantity:
                logger.info(
                    "⚠️ Cantidad ajustada según stepSize (SPOT)",
                    original=original_quantity, truncated=truncated_quantity, step_size=step_size
                )
                self.adjustment_msg = (
                    f"⚠️ Cantidad ajustada de {original_quantity} a {truncated_quantity} "
                    f"según stepSize de {step_size}.\n"
                )
            else:
                self.adjustment_msg = None
            
            min_notional = float(
                filters.get("MIN_NOTIONAL", {}).get("minNotional", 0) or
                filters.get("NOTIONAL", {}).get("minNotional", 0)
            )
            
            logger.info("📊 Reglas SPOT", min_qty=min_qty, step_size=step_size, min_notional=min_notional)
            
            # Validar cantidad mínima
            if truncated_quantity < min_qty:
                min_usdt_required = min_qty * price
                available = balances.get(quote_asset if action == "buy" else base_asset, 0)
                if available > 0:
                    min_pct_required = (min_usdt_required / available) * 100
                    errors.append(
                        f"❌ La cantidad ({truncated_quantity}){base_asset} es menor al mínimo permitido "
                        f"({min_qty}){base_asset}. Necesitás al menos {min_usdt_required:.2f} {quote_asset}, "
                        f"equivalente a ~{min_pct_required:.2f}% de tu balance disponible "
                        f"({available:.2f} {quote_asset})."
                    )
                else:
                    errors.append(
                        f"❌ La cantidad mínima para operar '{symbol}' es {min_qty}, "
                        f"equivalente a {min_usdt_required:.2f} {quote_asset}, "
                        f"y no se detectó balance disponible."
                    )
            
            notional = truncated_quantity * price
            
            # Validar notional mínimo
            if min_notional > 0 and notional < min_notional:
                errors.append(
                    f"❌ Valor total de la orden ({notional:.2f}) menor al mínimo requerido ({min_notional:.2f})"
                )
            
            # Validar fondos
            if action == "buy":
                available = balances.get(quote_asset, 0)
                if available < notional:
                    errors.append(
                        f"❌ Fondos insuficientes en {quote_asset}: "
                        f"se requieren {notional:.2f}, disponibles {available:.2f}"
                    )
            else:
                available = balances.get(base_asset, 0)
                if available < truncated_quantity:
                    errors.append(
                        f"❌ Fondos insuficientes en {base_asset}: "
                        f"se requieren {truncated_quantity:.8f}, disponibles {available:.8f}"
                    )
            
            # Retornar errores si los hay
            if errors:
                error_msg = "\n".join(errors)
                logger.warning("Errores de validación SPOT", errors=error_msg)
                return {"valid": False, "error": error_msg, "log_summary": error_msg}
            
            summary = (
                f"{self.adjustment_msg or ''}"
                f"✅ SPOT: {action.upper()} {truncated_quantity} {base_asset} a {price} {quote_asset}"
            )
            logger.info(
                "✅ SPOT validado",
                summary=summary, action=action, quantity=truncated_quantity,
                base_asset=base_asset, price=price, quote_asset=quote_asset
            )
            
            return {
                "valid": True,
                "clean_data": {
                    "symbol": symbol,
                    "action": action,
                    "quantity": quantity_str,
                    "price": price
                },
                "log_summary": summary
            }
        
        except Exception as e:
            msg = f"❌ Error al validar SPOT: {str(e)}"
            logger.error("Error validando SPOT", error=msg, exception=str(e))
            return {"valid": False, "error": msg, "log_summary": msg}
    
    async def _validate_futures(
        self, symbol: str, action: str, quantity: float, price: float,
        close_position: bool, leverage: int, balances: Dict[str, float],
        symbol_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Valida una orden FUTURES"""
        try:
            errors = []
            
            base_asset = symbol_info["baseAsset"]
            quote_asset = symbol_info["quoteAsset"]
            filters = {f["filterType"]: f for f in symbol_info.get("filters", [])}
            
            # Truncar cantidad según stepSize
            step_size = float(filters.get("LOT_SIZE", {}).get("stepSize", 0))
            min_qty = float(filters.get("LOT_SIZE", {}).get("minQty", 0))
            max_qty = float(filters.get("LOT_SIZE", {}).get("maxQty", 0))
            
            original_quantity = quantity
            quantity_str = self._truncate_quantity_to_step(quantity, step_size)
            truncated_quantity = float(quantity_str)
            
            if truncated_quantity != original_quantity:
                logger.info(
                    "⚠️ Cantidad ajustada según stepSize (FUTURES)",
                    original=original_quantity, truncated=truncated_quantity, step_size=step_size
                )
                self.adjustment_msg = (
                    f"⚠️ Cantidad ajustada de {original_quantity} a {truncated_quantity} "
                    f"según stepSize de {step_size}.\n"
                )
            else:
                self.adjustment_msg = None
            
            # Validaciones básicas
            if truncated_quantity < min_qty:
                errors.append(f"❌ La cantidad ({truncated_quantity}) es menor al mínimo permitido ({min_qty})")
            if truncated_quantity > max_qty:
                errors.append(f"❌ La cantidad ({truncated_quantity}) excede el máximo permitido ({max_qty})")
            
            # Determinar side y positionSide
            side_result = self._determine_order_side(action, close_position)
            if not side_result["side"] or not side_result["positionSide"]:
                errors.append(f"❌ Acción '{action}' no reconocida.")
                return {
                    "valid": False,
                    "error": "\n".join(errors),
                    "log_summary": "\n".join(errors)
                }
            
            # Validar cierre o apertura de posición
            if close_position:
                close_errors = await self._validate_close_position(
                    symbol, side_result["positionSide"], truncated_quantity
                )
                errors.extend(close_errors)
            else:
                open_errors = await self._validate_open_position(
                    filters, price, truncated_quantity, leverage,
                    balances.get(quote_asset, 0), quote_asset, symbol, symbol_info
                )
                errors.extend(open_errors)
            
            # Retornar errores si los hay
            if errors:
                error_msg = "\n".join(errors)
                logger.warning("Errores de validación FUTURES", errors=error_msg)
                return {"valid": False, "error": error_msg, "log_summary": error_msg}
            
            summary = (
                f"{self.adjustment_msg or ''}"
                f"✅ FUTURES: {action.upper()} {truncated_quantity} {symbol} "
                f"x{leverage} a {price} {quote_asset}"
            )
            logger.info(
                "✅ FUTURES validado",
                summary=summary, action=action, quantity=truncated_quantity,
                symbol=symbol, leverage=leverage, price=price, quote_asset=quote_asset
            )
            
            return {
                "valid": True,
                "clean_data": {
                    "symbol": symbol,
                    "action": action,
                    "side": side_result["side"],
                    "positionSide": side_result["positionSide"],
                    "quantity": quantity_str,
                    "price": price,
                    "leverage": leverage,
                    "close_position": close_position
                },
                "log_summary": summary
            }
        
        except Exception as e:
            msg = f"❌ Error inesperado en la validación de FUTURES: {str(e)}"
            logger.error("Error validando FUTURES", error=msg, exception=str(e))
            return {"valid": False, "error": msg, "log_summary": msg}
    
    def _determine_order_side(
        self, action: str, close_position: bool
    ) -> Dict[str, Optional[str]]:
        """Determina el side y positionSide según la acción"""
        if close_position:
            if action == "long":
                return {"side": "SELL", "positionSide": "LONG"}
            elif action == "short":
                return {"side": "BUY", "positionSide": "SHORT"}
        else:
            if action == "long":
                return {"side": "BUY", "positionSide": "LONG"}
            elif action == "short":
                return {"side": "SELL", "positionSide": "SHORT"}
        return {"side": None, "positionSide": None}
    
    async def _validate_close_position(
        self, symbol: str, position_side: str, quantity: float
    ) -> List[str]:
        """Valida el cierre de una posición"""
        errors = []
        try:
            positions = self.futures_client.get_position_risk(symbol=symbol)
            position_amt = 0.0
            
            for pos in positions:
                if pos["symbol"] == symbol and pos["positionSide"] == "BOTH":
                    position_amt = float(pos.get("positionAmt", 0))
                    break
            
            if position_amt > 0:  # Posición LONG
                if quantity > position_amt:
                    errors.append(
                        f"❌ Fondos insuficientes para cerrar la posición LONG: "
                        f"se requieren {quantity:.8f}, disponibles {position_amt:.8f}"
                    )
            elif position_amt < 0:  # Posición SHORT
                if quantity > abs(position_amt):
                    errors.append(
                        f"❌ Fondos insuficientes para cerrar la posición SHORT: "
                        f"se requieren {quantity:.8f}, disponibles {abs(position_amt):.8f}"
                    )
            else:
                errors.append("❌ No hay posición abierta para cerrar.")
        
        except Exception as e:
            errors.append(f"❌ Error al validar cierre de posición: {str(e)}")
        
        return errors
    
    async def _validate_open_position(
        self, filters: Dict[str, Any], price: float, quantity: float,
        leverage: int, available: float, quote_asset: str,
        symbol: str, symbol_info: Dict[str, Any]
    ) -> List[str]:
        """Valida la apertura de una posición"""
        errors = []
        
        # Validar PRICE_FILTER
        if "PRICE_FILTER" in filters:
            tick_size = float(filters["PRICE_FILTER"].get("tickSize", 0))
            min_price = float(filters["PRICE_FILTER"].get("minPrice", 0))
            max_price = float(filters["PRICE_FILTER"].get("maxPrice", 0))
            
            price_precision = max(0, round(-math.log10(tick_size or 0.00000001)))
            rounded_price = round(price, price_precision)
            
            if (min_price > 0 and rounded_price < min_price) or (max_price > 0 and rounded_price > max_price):
                errors.append(
                    f"❌ El precio {rounded_price} está fuera de los límites permitidos ({min_price} - {max_price})."
                )
        
        notional = quantity * price
        logger.info("📊 FUTURES — leverage, precio, notional", leverage=leverage, price=price, notional=notional)
        
        # Validar NOTIONAL mínimo
        min_notional = float(
            filters.get("MIN_NOTIONAL", {}).get("notional", 0) or
            filters.get("MIN_NOTIONAL", {}).get("minNotional", 0) or
            filters.get("NOTIONAL", {}).get("notional", 0) or
            filters.get("NOTIONAL", {}).get("minNotional", 0)
        )
        
        if min_notional > 0 and notional < min_notional:
            errors.append(
                f"❌ El valor total de la orden ({notional:.2f} {quote_asset}) "
                f"es menor al mínimo permitido ({min_notional:.2f} {quote_asset})."
            )
        
        # Validar margen suficiente
        required_margin = notional / leverage
        if available < required_margin:
            errors.append(
                f"❌ Fondos insuficientes para abrir posición con x{leverage}. "
                f"Se requieren {required_margin:.2f} {quote_asset}, "
                f"disponibles {available:.2f} {quote_asset}."
            )
        
        # Establecer apalancamiento
        try:
            self.futures_client.change_leverage(symbol=symbol, leverage=leverage)
        except Exception as e:
            logger.warning("⚠️ No se pudo establecer apalancamiento", error=str(e), exception=str(e))
        
        return errors
    
    def _truncate_quantity_to_step(self, quantity: float, step_size: float) -> str:
        """Trunca la cantidad según el stepSize de Binance"""
        if step_size <= 0:
            return str(quantity)
        
        # Calcular precisión
        precision = max(0, round(-math.log10(step_size)))
        
        # Truncar hacia abajo
        factor = 10 ** precision
        truncated = math.floor(quantity * factor) / factor
        
        # Retornar como string con formato correcto
        return f"{truncated:.{precision}f}"
