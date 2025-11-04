import { CheckCircle, Clock } from "lucide-react"

export function Integrations() {
  const integrations = [
    {
      name: "TradingView",
      logo: "📊",
      status: "active",
      description: "Alertas y webhooks",
    },
    {
      name: "Binance",
      logo: "🟡",
      status: "active",
      description: "Spot y Futuros",
    },
    {
      name: "Bybit",
      logo: "🔷",
      status: "coming",
      description: "Próximamente",
    },
    {
      name: "OKX",
      logo: "⚫",
      status: "coming",
      description: "Próximamente",
    },
    {
      name: "KuCoin",
      logo: "🟢",
      status: "coming",
      description: "Próximamente",
    },
  ]

  return (
    <section id="integraciones" className="py-20 px-4 bg-background">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">Integraciones</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Conecta con las plataformas que ya usas
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {integrations.map((integration, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all relative"
            >
              {integration.status === "coming" && (
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-full text-xs font-medium text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Próximamente
                  </span>
                </div>
              )}

              {integration.status === "active" && (
                <div className="absolute top-4 right-4">
                  <CheckCircle className="h-5 w-5 text-accent" />
                </div>
              )}

              <div className="flex items-start gap-4">
                <div className="text-4xl">{integration.logo}</div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">{integration.name}</h3>
                  <p className="text-sm text-muted-foreground">{integration.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
