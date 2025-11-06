"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { CheckCircle, Eye, EyeOff, AlertCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

async function signRequest(queryString: string, apiSecret: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(apiSecret)
  const messageData = encoder.encode(queryString)

  const cryptoKey = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"])

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData)

  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export default function InitialApiSetupPage() {
  const router = useRouter()
  const [showApiKey, setShowApiKey] = useState(false)
  const [showApiSecret, setShowApiSecret] = useState(false)
  const [formData, setFormData] = useState({
    exchange: "",
    apiKey: "",
    apiSecret: "",
    environment: "testnet",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const supabase = createClient()

  const handleTestConnection = async () => {
    setError("")
    setTestResult(null)

    if (!formData.apiKey || !formData.apiSecret) {
      setError("Por favor ingresa API Key y Secret primero")
      return
    }

    setIsTesting(true)

    try {
      console.log("[v0] Testing connection from client...")

      const isTestnet = formData.environment === "testnet"
      const baseUrl = isTestnet ? "https://testnet.binance.vision" : "https://api.binance.com"

      const timestamp = Date.now()
      const queryString = `timestamp=${timestamp}`

      const signature = await signRequest(queryString, formData.apiSecret)

      const url = `${baseUrl}/api/v3/account?${queryString}&signature=${signature}`

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "X-MBX-APIKEY": formData.apiKey,
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Connection successful:", data)
        setTestResult({
          success: true,
          message: `✓ Conexión exitosa! Cuenta verificada correctamente`,
        })
      } else {
        const errorData = await response.json()
        console.error("[v0] Connection failed:", errorData)

        let errorMessage = "Error al conectar"
        if (errorData.msg) {
          if (errorData.msg.includes("Invalid API-key")) {
            errorMessage = "API Key inválida"
          } else if (errorData.msg.includes("Signature")) {
            errorMessage = "API Secret incorrecta"
          } else if (errorData.msg.includes("IP")) {
            errorMessage = "Restricción de IP. Verifica la configuración en Binance"
          } else {
            errorMessage = errorData.msg
          }
        }

        setTestResult({
          success: false,
          message: `✗ ${errorMessage}`,
        })
      }
    } catch (err) {
      console.error("[v0] Error testing connection:", err)
      setTestResult({
        success: false,
        message: "✗ Error al probar la conexión. Verifica tu conexión a internet",
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.exchange || !formData.apiKey || !formData.apiSecret) {
      setError("Por favor completa todos los campos")
      return
    }

    setIsSubmitting(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("Debes iniciar sesión")
        setIsSubmitting(false)
        return
      }

      console.log("[v0] Saving exchange for user:", user.id)

      const { data, error: dbError } = await supabase
        .from("exchanges")
        .insert({
          user_id: user.id,
          exchange_name: "binance",
          api_key: formData.apiKey,
          api_secret: formData.apiSecret,
          testnet: formData.environment === "testnet",
        })
        .select()
        .single()

      if (dbError) {
        console.error("[v0] Error saving exchange:", dbError)
        setError(`Error al guardar: ${dbError.message}`)
        setIsSubmitting(false)
        return
      }

      console.log("[v0] Exchange saved successfully:", data)

      router.push("/app/estrategias")
      router.refresh()
    } catch (err) {
      console.error("[v0] Error in handleSubmit:", err)
      setError("Error al guardar la configuración")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent/10 rounded-full mb-4">
            <CheckCircle className="h-8 w-8 text-accent" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Último paso: Configura tus API Keys</h1>
          <p className="text-muted-foreground">
            Conecta tu exchange para comenzar a ejecutar órdenes automáticamente desde TradingView
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm text-foreground">
              <p className="font-medium mb-1">Recomendación: Comienza con Testnet</p>
              <p className="text-muted-foreground">
                Te recomendamos usar el entorno de pruebas (Testnet) primero para familiarizarte con la plataforma sin
                riesgo. Podrás cambiar a producción cuando estés listo.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="exchange">Exchange *</Label>
            <Select value={formData.exchange} onValueChange={(value) => setFormData({ ...formData, exchange: value })}>
              <SelectTrigger id="exchange">
                <SelectValue placeholder="Selecciona tu exchange" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="binance">Binance</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Usa las mismas API keys para operar en Spot y Futuros</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="environment">Entorno *</Label>
            <Select
              value={formData.environment}
              onValueChange={(value) => setFormData({ ...formData, environment: value })}
            >
              <SelectTrigger id="environment">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="testnet">
                  <div className="flex items-center gap-2">
                    <span>Testnet (Pruebas)</span>
                    <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded">Recomendado</span>
                  </div>
                </SelectItem>
                <SelectItem value="live">Live (Producción)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {formData.environment === "testnet"
                ? "Usa dinero virtual para probar sin riesgo"
                : "Ejecuta órdenes reales con dinero real"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api-key">API Key *</Label>
            <div className="relative">
              <Input
                id="api-key"
                type={showApiKey ? "text" : "password"}
                placeholder="Pega tu API Key aquí"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                className="font-mono text-sm pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Obtén tu API Key desde la configuración de tu exchange</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api-secret">API Secret *</Label>
            <div className="relative">
              <Input
                id="api-secret"
                type={showApiSecret ? "text" : "password"}
                placeholder="Pega tu API Secret aquí"
                value={formData.apiSecret}
                onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                className="font-mono text-sm pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiSecret(!showApiSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showApiSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Tu API Secret se almacena de forma segura y encriptada</p>
          </div>

          {/* Permissions Info */}
          <div className="bg-muted/30 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">Permisos requeridos</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-accent" />
                Lectura de cuenta (balance, posiciones)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-accent" />
                Trading (crear y cancelar órdenes)
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-muted-foreground" />
                NO requiere permisos de retiro
              </li>
            </ul>
          </div>

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

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
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
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {isSubmitting ? "Guardando..." : "Guardar y comenzar"}
            </Button>
            <Link href="/app/estrategias" className="flex-1">
              <Button type="button" variant="outline" className="w-full bg-transparent">
                Omitir por ahora
              </Button>
            </Link>
          </div>
        </form>

        {/* Video Help Section */}
        <Accordion type="single" collapsible className="bg-card border border-border rounded-xl">
          <AccordionItem value="help-videos" className="border-none">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex items-center gap-2 text-left">
                <span className="text-lg">📹</span>
                <div>
                  <div className="font-semibold text-foreground">¿Necesitas ayuda?</div>
                  <div className="text-sm text-muted-foreground">Videos tutoriales para crear tu cuenta y API keys</div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-6">
                {/* Video 1: Create Binance Account */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">1. Cómo crear una cuenta en Binance</h3>
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

                {/* Video 2: Create API Keys */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">2. Cómo crear tus API Keys en Binance</h3>
                  <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                    <iframe
                      className="absolute top-0 left-0 w-full h-full rounded-lg"
                      src="https://www.youtube.com/embed/uK_sgXGQmHc?start=219"
                      title="Cómo crear API Keys en Binance"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">El video comienza desde el minuto 3:39</p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Help Section */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            ¿Necesitas ayuda para obtener tus API Keys?{" "}
            <Link href="/docs" className="text-accent hover:underline">
              Ver guía completa
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
