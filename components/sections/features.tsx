import { CheckCircle, BarChart3, Bell, Code, Repeat } from "lucide-react"

export function Features() {
  const features = [
    {
      icon: CheckCircle,
      title: "KYC Rápido",
      description: "Verificación de identidad en minutos. Proceso simple y seguro para comenzar a operar rápidamente.",
    },
    {
      icon: Repeat,
      title: "Múltiples Criptoactivos",
      description: "Accede a Bitcoin, Ethereum, y más de 50 criptomonedas. Diversifica tu portafolio con facilidad.",
    },
    {
      icon: BarChart3,
      title: "Órdenes Límite y Mercado",
      description: "Control total sobre tus operaciones. Ejecuta órdenes al precio que desees o al instante.",
    },
    {
      icon: TrendingUp,
      title: "Panel de Portfolio",
      description: "Visualiza tu portafolio en tiempo real con gráficos avanzados y métricas de rendimiento.",
    },
    {
      icon: Bell,
      title: "Alertas de Precio",
      description: "Recibe notificaciones cuando tus criptomonedas alcancen el precio objetivo que estableciste.",
    },
    {
      icon: Code,
      title: "API para Traders",
      description: "Integra tu estrategia de trading con nuestra API REST y WebSocket de alto rendimiento.",
    },
  ]

  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">Características clave</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Todo lo que necesitas para operar criptomonedas de forma profesional
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TrendingUp({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  )
}
