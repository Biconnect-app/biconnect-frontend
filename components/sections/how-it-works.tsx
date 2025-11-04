import { Webhook, Settings, Activity } from "lucide-react"

export function HowItWorks() {
  const steps = [
    {
      number: "01",
      icon: Webhook,
      title: "Conecta TradingView",
      description:
        "Crea alertas en TradingView y configura el webhook con tu URL única por usuario/estrategia. Cada señal se envía automáticamente a Biconnect.",
    },
    {
      number: "02",
      icon: Settings,
      title: "Configura reglas",
      description:
        "Mapea señales a acciones específicas: spot o futuros, tamaños de posición, símbolos, leverage, stop loss y take profit. Define límites de riesgo y horarios permitidos.",
    },
    {
      number: "03",
      icon: Activity,
      title: "Ejecuta y monitorea",
      description:
        "Las órdenes se ejecutan automáticamente en tu exchange. Monitorea en tiempo real con logs detallados, alertas de errores y métricas de rendimiento.",
    },
  ]

  return (
    <section id="como-funciona" className="py-20 px-4 bg-background">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">Cómo funciona</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Tres pasos simples para automatizar tu trading
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
              )}

              <div className="bg-card border border-border rounded-xl p-8 hover:shadow-lg transition-all relative">
                <div className="text-6xl font-bold text-primary/10 absolute top-4 right-4">{step.number}</div>

                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-6 relative z-10">
                  <step.icon className="h-8 w-8 text-primary" />
                </div>

                <h3 className="text-2xl font-semibold text-foreground mb-4">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
