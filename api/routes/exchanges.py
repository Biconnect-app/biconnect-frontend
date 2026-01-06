"""
Endpoint para obtener pares de trading de exchanges
"""

from fastapi import APIRouter, HTTPException
from api.services.logger import logger
import httpx
import asyncio

router = APIRouter()

@router.get("/{exchange}/pairs")
async def get_trading_pairs(exchange: str, marketType: str = "spot"):
    """Obtiene los pares de trading disponibles para un exchange"""
    try:
        logger.info("API Route called", exchange=exchange, market_type=marketType)
        
        if exchange.lower() != "binance":
            logger.info("Unsupported exchange", exchange=exchange)
            raise HTTPException(status_code=400, detail="Exchange not supported")
        
        api_url = (
            "https://fapi.binance.com/fapi/v1/exchangeInfo"
            if marketType == "futures"
            else "https://api.binance.com/api/v3/exchangeInfo"
        )
        
        logger.info("Fetching from Binance API", url=api_url)
        
        # Hacer petición con timeout
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(api_url, headers={"Accept": "application/json"})
        
        logger.info("Binance API response status", status=response.status_code)
        
        if response.status_code != 200:
            error_text = response.text
            logger.error("Binance API error response", error=error_text)
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Binance API returned {response.status_code}: {response.reason_phrase}"
            )
        
        data = response.json()
        logger.info("Received data from Binance", symbols_count=len(data.get("symbols", [])))
        
        if "symbols" not in data or not isinstance(data["symbols"], list):
            logger.error("Invalid response format from Binance", data=data)
            raise HTTPException(status_code=500, detail="Invalid response format from Binance API")
        
        # Filtrar y formatear pares
        pairs = [
            f"{symbol['baseAsset']}/{symbol['quoteAsset']}"
            for symbol in data["symbols"]
            if symbol["status"] == "TRADING"
        ]
        pairs.sort()
        
        logger.info("Successfully processed pairs", count=len(pairs))
        logger.info("Sample pairs", sample=pairs[:5])
        
        return {"pairs": pairs, "count": len(pairs)}
    
    except HTTPException:
        raise
    except asyncio.TimeoutError:
        logger.error("Request timed out")
        raise HTTPException(
            status_code=504,
            detail="Request timed out - Binance API took too long to respond"
        )
    except Exception as e:
        logger.error("Error in API route", error=str(e), exception=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch trading pairs: {str(e)}"
        )
