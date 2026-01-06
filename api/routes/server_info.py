"""
Endpoint para obtener información del servidor
"""

from fastapi import APIRouter, Request
from api.services.logger import logger
import httpx
from datetime import datetime

router = APIRouter()

@router.get("")
async def get_server_info(request: Request):
    """Obtiene información del servidor y conexión"""
    try:
        # Obtener IP externa
        external_ip = "unknown"
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get("https://api.ipify.org?format=json")
                data = response.json()
                external_ip = data.get("ip", "unknown")
        except Exception as e:
            logger.error("Error fetching external IP", error=str(e))
        
        # Obtener headers
        forwarded = request.headers.get("x-forwarded-for")
        real_ip = request.headers.get("x-real-ip")
        vercel_ip = request.headers.get("x-vercel-forwarded-for")
        vercel_id = request.headers.get("x-vercel-id", "")
        vercel_region = vercel_id.split("::")[0] if "::" in vercel_id else "unknown"
        
        return {
            "serverIp": external_ip,
            "forwardedFor": forwarded,
            "realIp": real_ip,
            "vercelIp": vercel_ip,
            "vercelRegion": vercel_region,
            "allHeaders": dict(request.headers),
            "timestamp": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        logger.error("Error getting server info", error=str(e), exception=str(e))
        return {
            "error": "Error al obtener información del servidor",
            "timestamp": datetime.utcnow().isoformat()
        }
