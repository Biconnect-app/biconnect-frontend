"""
Modelos para test de conexión
"""

from pydantic import BaseModel

class ConnectionTest(BaseModel):
    """Datos para probar conexión con exchange"""
    exchange: str
    apiKey: str
    apiSecret: str
    testnet: bool = False
