"""
Endpoint para obtener estrategias del usuario
"""

from fastapi import APIRouter, HTTPException, Depends
from api.services.logger import logger
from supabase import create_client, Client
import os

router = APIRouter()

def get_supabase() -> Client:
    """Obtiene cliente de Supabase"""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_anon_key = os.getenv("SUPABASE_ANON_KEY")
    
    if not supabase_url or not supabase_anon_key:
        raise HTTPException(status_code=500, detail="Configuración de Supabase incompleta")
    
    return create_client(supabase_url, supabase_anon_key)

@router.get("")
async def get_strategies(authorization: str = None, supabase: Client = Depends(get_supabase)):
    """Obtiene las estrategias del usuario autenticado"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="No autorizado")
        
        # Obtener usuario autenticado
        token = authorization.replace("Bearer ", "")
        user_response = supabase.auth.get_user(token)
        
        if not user_response.user:
            raise HTTPException(status_code=401, detail="No autorizado")
        
        user = user_response.user
        
        # Obtener estrategias del usuario
        strategies_response = supabase.table("strategies").select(
            "user_id, id"
        ).eq("user_id", user.id).order("created_at", desc=True).execute()
        
        if strategies_response.data is None:
            logger.error("Error fetching strategies", error=str(strategies_response))
            raise HTTPException(status_code=500, detail="Error al obtener estrategias")
        
        # Retornar payload simplificado
        return {
            "strategies": [
                {"user_id": s["user_id"], "strategy_id": s["id"]}
                for s in strategies_response.data
            ]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error in strategies API", error=str(e), exception=str(e))
        raise HTTPException(status_code=500, detail="Error interno del servidor")
