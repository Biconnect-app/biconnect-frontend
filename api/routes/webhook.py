"""
Endpoint principal para TradingView Webhook
Procesa las señales de TradingView y ejecuta órdenes en Binance
"""

from fastapi import APIRouter, HTTPException, Response
from api.models.webhook import WebhookPayload
from api.services.logger import logger
from api.services.webhook_validator import WebhookValidator
from binance.spot import Spot
from binance.um_futures import UMFutures
from supabase import create_client, Client
import os

router = APIRouter()

@router.post("")
async def webhook_handler(payload: WebhookPayload, response: Response):
    """
    Procesa webhook de TradingView y ejecuta orden en Binance
    
    El payload debe contener:
    - user_id: ID del usuario
    - strategy_id: ID de la estrategia
    - action: "Buy" | "Sell"
    - market_position: string (opcional, para referencia futura)
    - close_position: boolean (opcional, solo para futures)
    """
    try:
        logger.info("📥 Webhook recibido", payload=payload.dict())
        
        # Validar campos requeridos
        normalized_action = payload.action.lower()
        valid_actions = ["buy", "sell"]
        if normalized_action not in valid_actions:
            logger.warning("❌ Action inválido")
            raise HTTPException(
                status_code=400,
                detail={
                    "status": "error",
                    "message": f"Action debe ser 'Buy' o 'Sell'. Recibido: '{payload.action}'",
                    "log_summary": f"Action inválido: {payload.action}"
                }
            )
        
        # Configurar Supabase
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not supabase_url or not supabase_service_key:
            logger.error("❌ Variables de entorno de Supabase no configuradas")
            raise HTTPException(
                status_code=500,
                detail={
                    "status": "error",
                    "message": "Configuración de Supabase incompleta",
                    "log_summary": "Variables de entorno de Supabase no configuradas"
                }
            )
        
        supabase: Client = create_client(supabase_url, supabase_service_key)
        
        # Obtener estrategia
        strategy_response = supabase.table("strategies").select(
            "trading_pair, market_type, leverage, risk_type, risk_value, is_active, exchange_name"
        ).eq("id", payload.strategy_id).eq("user_id", payload.user_id).single().execute()
        
        if not strategy_response.data:
            logger.error("❌ Error al obtener estrategia")
            raise HTTPException(
                status_code=404,
                detail={
                    "status": "error",
                    "message": "Estrategia no encontrada",
                    "log_summary": "Estrategia no encontrada o no pertenece al usuario"
                }
            )
        
        strategy = strategy_response.data
        
        if not strategy["is_active"]:
            logger.warning("⚠️ Estrategia inactiva")
            raise HTTPException(
                status_code=403,
                detail={
                    "status": "warning",
                    "message": "La estrategia está inactiva. Por favor, actívala desde el panel de control para continuar.",
                    "log_summary": "Estrategia inactiva - no se puede ejecutar"
                }
            )
        
        # Determinar acción interna según tipo de mercado
        if strategy["market_type"] == "spot":
            internal_action = normalized_action
        elif strategy["market_type"] == "futures":
            internal_action = "long" if normalized_action == "buy" else "short"
        else:
            logger.warning("❌ Tipo de mercado no reconocido")
            raise HTTPException(
                status_code=400,
                detail={
                    "status": "error",
                    "message": f"Tipo de mercado no reconocido: {strategy['market_type']}",
                    "log_summary": f"Tipo de mercado no reconocido: {strategy['market_type']}"
                }
            )
        
        # Obtener credenciales del exchange
        exchange_response = supabase.table("exchanges").select(
            "api_key, api_secret, testnet"
        ).eq("user_id", payload.user_id).eq("exchange_name", strategy["exchange_name"]).single().execute()
        
        if not exchange_response.data:
            logger.error("❌ Error al obtener exchange")
            raise HTTPException(
                status_code=404,
                detail={
                    "status": "error",
                    "message": f"Exchange {strategy['exchange_name']} no configurado para este usuario",
                    "log_summary": f"Exchange {strategy['exchange_name']} no configurado para este usuario"
                }
            )
        
        exchange = exchange_response.data
        
        if not exchange["api_key"] or not exchange["api_secret"]:
            logger.warning("❌ API key o secret no configuradas")
            raise HTTPException(
                status_code=400,
                detail={
                    "status": "error",
                    "message": "Credenciales del exchange no configuradas",
                    "log_summary": "API key o secret no configuradas"
                }
            )
        
        # Configurar clientes de Binance
        is_testnet = exchange.get("testnet", False)
        spot_base_url = "https://testnet.binance.vision" if is_testnet else "https://api.binance.com"
        futures_base_url = "https://testnet.binancefuture.com" if is_testnet else "https://fapi.binance.com"
        
        spot_client = Spot(
            api_key=exchange["api_key"],
            api_secret=exchange["api_secret"],
            base_url=spot_base_url
        )
        
        futures_client = UMFutures(
            key=exchange["api_key"],
            secret=exchange["api_secret"],
            base_url=futures_base_url
        )
        
        # Construir payload completo
        binance_symbol = strategy["trading_pair"].replace("/", "")
        complete_payload = {
            "symbol": binance_symbol,
            "action": internal_action
        }
        
        if strategy["risk_type"] == "fixed_amount":
            complete_payload["usdt_amount"] = strategy["risk_value"]
        elif strategy["risk_type"] == "percentage":
            complete_payload["percentage"] = strategy["risk_value"]
        
        if strategy["market_type"] == "futures":
            complete_payload["leverage"] = strategy.get("leverage", 1)
            complete_payload["close_position"] = payload.close_position or False
        
        logger.info(
            "📦 Payload construido desde estrategia",
            strategy={
                "trading_pair": strategy["trading_pair"],
                "binance_symbol": binance_symbol,
                "market_type": strategy["market_type"],
                "leverage": strategy.get("leverage"),
                "risk_type": strategy["risk_type"],
                "risk_value": strategy["risk_value"]
            },
            original_action=payload.action,
            internal_action=internal_action,
            complete_payload=complete_payload
        )
        
        # Validar payload
        validator = WebhookValidator(spot_client, futures_client)
        validation_result = await validator.validate(complete_payload)
        
        if not validation_result["valid"]:
            logger.warning(
                "❌ Validación fallida",
                error=validation_result["error"],
                log_summary=validation_result["log_summary"]
            )
            raise HTTPException(
                status_code=400,
                detail={
                    "status": "error",
                    "message": validation_result["error"],
                    "log_summary": validation_result["log_summary"]
                }
            )
        
        # Ejecutar orden
        trade_data = validation_result["clean_data"]
        trade_action = trade_data["action"]
        symbol = trade_data["symbol"]
        quantity = float(trade_data["quantity"])
        
        order = None
        
        if trade_action in ["buy", "sell"]:
            # SPOT
            side = trade_action.upper()
            try:
                order = spot_client.new_order(
                    symbol=symbol,
                    side=side,
                    type="MARKET",
                    quantity=quantity
                )
                logger.info("✅ Orden SPOT ejecutada", order=order)
            except Exception as e:
                logger.error("❌ Error ejecutando orden SPOT", error=str(e), exception=str(e))
                error_msg = getattr(e, "message", str(e))
                raise Exception(f"Error ejecutando orden SPOT: {error_msg}")
        
        elif trade_action in ["long", "short"]:
            # FUTURES
            try:
                order_params = {"quantity": quantity}
                if trade_data.get("close_position") is not None:
                    order_params["reduceOnly"] = str(trade_data["close_position"])
                
                order = futures_client.new_order(
                    symbol=symbol,
                    side=trade_data["side"],
                    type="MARKET",
                    **order_params
                )
                logger.info("✅ Orden FUTURES ejecutada", order=order)
            except Exception as e:
                logger.error("❌ Error ejecutando orden FUTURES", error=str(e), exception=str(e))
                error_msg = getattr(e, "message", str(e))
                raise Exception(f"Error ejecutando orden FUTURES: {error_msg}")
        
        # Headers de seguridad
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        response.headers["Content-Security-Policy"] = (
            "default-src 'none'; script-src 'self'; connect-src 'none'; "
            "img-src 'self'; style-src 'self'; frame-ancestors 'none'; form-action 'self';"
        )
        
        return {
            "status": "success",
            "message": (
                f"✅ Orden de tipo '{payload.action.upper()}' ejecutada con éxito: "
                f"acción={internal_action}, símbolo={symbol}, cantidad={quantity}."
            ),
            "log_summary": (
                f"Orden ejecutada con éxito: acción={internal_action}, "
                f"símbolo={symbol}, cantidad={quantity}. {order}"
            )
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error("❌ Error en la ejecución del webhook", error=str(e), exception=str(e))
        
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        response.headers["Content-Security-Policy"] = (
            "default-src 'none'; script-src 'self'; connect-src 'none'; "
            "img-src 'self'; style-src 'self'; frame-ancestors 'none'; form-action 'self';"
        )
        
        raise HTTPException(
            status_code=500,
            detail={
                "status": "error",
                "message": str(e) or "Error interno en la ejecución del webhook",
                "log_summary": "Error interno en la ejecución del webhook"
            }
        )

@router.options("")
async def webhook_options():
    """Handle OPTIONS for CORS"""
    return Response(
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        }
    )
