"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Copy, Check, Save, Search, AlertCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { DashboardLayout } from "@/components/dashboard/layout"

// Comprehensive list of trading pairs vs USDT
const FALLBACK_TRADING_PAIRS = [
  "BTC/USDT",
  "ETH/USDT",
  "BNB/USDT",
  "SOL/USDT",
  "XRP/USDT",
  "ADA/USDT",
  "DOGE/USDT",
  "AVAX/USDT",
  "DOT/USDT",
  "MATIC/USDT",
  "LINK/USDT",
  "UNI/USDT",
  "LTC/USDT",
  "ATOM/USDT",
  "ETC/USDT",
  "XLM/USDT",
  "NEAR/USDT",
  "ALGO/USDT",
  "FIL/USDT",
  "APT/USDT",
  "ARB/USDT",
  "OP/USDT",
  "SUI/USDT",
  "SEI/USDT",
  "TIA/USDT",
  "WLD/USDT",
  "PEPE/USDT",
  "SHIB/USDT",
  "INJ/USDT",
  "RUNE/USDT",
  "AAVE/USDT",
  "MKR/USDT",
  "SNX/USDT",
  "GRT/USDT",
  "FTM/USDT",
  "SAND/USDT",
  "MANA/USDT",
  "AXS/USDT",
  "GALA/USDT",
  "ENJ/USDT",
  "CHZ/USDT",
  "THETA/USDT",
  "VET/USDT",
  "ICP/USDT",
  "FLR/USDT",
  "IMX/USDT",
  "APE/USDT",
  "LDO/USDT",
  "CRV/USDT",
  "QNT/USDT",
  "BTC/BUSD",
  "ETH/BUSD",
  "BNB/BUSD",
  "BTC/BNB",
  "ETH/BNB",
  "BTC/EUR",
  "ETH/EUR",
  "BNB/EUR",
  "BTC/GBP",
  "ETH/GBP",
]

const LEVERAGE_OPTIONS = [1, 2, 3, 5, 10, 20, 25, 50, 75, 100, 125]
const QUICK_LEVERAGE_OPTIONS = [1, 2, 5, 10, 20, 50, 100, 125]

