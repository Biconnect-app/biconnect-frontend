"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { CheckCircle, Plus, Eye, EyeOff, Trash2, AlertCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { ApiKeyAlert } from "@/components/api-key-alert"

interface Exchange {
  id: string
  exchange_name: string
  api_key: string | null // Allow null values
  api_secret: string | null // Allow null values
  testnet: boolean
  created_at: string
}

export default function IntegrationsPage() {
  const [showSecret, setShowSecret] = useState<{ [key: string]: boolean }>({})
  const [showApiKey, setShowApiKey] = useState(false)
  const [showApiSecret, setShowApiSecret] = useState(false)
  const [exchanges, setExchanges] = useState<Exchange[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)

  const [formData, setFormData] = useState({
    apiKey: "",
    apiSecret: "",
    testnet: true,
  })
  const [saving, setSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadExchanges()
  }, [])

  const loadExchanges = async () => {
    try {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return
      }

      const { data, error } = await supabase
        .from("exchanges")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading exchanges:", error)
        return
      }

      setExchanges(data || [])
    } catch (error) {
      console.error("Error in loadExchanges:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveExchange = async () => {
    if (!formData.apiKey || !formData.apiSecret) {
      alert("Por favor completa todos los campos")
      return
    }

    try {
      setSaving(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        alert("Debes iniciar sesión")
        return
      }

      console.log("Saving exchange for user:", user.id)

      const { data, error } = await supabase
        .from("exchanges")
        .insert({
          user_id: user.id,
          exchange_name: "binance",
          api_key: formData.apiKey,
          api_secret: formData.apiSecret,
          testnet: formData.testnet,
        })
        .select()
        .single()

      if (error) {
        console.error("Error saving exchange:", error)
        alert(`Error al guardar: ${error.message}`)
        return
      }

      console.log("Exchange saved:", data)

      // Reset form and reload exchanges
      setFormData({ apiKey: "", apiSecret: "", testnet: true })
      setShowAddForm(false)
      await loadExchanges()
      alert("Exchange guardado exitosamente")
    } catch (error) {
      console.error("Error in saveExchange:", error)
      alert("Error al guardar el exchange")
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    setTestResult(null)

    if (!formData.apiKey || !formData.apiSecret) {
      alert("Por favor ingresa API Key y Secret primero")
      return
    }

    setIsTesting(true)

    try {
      const isTestnet = formData.testnet
      const baseUrl = isTestnet ? "https://testnet.binance.vision" : "https://api.binance.com"

      console.log("Testing basic connectivity to", baseUrl)

      const pingResponse = await fetch(`${baseUrl}/api/v3/ping`)

      if (!pingResponse.ok) {
        setTestResult({
          success: false,
          message: "✗ No se puede conectar al exchange. Verifica tu conexión a internet",
        })
        setIsTesting(false)
        return
      }

      console.log("Basic connectivity OK, testing authentication...")

      const response = await fetch("/api/test-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          exchange: "binance",
          apiKey: formData.apiKey,
          apiSecret: formData.apiSecret,
          testnet: isTestnet,
        }),
      })

      const data = await response.json()
      console.log("Test connection response:", data)

      if (data.success) {
        console.log("Authentication successful")
        setTestResult({
          success: true,
          message: `✓ Conexión exitosa! API Key y Secret verificados correctamente. Cuenta: ${data.accountType || "verificada"}`,
        })
      } else {
        console.error("Authentication failed:", data)

        if (data.isGeoRestriction) {
          setTestResult({
            success: false,
            message:
              "⚠️ No se puede verificar desde esta ubicación del servidor. Puedes guardar las credenciales de todas formas - se verificarán al ejecutar órdenes desde tu ubicación.",
          })
        } else {
          setTestResult({
            success: false,
            message: `✗ ${data.error || "Error al verificar credenciales"}`,
          })
        }
      }
    } catch (err) {
      console.error("Error testing connection:", err)
      setTestResult({
        success: false,
        message: "✗ Error al probar la conexión. Verifica tu conexión a internet",
      })
    } finally {
      setIsTesting(false)
    }
  }

  const deleteExchange = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este exchange?")) {
      return
    }

    try {
      console.log("Deleting exchange:", id)

      const { error } = await supabase.from("exchanges").delete().eq("id", id)

      if (error) {
        console.error("Error deleting exchange:", error)
        alert(`Error al eliminar: ${error.message}`)
        return
      }

      console.log("Exchange deleted successfully")
      await loadExchanges()
    } catch (error) {
      console.error("Error in deleteExchange:", error)
      alert("Error al eliminar el exchange")
    }
  }

  const maskApiKey = (key: string | null) => {
    if (!key) return "No configurada"
    if (key.length <= 8) return key
    return key.substring(0, 4) + "***" + key.substring(key.length - 4)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="space-y-6">
        <ApiKeyAlert />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Integraciones</h1>
            <p className="text-muted-foreground mt-1">Gestiona conexiones con TradingView y exchanges</p>
          </div>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            <Plus className="h-4 w-4 mr-2" />
            Añadir exchange
          </Button>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Exchanges conectados</h2>

          {loading ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <p className="text-muted-foreground">Cargando exchanges...</p>
            </div>
          ) : exchanges.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <p className="text-muted-foreground">No hay exchanges conectados aún.</p>
              <Button
                onClick={() => setShowAddForm(true)}
                className="mt-4 bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                Añadir tu primer exchange
              </Button>
            </div>
          ) : (
            exchanges.map((exchange) => (
              <div key={exchange.id} className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="text-4xl">🟡</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        Binance {exchange.testnet ? "(Testnet)" : "(Live)"}
                      </h3>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>API Key: {maskApiKey(exchange.api_key)}</div>
                        <div>Agregado: {new Date(exchange.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {exchange.api_key && exchange.api_secret ? (
                      <div className="flex items-center gap-2 px-3 py-1 bg-accent/10 text-accent rounded-full text-sm font-medium">
                        <CheckCircle className="h-4 w-4" />
                        Conectado
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-1 bg-destructive/10 text-destructive rounded-full text-sm font-medium">
                        <AlertCircle className="h-4 w-4" />
                        Sin configurar
                      </div>
                    )}
                  </div>
                </div>

                {(!exchange.api_key || !exchange.api_secret) && (
                  <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-destructive">
                      Este exchange fue creado automáticamente pero necesita API keys para funcionar. Elimínalo y crea
                      uno nuevo con tus credenciales.
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="bg-transparent"
                    onClick={() => console.log("Probar conexión")}
                    disabled
                  >
                    Probar conexión (próximamente)
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-transparent text-destructive hover:bg-destructive/10"
                    onClick={() => deleteExchange(exchange.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {showAddForm && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Añadir exchange</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="exchange-type">Exchange</Label>
                <Select defaultValue="binance" disabled>
                  <SelectTrigger id="exchange-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="binance">Binance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="api-key"
                    type={showApiKey ? "text" : "password"}
                    placeholder="Tu API key del exchange"
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="bg-transparent"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="api-secret">API Secret</Label>
                <div className="flex gap-2">
                  <Input
                    id="api-secret"
                    type={showApiSecret ? "text" : "password"}
                    placeholder="Tu API secret del exchange"
                    value={formData.apiSecret}
                    onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="bg-transparent"
                    onClick={() => setShowApiSecret(!showApiSecret)}
                  >
                    {showApiSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="environment">Entorno</Label>
                <Select
                  value={formData.testnet ? "testnet" : "live"}
                  onValueChange={(value) => setFormData({ ...formData, testnet: value === "testnet" })}
                >
                  <SelectTrigger id="environment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="live">Live (Producción)</SelectItem>
                    <SelectItem value="testnet">Testnet (Pruebas)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="permissions">Permisos requeridos</Label>
                <Textarea
                  id="permissions"
                  rows={3}
                  defaultValue="- Lectura de cuenta
- Trading (spot o futuros)
- NO requiere permisos de retiro"
                  disabled
                  className="text-sm"
                />
              </div>

              <Accordion type="single" collapsible className="border border-border rounded-lg">
                <AccordionItem value="help-videos" className="border-none">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2 text-left">
                      <span>📹</span>
                      <div className="text-sm">
                        <div className="font-semibold text-foreground">¿Necesitas ayuda?</div>
                        <div className="text-xs text-muted-foreground">Videos tutoriales</div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-foreground">1. Crear cuenta en Binance</h4>
                        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                          <iframe
                            className="absolute top-0 left-0 w-full h-full rounded-lg"
                            src="https://www.youtube.com/embed/GR0UYsCN8ug"
                            title="Cómo crear una cuenta en Binance"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-foreground">2. Crear API Keys</h4>
                        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                          <iframe
                            className="absolute top-0 left-0 w-full h-full rounded-lg"
                            src="https://www.youtube.com/embed/uK_sgXGQmHc?start=219"
                            title="Cómo crear API Keys en Binance"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Comienza desde el minuto 3:39</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {testResult && (
                <div
                  className={`rounded-lg p-3 text-sm ${
                    testResult.success
                      ? "bg-accent/10 border border-accent/20 text-accent"
                      : "bg-destructive/10 border border-destructive/20 text-destructive"
                  }`}
                >
                  {testResult.message}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || !formData.apiKey || !formData.apiSecret}
                  variant="outline"
                  className="bg-transparent"
                >
                  {isTesting ? "Probando..." : "Probar conexión"}
                </Button>
                <Button
                  onClick={saveExchange}
                  disabled={saving}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  {saving ? "Guardando..." : "Guardar"}
                </Button>
                <Button variant="outline" className="bg-transparent" onClick={() => setShowAddForm(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="text-4xl">📊</div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-foreground mb-2">TradingView</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Configura alertas en TradingView para enviar señales a Biconnect mediante webhooks.
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-accent/10 text-accent rounded-full text-sm font-medium">
              <CheckCircle className="h-4 w-4" />
              Activo
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Guía rápida</h3>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Crea una alerta en TradingView (botón de campana en el gráfico)</li>
              <li>En "Notifications", marca "Webhook URL"</li>
              <li>Pega la URL del webhook de tu estrategia (disponible en la página de estrategias)</li>
              <li>
                En "Message", incluye el JSON con los datos de la señal:
                <div className="bg-background rounded p-3 mt-2 font-mono text-xs overflow-x-auto">
                  {`{
  "action": "long",
  "symbol": "{{ticker}}",
  "price": "{{close}}",
  "qty_pct": 5,
  "leverage": 5,
  "tp": 0.01,
  "sl": 0.005,
  "client_id": "{{strategy.order.id}}"
}`}
                </div>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
