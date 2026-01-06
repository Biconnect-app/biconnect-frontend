"""
Modelos Pydantic para validación de datos de webhook
"""

from pydantic import BaseModel, Field
from typing import Optional, Literal

class WebhookPayload(BaseModel):
    """Payload recibido desde TradingView webhook"""
    user_id: str = Field(..., description="ID del usuario")
    strategy_id: str = Field(..., description="ID de la estrategia")
    action: Literal["Buy", "Sell", "buy", "sell"] = Field(..., description="Acción: Buy o Sell")
    market_position: Optional[str] = Field(None, description="Posición del mercado (para referencia futura)")
    close_position: Optional[bool] = Field(False, description="Cerrar posición (solo para futures)")

class WebhookData(BaseModel):
    """Datos del webhook para validación interna"""
    symbol: str
    action: str
    quantity: Optional[float] = None
    qty: Optional[float] = None
    percentage: Optional[float] = None
    usdt_amount: Optional[float] = None
    price: Optional[float] = None
    leverage: Optional[int] = None
    close_position: Optional[bool] = False
    side: Optional[Literal["BUY", "SELL"]] = None

class ValidationResult(BaseModel):
    """Resultado de la validación del webhook"""
    valid: bool
    error: Optional[str] = None
    log_summary: Optional[str] = None
    clean_data: Optional[dict] = None
