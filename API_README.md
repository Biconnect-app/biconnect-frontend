# Biconnect API - Python Backend

API backend en Python con FastAPI para procesar webhooks de TradingView y ejecutar órdenes en Binance.

## Estructura del Proyecto

\`\`\`
api/
├── main.py                 # Aplicación FastAPI principal
├── models/                 # Modelos Pydantic
│   ├── webhook.py
│   └── connection.py
├── routes/                 # Endpoints de la API
│   ├── webhook.py
│   ├── test_connection.py
│   ├── strategies.py
│   ├── exchanges.py
│   └── server_info.py
└── services/              # Servicios y utilidades
    ├── logger.py
    └── webhook_validator.py
\`\`\`

## Instalación

1. Instalar dependencias:
\`\`\`bash
pip install -r requirements.txt
\`\`\`

2. Configurar variables de entorno:
\`\`\`bash
export SUPABASE_URL="your_supabase_url"
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
export SUPABASE_ANON_KEY="your_anon_key"
export LOG_LEVEL="info"
export NODE_ENV="development"
\`\`\`

## Ejecución

### Desarrollo
\`\`\`bash
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
\`\`\`

### Producción
\`\`\`bash
uvicorn api.main:app --host 0.0.0.0 --port 8000 --workers 4
\`\`\`

## Endpoints

### POST /api/webhook
Procesa webhooks de TradingView y ejecuta órdenes en Binance.

**Payload:**
\`\`\`json
{
  "user_id": "uuid",
  "strategy_id": "uuid",
  "action": "Buy" | "Sell",
  "market_position": "string (opcional)",
  "close_position": false
}
\`\`\`

### POST /api/test-connection
Prueba la conexión con el exchange.

**Payload:**
\`\`\`json
{
  "exchange": "binance",
  "apiKey": "string",
  "apiSecret": "string",
  "testnet": false
}
\`\`\`

### GET /api/strategies
Obtiene las estrategias del usuario autenticado.

### GET /api/exchanges/{exchange}/pairs?marketType=spot
Obtiene los pares de trading disponibles.

### GET /api/server-info
Obtiene información del servidor y conexión.

## Deployment en Vercel

1. Crear `vercel.json`:
\`\`\`json
{
  "version": 2,
  "builds": [
    {
      "src": "api/main.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "api/main.py"
    }
  ]
}
\`\`\`

2. Deploy:
\`\`\`bash
vercel --prod
\`\`\`

## Características

- **FastAPI**: Framework moderno y rápido para APIs
- **WebhookValidator**: Validación completa de webhooks con lógica de Binance
- **Logging estructurado**: Con structlog para mejor debugging
- **Type safety**: Usando Pydantic para validación de datos
- **Async/await**: Operaciones asíncronas para mejor rendimiento
- **CORS configurado**: Para permitir peticiones desde el frontend

## Diferencias con la versión TypeScript

- Uso de `async/await` nativo de Python en lugar de Promises
- Modelos Pydantic en lugar de interfaces TypeScript
- structlog en lugar de pino para logging
- python-binance en lugar de @binance/connector
- Misma lógica y estructura de clases mantenida
