"""
Logger configurado con structlog
Formato estructurado para mejor análisis y debugging
"""

import logging
import sys
import os
import structlog

# Configurar logging básico
logging.basicConfig(
    format="%(message)s",
    stream=sys.stdout,
    level=logging.INFO if os.getenv("LOG_LEVEL") is None else getattr(logging, os.getenv("LOG_LEVEL", "INFO").upper())
)

# Configurar structlog
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.StackInfoRenderer(),
        structlog.dev.set_exc_info,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer() if os.getenv("NODE_ENV") == "development" else structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
    cache_logger_on_first_use=False,
)

logger = structlog.get_logger()
