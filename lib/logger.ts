import pino from 'pino';

/**
 * Logger configurado con Pino
 * Formato estructurado para mejor análisis y debugging
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  base: {
    env: process.env.NODE_ENV || 'development',
  },
});
