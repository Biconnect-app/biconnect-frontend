"""
Biconnect API - FastAPI Backend
Maneja webhooks de TradingView y ejecuta órdenes en Binance
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import webhook, test_connection, strategies, exchanges, server_info
from api.services.logger import logger
import os

app = FastAPI(
    title="Biconnect API",
    description="API para procesar webhooks de TradingView y ejecutar órdenes en Binance",
    version="1.0.0",
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar dominios permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(webhook.router, prefix="/api/webhook", tags=["webhook"])
app.include_router(test_connection.router, prefix="/api/test-connection", tags=["connection"])
app.include_router(strategies.router, prefix="/api/strategies", tags=["strategies"])
app.include_router(exchanges.router, prefix="/api/exchanges", tags=["exchanges"])
app.include_router(server_info.router, prefix="/api/server-info", tags=["server"])

@app.get("/")
async def root():
    return {"message": "Biconnect API - FastAPI Backend", "status": "running"}

@app.on_event("startup")
async def startup_event():
    logger.info("🚀 Biconnect API iniciada")
    logger.info(f"Entorno: {os.getenv('NODE_ENV', 'development')}")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("🛑 Biconnect API detenida")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "api.main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("NODE_ENV") == "development"
    )
