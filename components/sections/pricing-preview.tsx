import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

export function PricingPreview() {
  return (
    <section id="precios" className="py-20 px-4 bg-background">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">Planes y precios</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Elige el plan que mejor se adapte a tu volumen de trading
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Período de Prueba */}
          <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-xl transition-shadow">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-foreground mb-2">Período de Prueba</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-foreground">$0</span>
                <span className="text-muted-foreground">/30 días</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Luego $25/mes</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">100 ejecuciones/mes</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">1 estrategia activa</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">1 exchange conectado</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Logs de 7 días</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Cancela cuando quieras</span>
              </li>
            </ul>

            <Link href="/registro" className="block">
              <Button variant="outline" className="w-full bg-transparent" size="lg">
                Iniciar prueba gratuita
              </Button>
            </Link>
          </div>

          {/* Plan Pro */}
          <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-2xl p-8 hover:shadow-xl transition-shadow relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-semibold">
              Popular
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">Plan Pro</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold">$25</span>
                <span className="text-primary-foreground/80">/mes</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8">
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
                <span>Múltiples exchanges</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                <span>2FA obligatorio</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                <span>Alertas por email/Telegram</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                <span>Webhooks HMAC</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                <span>Deduplicación avanzada</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                <span>Backoff/retry automático</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                <span>SLA y soporte prioritario</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                <span>Logs de 90 días</span>
              </li>
            </ul>

            <Link href="/preview/estrategia?plan=pro" className="block">
              <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" size="lg">
                Obtener Pro
              </Button>
            </Link>
          </div>
        </div>

        <div className="text-center mt-12">
          <Link href="/precios">
            <Button variant="link" className="text-lg">
              Ver comparación completa de planes →
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
