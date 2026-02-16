import { Zap, RefreshCw, Shield, FileText, Layers, Globe } from "lucide-react"

export function Benefits() {
  const benefits = [
    {
      icon: Zap,
      title: "Baja latencia",
      description: "Ejecución en menos de 1 segundo desde la señal hasta la orden en el exchange.",
    },
    {
      icon: RefreshCw,
      title: "Ejecución confiable",
      description:
        "Sistema de reintentos con backoff exponencial. Garantizamos que tus órdenes se ejecuten incluso ante fallos temporales.",
    },
    {
      icon: Shield,
      title: "Control de riesgo",
      description:
        "Límites por orden, diarios, por símbolo. Horarios permitidos, lista blanca de activos y validación de tamaños.",
    },
    {
      icon: FileText,
      title: "Auditoría completa",
      description:
        "Logs detallados de cada señal: recepción, validación, decisión, ejecución y respuesta. Trazabilidad total.",
    },
    {
      icon: Layers,
      title: "Múltiples estrategias",
      description:
        "Gestiona estrategias ilimitadas con webhooks únicos. Cada una con sus propias reglas y configuraciones.",
    },
    {
      icon: Globe,
      title: "Multiexchange",
      description: "Conecta múltiples exchanges simultáneamente. Binance y más próximamente.",
    },
  ]

  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">Beneficios clave</h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto text-pretty">
            Todo lo que necesitas para automatizar tu trading con confianza
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <benefit.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">{benefit.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