export default function NuevaEstrategiaPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    exchange: "binance",
    description: "",
    pair: "",
    marketType: "",
    leverage: 1,
    riskType: "",
    riskAmount: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [availablePairs, setAvailablePairs] = useState<string[]>([])
  const [loadingPairs, setLoadingPairs] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState<string>("")
  const [copied, setCopied] = useState(false)
  const [preGeneratedId, setPreGeneratedId] = useState<string>("")
  const [userId, setUserId] = useState<string>("")

  useEffect(() => {
    const strategyId = crypto.randomUUID()
    setPreGeneratedId(strategyId)
    console.log("[v0] Pre-generated strategy ID:", strategyId)

    const getUserId = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    getUserId()

    const previewData = sessionStorage.getItem("previewStrategy")
    const fromPreview = sessionStorage.getItem("fromPreview")

    if (previewData && fromPreview === "true") {
      try {
        const parsedData = JSON.parse(previewData)
        console.log("[v0] Loading preview data into new strategy form:", parsedData)
        setFormData({
          name: parsedData.name || "",
          exchange: parsedData.exchange || "binance",
          description: parsedData.description || "",
          pair: parsedData.pair || "",
          marketType: parsedData.marketType || "",
          leverage: parsedData.leverage || 1,
          riskType: parsedData.riskType || "",
          riskAmount: parsedData.riskAmount || "",
        })
        sessionStorage.removeItem("previewStrategy")
        sessionStorage.removeItem("fromPreview")
        console.log("[v0] Preview data loaded and cleared from sessionStorage")
      } catch (error) {
        console.error("[v0] Error loading preview data:", error)
        sessionStorage.removeItem("previewStrategy")
        sessionStorage.removeItem("fromPreview")
      }
    }
  }, [])

  useEffect(() => {
    if (formData.marketType && formData.exchange) {
      fetchTradingPairs()
    }
  }, [formData.marketType, formData.exchange])

  const fetchTradingPairs = async () => {
    setLoadingPairs(true)
    setErrors([])

    try {
      console.log("[v0] Fetching pairs for exchange:", formData.exchange, "marketType:", formData.marketType)

      const response = await fetch(`/api/exchanges/${formData.exchange}/pairs?marketType=${formData.marketType}`)

      console.log("[v0] Fetch response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] API error response:", errorData)
        throw new Error(errorData.details || "Failed to fetch pairs")
      }

      const data = await response.json()
      console.log("[v0] Received pairs count:", data.count)
      console.log("[v0] Sample pairs:", data.pairs?.slice(0, 5))

      if (data.pairs && data.pairs.length > 0) {
        setAvailablePairs(data.pairs)
        setErrors([])
      } else {
        throw new Error("No pairs received from API")
      }
    } catch (error) {
      console.error("[v0] Error fetching trading pairs:", error)
      setErrors([
        "Mostrando lista limitada de pares populares. Conecta tu exchange en Integraciones para ver todos los pares disponibles.",
      ])
      setAvailablePairs(FALLBACK_TRADING_PAIRS)
    } finally {
      setLoadingPairs(false)
    }
  }

  const validateForm = () => {
    const newErrors: string[] = []

    if (!formData.name.trim()) newErrors.push("El nombre es requerido")
    if (!formData.pair) newErrors.push("Debes seleccionar un par")
    if (!formData.marketType) newErrors.push("Debes seleccionar el tipo de mercado")
    if (!formData.riskType) newErrors.push("Debes seleccionar un tipo de gestión")
    if (!formData.riskAmount) {
      newErrors.push("Debes ingresar una cantidad")
    } else {
      const amount = Number.parseFloat(formData.riskAmount)
      if (isNaN(amount) || amount <= 0) {
        newErrors.push("La cantidad debe ser mayor a 0")
      } else if (formData.riskType === "percentage" && (amount < 0 || amount > 100)) {
        newErrors.push("El porcentaje debe estar entre 0 y 100")
      }
    }

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSave = async () => {
    console.log("[v0] handleSave called - starting save process")

    if (validateForm()) {
      console.log("[v0] Validation passed")
      setIsSubmitting(true)
      try {
        const supabase = createClient()

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          console.error("[v0] ❌ No user found")
          alert("Debes estar autenticado para guardar la estrategia")
          return
        }

        console.log("[v0] User found:", user.id)

        const strategyData = {
          id: preGeneratedId,
          user_id: user.id,
          exchange_id: null,
          exchange_name: formData.exchange,
          name: formData.name,
          description: formData.description || "",
          trading_pair: formData.pair,
          market_type: formData.marketType,
          leverage: formData.leverage || 1,
          risk_type: formData.riskType,
          risk_value: Number.parseFloat(formData.riskAmount),
          is_active: true,
          webhook_url: `https://biconnect.vercel.app/api/webhook`,
        }

        const { data: newStrategy, error } = await supabase.from("strategies").insert(strategyData).select().single()

        if (error) {
          console.error("[v0] ❌ Error saving strategy:", error)
          alert(`Error al guardar la estrategia: ${error.message}`)
          return
        }

        console.log("[v0] ✅ Strategy saved successfully")
        router.push("/app/estrategias")
      } catch (error) {
        console.error("[v0] ❌ Exception in handleSave:", error)
        if (error instanceof Error) {
          alert(`Error inesperado: ${error.message}`)
        }
      } finally {
        setIsSubmitting(false)
      }
    } else {
      console.log("[v0] ❌ Validation failed")
      alert("Por favor completa todos los campos requeridos")
    }
  }

  const copyWebhook = () => {
    const webhookUrl = `https://biconnect.vercel.app/api/webhook`
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getBaseCurrency = () => formData.pair.split("/")[0]
  const getQuoteCurrency = () => formData.pair.split("/")[1]

  const generatePayload = () => {
    const payload = {
      user_id: userId || "{{user_id}}",
      strategy_id: preGeneratedId || "{{strategy_id}}",
    }

    return JSON.stringify(payload, null, 2)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/app/estrategias")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Nueva estrategia</h1>
              <p className="text-muted-foreground">Configura los parámetros de tu estrategia de trading</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Información básica</h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la estrategia *</Label>
              <Input
                id="name"
                placeholder="Ej: BTC Scalping 5m"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={
                  errors.includes("El nombre es requerido") ||
                  errors.includes("Ya existe una estrategia con este nombre")
                    ? "border-destructive"
                    : ""
                }
              />
              {errors.includes("El nombre es requerido") && (
                <p className="text-xs text-destructive">El nombre es requerido</p>
              )}
              {errors.includes("Ya existe una estrategia con este nombre") && (
                <p className="text-xs text-destructive">Ya existe una estrategia con este nombre</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Describe tu estrategia..."
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Mercado y activo */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Mercado y activo</h2>

          {errors.includes(
            "Mostrando lista limitada de pares populares. Conecta tu exchange en Integraciones para ver todos los pares disponibles.",
          ) && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Mostrando lista limitada de pares populares. Conecta tu exchange en Integraciones para ver todos los
                pares disponibles.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {/* Exchange selector */}
            <div className="space-y-2">
              <Label htmlFor="exchange">Exchange *</Label>
              <Select
                value={formData.exchange}
                onValueChange={(value) => setFormData({ ...formData, exchange: value })}
              >
                <SelectTrigger id="exchange">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="binance">Binance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de operación */}
            <div className="space-y-2">
              <Label>Tipo de operación *</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, marketType: "spot", leverage: 1 })}
                  className={`relative p-4 rounded-xl border-2 transition-all ${
                    formData.marketType === "spot"
                      ? "border-accent bg-accent/10 shadow-lg ring-2 ring-accent/20"
                      : "border-border hover:border-accent/50"
                  }`}
                >
                  {formData.marketType === "spot" && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-accent-foreground" />
                    </div>
                  )}
                  <div className="font-semibold text-foreground">Spot</div>
                  <div className="text-sm text-muted-foreground mt-1">Compra/venta directa</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, marketType: "futures" })}
                  className={`relative p-4 rounded-xl border-2 transition-all ${
                    formData.marketType === "futures"
                      ? "border-accent bg-accent/10 shadow-lg ring-2 ring-accent/20"
                      : "border-border hover:border-accent/50"
                  }`}
                >
                  {formData.marketType === "futures" && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-accent-foreground" />
                    </div>
                  )}
                  <div className="font-semibold text-foreground">Futuros</div>
                  <div className="text-sm text-muted-foreground mt-1">Con apalancamiento</div>
                </button>
              </div>
            </div>

            {/* Apalancamiento (solo para futuros) */}
            {formData.marketType === "futures" && (
              <div className="space-y-3">
                <Label>Apalancamiento</Label>
                <div className="grid grid-cols-4 gap-2">
                  {QUICK_LEVERAGE_OPTIONS.map((lev) => (
                    <button
                      key={lev}
                      type="button"
                      onClick={() => setFormData({ ...formData, leverage: lev })}
                      className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                        formData.leverage === lev
                          ? "border-accent bg-accent/10 text-accent shadow-sm"
                          : "border-border hover:border-accent/50 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {lev}x
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={125}
                    value={formData.leverage}
                    onChange={(e) => {
                      const val = Number.parseInt(e.target.value) || 1
                      setFormData({ ...formData, leverage: Math.min(Math.max(val, 1), 125) })
                    }}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">Personalizado (1-125x)</span>
                </div>
                <p className="text-xs text-muted-foreground">Multiplica tus ganancias (y pérdidas) potenciales</p>
              </div>
            )}

            {/* Par de trading */}
            <div className="space-y-2">
              <Label>Par a operar *</Label>
              <Popover
                open={formData.pair !== ""}
                onOpenChange={(open) => setFormData({ ...formData, pair: open ? "" : formData.pair })}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={formData.pair !== ""}
                    className={`w-full justify-between bg-transparent ${errors.includes("Debes seleccionar un par") ? "border-destructive" : ""}`}
                    disabled={loadingPairs}
                  >
                    {loadingPairs ? "Cargando pares..." : formData.pair || "Buscar par..."}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar par..." />
                    <CommandList>
                      <CommandEmpty>No se encontró el par.</CommandEmpty>
                      <CommandGroup>
                        {availablePairs.map((pair) => (
                          <CommandItem
                            key={pair}
                            value={pair}
                            onSelect={(value) => {
                              setFormData({ ...formData, pair: value.toUpperCase() })
                            }}
                          >
                            {pair}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.includes("Debes seleccionar un par") && (
                <p className="text-xs text-destructive">Debes seleccionar un par</p>
              )}
              <p className="text-xs text-muted-foreground">
                {loadingPairs
                  ? "Cargando pares disponibles desde Binance..."
                  : `${availablePairs.length} pares ${errors.includes("Mostrando lista limitada de pares populares. Conecta tu exchange en Integraciones para ver todos los pares disponibles.") ? "populares" : "disponibles"}`}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Gestión del riesgo</h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de gestión *</Label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, riskType: "fixed_quantity" })}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    formData.riskType === "fixed_quantity"
                      ? "border-accent bg-accent/5"
                      : "border-border hover:border-accent/50"
                  }`}
                >
                  <div className="font-semibold text-foreground">Cantidad de contratos</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, riskType: "fixed_amount" })}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    formData.riskType === "fixed_amount"
                      ? "border-accent bg-accent/5"
                      : "border-border hover:border-accent/50"
                  }`}
                >
                  <div className="font-semibold text-foreground">Monto fijo</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, riskType: "percentage" })}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    formData.riskType === "percentage"
                      ? "border-accent bg-accent/5"
                      : "border-border hover:border-accent/50"
                  }`}
                >
                  <div className="font-semibold text-foreground">Porcentaje de capital</div>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="risk-amount">
                {formData.riskType === "fixed_quantity" && "Cantidad *"}
                {formData.riskType === "fixed_amount" && "Monto *"}
                {formData.riskType === "percentage" && "Porcentaje *"}
              </Label>
              <Input
                id="risk-amount"
                type="number"
                step={formData.riskType === "fixed_quantity" ? "0.00001" : "0.01"}
                value={formData.riskAmount}
                onChange={(e) => setFormData({ ...formData, riskAmount: e.target.value })}
                className={
                  errors.includes("Debes ingresar una cantidad") ||
                  errors.includes("La cantidad debe ser mayor a 0") ||
                  errors.includes("El porcentaje debe estar entre 0 y 100")
                    ? "border-destructive"
                    : ""
                }
              />
              {errors.includes("Debes ingresar una cantidad") && (
                <p className="text-xs text-destructive">Debes ingresar una cantidad</p>
              )}
              {errors.includes("La cantidad debe ser mayor a 0") && (
                <p className="text-xs text-destructive">La cantidad debe ser mayor a 0</p>
              )}
              {errors.includes("El porcentaje debe estar entre 0 y 100") && (
                <p className="text-xs text-destructive">El porcentaje debe estar entre 0 y 100</p>
              )}
            </div>

            {formData.riskType && (
              <div className="p-4 bg-muted/30 border border-border/50 rounded-lg">
                <h3 className="text-sm font-semibold text-foreground mb-2">Ejemplo:</h3>
                {formData.riskType === "fixed_quantity" && (
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>
                      Si ingresas <span className="font-semibold text-foreground">0.5</span> contratos de BTC/USDT:
                    </p>
                    <p>• Cada orden comprará o venderá exactamente 0.5 BTC</p>
                    <p>• Si el precio de BTC es $50,000, el tamaño de la orden será $25,000</p>
                  </div>
                )}
                {formData.riskType === "fixed_amount" && (
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>
                      Si ingresas <span className="font-semibold text-foreground">$1,000</span> como monto fijo:
                    </p>
                    <p>• Cada orden usará exactamente $1,000 USDT</p>
                    <p>• Si el precio de BTC es $50,000, comprará 0.02 BTC</p>
                  </div>
                )}
                {formData.riskType === "percentage" && (
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>
                      Si ingresas <span className="font-semibold text-foreground">5%</span> de tu capital:
                    </p>
                    <p>• Con un balance de $10,000, cada orden usará $500</p>
                    <p>• El tamaño de la orden se ajusta automáticamente según tu balance</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Webhook de TradingView</h2>

          <div className="flex gap-2">
            <Input value={`https://biconnect.vercel.app/api/webhook`} readOnly className="font-mono text-sm" />
            <Button onClick={copyWebhook} variant="outline" className="bg-transparent">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Payload JSON</h2>

          <Textarea value={generatePayload()} readOnly className="font-mono text-sm" rows={12} />
        </div>

        <div className="flex gap-4">
          <Button
            onClick={handleSave}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
            disabled={isSubmitting}
          >
            <Save className="h-4 w-4 mr-2" />
            Guardar estrategia
          </Button>
          <Link href="/app/estrategias">
            <Button variant="outline" className="bg-transparent">
              Cancelar
            </Button>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  )
}
