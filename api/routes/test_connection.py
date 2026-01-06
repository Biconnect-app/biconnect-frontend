"""
Endpoint para probar conexión con exchanges
"""

from fastapi import APIRouter, HTTPException
from api.models.connection import ConnectionTest
from api.services.logger import logger
import hmac
import hashlib
import time
import httpx

router = APIRouter()

@router.post("")
async def test_connection(data: ConnectionTest):
    """Prueba la conexión con el exchange usando las credenciales proporcionadas"""
    try:
        logger.info("Testing connection", exchange=data.exchange, testnet=data.testnet)
        
        if not data.apiKey or not data.apiSecret:
            raise HTTPException(
                status_code=400,
                detail={"success": False, "error": "API key y secret son requeridos"}
            )
        
        # Solo Binance está soportado por ahora
        if data.exchange != "binance":
            raise HTTPException(
                status_code=400,
                detail={"success": False, "error": "Solo Binance está soportado actualmente"}
            )
        
        # Determinar la URL base
        base_url = "https://testnet.binance.vision" if data.testnet else "https://api.binance.com"
        
        # Crear signature
        timestamp = int(time.time() * 1000)
        query_string = f"timestamp={timestamp}"
        signature = hmac.new(
            data.apiSecret.encode('utf-8'),
            query_string.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        # Hacer la petición
        url = f"{base_url}/api/v3/account?{query_string}&signature={signature}"
        logger.info("Making request to", url=url)
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                headers={"X-MBX-APIKEY": data.apiKey}
            )
        
        logger.info("Binance API response status", status=response.status_code)
        
        if response.status_code != 200:
            error_data = response.json()
            logger.error("Binance API error", error=error_data)
            
            error_message = "Error al conectar con Binance"
            is_geo_restriction = False
            
            if "msg" in error_data:
                msg = error_data["msg"].lower()
                
                if "restricted location" in msg or "eligibility" in msg:
                    error_message = error_data["msg"]
                    is_geo_restriction = True
                elif "invalid api-key" in msg or error_data.get("code") == -2014:
                    error_message = "API Key inválida. Verifica que la copiaste correctamente."
                elif "signature" in msg or error_data.get("code") == -1022:
                    error_message = "API Secret incorrecta. Verifica que la copiaste correctamente."
                elif "ip" in msg or "whitelist" in msg:
                    error_message = "IP no autorizada. Verifica las restricciones de IP en tu API key de Binance."
                elif "timestamp" in msg:
                    error_message = "Error de sincronización de tiempo. Intenta nuevamente."
                else:
                    error_message = error_data["msg"]
            
            raise HTTPException(
                status_code=400,
                detail={
                    "success": False,
                    "error": error_message,
                    "isGeoRestriction": is_geo_restriction,
                    "code": error_data.get("code")
                }
            )
        
        account_data = response.json()
        logger.info("Connection test successful", account_type=account_data.get("accountType"))
        
        return {
            "success": True,
            "message": "Conexión exitosa con Binance",
            "accountType": account_data.get("accountType"),
            "canTrade": account_data.get("canTrade"),
            "canDeposit": account_data.get("canDeposit"),
            "canWithdraw": account_data.get("canWithdraw")
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error testing connection", error=str(e), exception=str(e))
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": "Error al probar la conexión. Verifica tu conexión a internet."
            }
        )
