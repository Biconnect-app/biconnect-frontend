import Navbar from "@/components/navbar"
import { BookOpen, Code, Shield, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function DocsPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Documentación</h1>
            <p className="text-xl text-muted-foreground">
              Aprende a configurar y usar Cuanted para automatizar tu trading
            </p>
          </div>

          {/* Quick Links */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Link href="#inicio" className="block">
              <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all">
                <BookOpen className="h-8 w-8 text-primary mb-3" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Inicio rápido</h3>
                <p className="text-muted-foreground">Conceptos básicos y flujo de señal a orden</p>
              </div>
            </Link>

            <Link href="#tradingview" className="block">
              <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all">
                <Code className="h-8 w-8 text-primary mb-3" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Guía TradingView</h3>
                <p className="text-muted-foreground">Configura alertas y payloads JSON</p>
              </div>
            </Link>

            <Link href="#seguridad" className="block">
              <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all">
                <Shield className="h-8 w-8 text-primary mb-3" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Seguridad</h3>
                <p className="text-muted-foreground">HMAC, idempotencia y límites</p>
              </div>
            </Link>

            <Link href="#errores" className="block">
              <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all">
                <AlertCircle className="h-8 w-8 text-primary mb-3" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Errores comunes</h3>
                <p className="text-muted-foreground">Soluciones a problemas frecuentes</p>
              </div>
            </Link>
          </div>

          {/* Content Sections */}
          <div className="space-y-12">
            {/* Inicio */}
            <section id="inicio" className="bg-card border border-border rounded-xl p-8">
              <h2 className="text-3xl font-bold text-foreground mb-6">Inicio rápido</h2>

              <div className="prose prose-slate dark:prose-invert max-w-none">
                <h3 className="text-xl font-semibold text-foreground mb-3">Conceptos básicos</h3>
                <p className="text-muted-foreground mb-4">
                  Cuanted actúa como middleware entre TradingView y tus exchanges. El flujo es:
                </p>

                <ol className="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
                  <li>TradingView detecta una condición en tu estrategia y dispara una alerta</li>
                  <li>La alerta envía un webhook con un payload JSON a tu URL única de Biconnect</li>
                  <li>Biconnect recibe, valida y parsea el payload</li>
                  <li>Se aplican reglas de riesgo y mapeo de señales</li>
                  <li>La orden se envía al exchange configurado</li>
                  <li>Biconnect registra todo el proceso en logs para auditoría</li>
                </ol>

                <h3 className="text-xl font-semibold text-foreground mb-3">Primeros pasos</h3>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Crea una cuenta en Cuanted</li>
                  <li>Conecta tu exchange (Binance) con API keys</li>
                  <li>Crea una estrategia y obtén tu webhook URL única</li>
                  <li>Configura una alerta en TradingView con esa URL</li>
                  <li>Monitorea las ejecuciones en el dashboard</li>
                </ol>
              </div>
            </section>

            {/* TradingView Guide */}
            <section id="tradingview" className="bg-card border border-border rounded-xl p-8">
              <h2 className="text-3xl font-bold text-foreground mb-6">Guía TradingView</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Crear una alerta</h3>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Abre un gráfico en TradingView</li>
                    <li>Haz clic en el botón de campana (Alertas) en la barra superior</li>
                    <li>Configura la condición que disparará la alerta</li>
                    <li>En la sección "Notifications", marca "Webhook URL"</li>
                    <li>Pega tu URL de webhook de Cuanted</li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Ejemplo de payload JSON</h3>
                  <div className="bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto">
                    <pre className="text-foreground">{`{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "strategy_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7"
}`}</pre>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">
                    El payload solo incluye los identificadores necesarios. El backend de Biconnect usa estos IDs para
                    buscar la configuración completa de la estrategia en la base de datos y ejecutar la orden según los
                    parámetros configurados.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Campos del payload</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="font-medium text-foreground mb-1">
                        <code className="text-sm">user_id</code>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ID único del usuario. Se obtiene automáticamente al crear la estrategia.
                      </div>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="font-medium text-foreground mb-1">
                        <code className="text-sm">strategy_id</code>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ID único de la estrategia. El backend usa este ID para cargar la configuración completa (par,
                        gestión de riesgo, leverage, etc.) y ejecutar la orden.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Security */}
            <section id="seguridad" className="bg-card border border-border rounded-xl p-8">
              <h2 className="text-3xl font-bold text-foreground mb-6">Seguridad</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">HMAC (Plan Pro)</h3>
                  <p className="text-muted-foreground mb-3">
                    La validación HMAC garantiza que las señales provienen realmente de TradingView:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Activa HMAC en la página de Integraciones</li>
                    <li>Copia el secret generado</li>
                    <li>Configúralo en TradingView al crear la alerta</li>
                    <li>Cada webhook incluirá una firma que Cuanted verificará</li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Idempotencia</h3>
                  <p className="text-muted-foreground">
                    Biconnect usa el campo <code className="text-foreground">client_id</code> para detectar señales
                    duplicadas. Si TradingView envía la misma alerta múltiples veces, solo se ejecutará una vez.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">TTL (Time To Live)</h3>
                  <p className="text-muted-foreground">
                    Las señales tienen un tiempo de expiración configurable. Si una señal llega después de su TTL, se
                    rechaza automáticamente para evitar ejecutar órdenes con datos obsoletos.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Límites de rate</h3>
                  <p className="text-muted-foreground mb-3">Para proteger contra errores de configuración:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Plan Gratuito: 10 ejecuciones por minuto</li>
                    <li>Plan Pro: 100 ejecuciones por minuto</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Common Errors */}
            <section id="errores" className="bg-card border border-border rounded-xl p-8">
              <h2 className="text-3xl font-bold text-foreground mb-6">Errores comunes</h2>

              <div className="space-y-4">
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <h3 className="font-semibold text-foreground mb-2">Insufficient balance</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    No hay suficiente balance en el exchange para ejecutar la orden.
                  </p>
                  <p className="text-sm text-foreground">
                    <strong>Solución:</strong> Verifica el balance en tu exchange o reduce el tamaño de la orden.
                  </p>
                </div>

                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <h3 className="font-semibold text-foreground mb-2">Invalid symbol</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    El símbolo no existe en el exchange o no está en la lista blanca.
                  </p>
                  <p className="text-sm text-foreground">
                    <strong>Solución:</strong> Verifica que el símbolo sea correcto (ej: BTCUSDT) y esté permitido en tu
                    estrategia.
                  </p>
                </div>

                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <h3 className="font-semibold text-foreground mb-2">Rate limit exceeded</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Se superó el límite de ejecuciones por minuto del exchange.
                  </p>
                  <p className="text-sm text-foreground">
                    <strong>Solución:</strong> El sistema reintentará automáticamente. Considera espaciar más las
                    señales.
                  </p>
                </div>

                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <h3 className="font-semibold text-foreground mb-2">Duplicate signal</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    La señal ya fue procesada anteriormente (mismo client_id).
                  </p>
                  <p className="text-sm text-foreground">
                    <strong>Solución:</strong> Esto es normal y protege contra ejecuciones duplicadas. No requiere
                    acción.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
