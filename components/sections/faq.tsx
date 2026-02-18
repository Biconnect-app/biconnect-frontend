"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      question: "¿Cómo maneja Cuanted las alertas duplicadas?",
      answer:
        "Utilizamos idempotency keys derivadas del payload para detectar y filtrar señales duplicadas. En el plan Pro, la deduplicación avanzada usa clientOrderId y hash del payload para garantizar que cada señal se ejecute solo una vez, incluso si TradingView envía la alerta múltiples veces.",
    },
    {
      question: "¿Qué pasa si una orden falla en el exchange?",
      answer:
        "El plan Pro incluye reintentos automáticos con backoff exponencial. Si una orden falla por problemas temporales (rate limits, conexión), el sistema reintenta automáticamente con intervalos crecientes. Recibirás alertas de errores persistentes por email o Telegram.",
    },
    {
      question: "¿Cuál es la latencia típica desde la señal hasta la ejecución?",
      answer:
        "La latencia promedio (p50) es menor a 1 segundo desde que TradingView envía el webhook hasta que la orden llega al exchange. El p95 es menor a 2 segundos. Factores como la validación de reglas y la respuesta del exchange pueden afectar estos tiempos.",
    },
    {
      question: "¿Hay límites de ejecuciones por minuto?",
      answer:
        "El período de prueba tiene un límite de 10 ejecuciones por minuto. El plan Pro permite hasta 100 ejecuciones por minuto. Estos límites protegen contra errores de configuración que podrían generar órdenes excesivas.",
    },
    {
      question: "¿Cuanted es compatible con Pine Script de TradingView?",
      answer:
        "Sí, completamente. Puedes usar strategy.entry(), strategy.close() y alertcondition() en Pine Script. Configura el mensaje de alerta con un JSON que incluya los campos necesarios (action, symbol, qty, etc.) y Cuanted lo parseará automáticamente.",
    },
    {
      question: "¿Cómo funciona la validación HMAC de webhooks?",
      answer:
        "En el plan Pro, puedes activar HMAC para validar que las señales provienen realmente de TradingView. Cuanted genera un secret que compartes con TradingView, y cada webhook incluye una firma HMAC que verificamos antes de ejecutar la orden.",
    },
    {
      question: "¿Puedo probar mis estrategias sin arriesgar dinero real?",
      answer:
        "Sí, el plan Pro incluye modo testnet/paper trading. Puedes conectar exchanges en modo testnet (Binance Testnet, etc.) para probar tus estrategias con datos reales pero sin ejecutar órdenes reales. Perfecto para validar configuraciones antes de ir a producción.",
    },
    {
      question: "¿Qué exchanges soportan y cuáles vienen próximamente?",
      answer:
        "Actualmente soportamos Binance (Spot y Futuros). Próximamente agregaremos Bybit, OKX y KuCoin. Puedes votar por el próximo exchange en nuestra comunidad o contactar soporte para solicitudes específicas.",
    },
  ]

  return (
    <section id="faq" className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">Preguntas frecuentes</h2>
          <p className="text-xl text-muted-foreground text-pretty">
            Encuentra respuestas sobre la orquestación de señales
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-card border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
                aria-expanded={openIndex === index}
              >
                <span className="text-lg font-semibold text-foreground pr-4">{faq.question}</span>
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-5">
                  <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
