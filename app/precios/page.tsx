import Navbar from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"
import Link from "next/link"

export default function PricingPage() {
  const features = [
    { name: "Ejecuciones mensuales", free: "100", pro: "Ilimitadas" },
    { name: "Estrategias activas", free: "1", pro: "Ilimitadas" },
    { name: "Exchanges conectados", free: "1", pro: "Múltiples" },
    { name: "Retención de logs", free: "7 días", pro: "90 días" },
    { name: "Webhooks únicos", free: true, pro: true },
    { name: "Mapeo de señales", free: true, pro: true },
    { name: "Validación de esquema", free: true, pro: true },
    { name: "Límites de riesgo básicos", free: true, pro: true },
    { name: "2FA obligatorio", free: false, pro: true },
    { name: "Alertas email/Telegram", free: false, pro: true },
    { name: "Webhooks HMAC", free: false, pro: true },
    { name: "Deduplicación avanzada", free: false, pro: true },
    { name: "Backoff/retry exponencial", free: false, pro: true },
    { name: "Idempotency keys", free: false, pro: true },
    { name: "IP allowlist", free: false, pro: true },
    { name: "SLA garantizado", free: false, pro: true },
    { name: "Soporte prioritario", free: false, pro: true },
    { name: "Modo testnet/paper", free: false, pro: true },
  ]

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20">
        {/* Header */}
        <section className="px-4 py-16 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto text-center max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 text-balance">Elige tu plan</h1>
            <p className="text-xl text-muted-foreground text-pretty">
              Comienza gratis y actualiza cuando necesites más ejecuciones y funciones avanzadas. Sin contratos, cancela
              cuando quieras.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="px-4 py-16">
          <div className="container mx-auto">
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-20">
              {/* Plan Gratuito */}
              <div className="bg-card border-2 border-border rounded-2xl p-8 hover:shadow-xl transition-shadow">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-foreground mb-2">Plan Gratuito</h2>
                  <p className="text-muted-foreground mb-6">Perfecto para probar y estrategias pequeñas</p>
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-6xl font-bold text-foreground">$0</span>
                    <span className="text-muted-foreground text-lg">/mes</span>
                  </div>
                  <Link href="/preview/estrategia" className="block">
                    <Button variant="outline" size="lg" className="w-full bg-transparent">
                      Comenzar gratis
                    </Button>
                  </Link>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground mb-4">Incluye:</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">100 ejecuciones por mes</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">1 estrategia activa simultánea</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">1 exchange conectado</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">Webhooks únicos por estrategia</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">Mapeo de señales TradingView</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">Logs de 7 días</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">Soporte por email</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Plan Pro */}
              <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-2xl p-8 hover:shadow-xl transition-shadow relative overflow-hidden border-2 border-primary">
                <div className="absolute top-6 right-6 bg-accent text-accent-foreground px-4 py-1.5 rounded-full text-sm font-bold">
                  Más Popular
                </div>

                <div className="mb-8">
                  <h2 className="text-3xl font-bold mb-2">Plan Pro</h2>
                  <p className="text-primary-foreground/90 mb-6">Para traders algorítmicos serios</p>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-6xl font-bold">$29</span>
                    <span className="text-primary-foreground/80 text-lg">/mes</span>
                  </div>
                  <p className="text-sm text-primary-foreground/70 mb-6">Facturación mensual o anual</p>
                  <Link href="/preview/estrategia?plan=pro" className="block">
                    <Button size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                      Obtener Pro
                    </Button>
                  </Link>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold mb-4">Todo en Gratuito, más:</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                      <span>Ejecuciones ilimitadas</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                      <span>Estrategias ilimitadas</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                      <span>Múltiples exchanges simultáneos</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                      <span>2FA obligatorio para seguridad</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                      <span>Alertas por email y Telegram</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                      <span>Webhooks HMAC para validación</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                      <span>Deduplicación avanzada</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                      <span>Backoff/retry exponencial</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                      <span>SLA y soporte prioritario</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                      <span>Logs de 90 días</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                      <span>Modo testnet/paper trading</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl font-bold text-foreground text-center mb-12">Comparación detallada</h2>

              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-3 gap-4 p-6 bg-muted/50 border-b border-border">
                  <div className="font-semibold text-foreground">Característica</div>
                  <div className="font-semibold text-foreground text-center">Plan Gratuito</div>
                  <div className="font-semibold text-foreground text-center">Plan Pro</div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-border">
                  {features.map((feature, index) => (
                    <div key={index} className="grid grid-cols-3 gap-4 p-6 hover:bg-muted/30 transition-colors">
                      <div className="text-foreground font-medium">{feature.name}</div>
                      <div className="text-center">
                        {typeof feature.free === "boolean" ? (
                          feature.free ? (
                            <Check className="h-5 w-5 text-accent mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-muted-foreground mx-auto" />
                          )
                        ) : (
                          <span className="text-muted-foreground">{feature.free}</span>
                        )}
                      </div>
                      <div className="text-center">
                        {typeof feature.pro === "boolean" ? (
                          feature.pro ? (
                            <Check className="h-5 w-5 text-accent mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-muted-foreground mx-auto" />
                          )
                        ) : (
                          <span className="text-foreground font-medium">{feature.pro}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Table Footer */}
                <div className="grid grid-cols-3 gap-4 p-6 bg-muted/50 border-t border-border">
                  <div></div>
                  <div className="text-center">
                    <Link href="/preview/estrategia">
                      <Button variant="outline" className="bg-transparent">
                        Comenzar gratis
                      </Button>
                    </Link>
                  </div>
                  <div className="text-center">
                    <Link href="/preview/estrategia?plan=pro">
                      <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">Obtener Pro</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="px-4 py-16 bg-muted/30">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold text-foreground text-center mb-12">Preguntas sobre planes</h2>
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-2">¿Puedo cambiar de plan en cualquier momento?</h3>
                <p className="text-muted-foreground">
                  Sí, puedes actualizar o degradar tu plan en cualquier momento. Los cambios se aplican inmediatamente y
                  se prorratean según corresponda.
                </p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-2">¿Qué cuenta como una ejecución?</h3>
                <p className="text-muted-foreground">
                  Una ejecución es cada vez que Biconnect recibe una señal de TradingView y envía una orden al exchange.
                  Las señales duplicadas o rechazadas por validación no cuentan como ejecuciones.
                </p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-2">¿Qué pasa si supero el límite gratuito?</h3>
                <p className="text-muted-foreground">
                  Si alcanzas las 100 ejecuciones en el plan gratuito, las señales adicionales se pondrán en cola pero
                  no se ejecutarán hasta el próximo mes o hasta que actualices a Pro.
                </p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-2">¿Ofrecen descuentos para volumen alto?</h3>
                <p className="text-muted-foreground">
                  Sí, ofrecemos planes empresariales personalizados para equipos y traders institucionales. Contacta a
                  nuestro equipo de ventas para más información.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
