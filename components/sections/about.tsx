import { Shield, Zap, Users, TrendingUp } from "lucide-react"

export function About() {
  const pillars = [
    {
      icon: Shield,
      title: "Seguridad",
      description: "Protección de nivel bancario para tus activos",
    },
    {
      icon: Zap,
      title: "Liquidez",
      description: "Operaciones instantáneas 24/7",
    },
    {
      icon: Users,
      title: "Soporte 24/7",
      description: "Equipo experto siempre disponible",
    },
    {
      icon: TrendingUp,
      title: "UX Intuitiva",
      description: "Interfaz diseñada para todos los niveles",
    },
  ]

  return (
    <section className="py-20 px-4 bg-background">
      <div className="container mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Sobre Cuanted</h2>
          <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
            <p>
              Cuanted es la plataforma líder en América Latina para la compra y venta de criptomonedas. Fundada en
              2020, nuestra misión es democratizar el acceso a los activos digitales y proporcionar una experiencia de
              trading segura, rápida y confiable.
            </p>
            <p>
              Con tecnología de punta y un equipo dedicado de expertos en blockchain y finanzas, hemos procesado más de
              $2 mil millones en transacciones para más de 50,000 usuarios satisfechos. Nuestra plataforma combina
              seguridad institucional con una interfaz intuitiva, perfecta tanto para principiantes como para traders
              experimentados.
            </p>
            <p>
              Creemos en la transparencia, la innovación y el empoderamiento financiero. Cada día trabajamos para hacer
              que el mundo de las criptomonedas sea más accesible y seguro para todos.
            </p>
          </div>
        </div>

        {/* Pillars */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar, index) => (
            <div key={index} className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <pillar.icon className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">{pillar.title}</h3>
              <p className="text-muted-foreground">{pillar.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
