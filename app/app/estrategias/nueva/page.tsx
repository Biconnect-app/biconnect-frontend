"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowRight, ArrowLeft, Copy, Check, Search, AlertCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription } from "@/components/ui/alert"

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

export default function NewStrategyPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [copied, setCopied] = useState(false)
  const [openPairSelect, setOpenPairSelect] = useState(false)
  const [tradingPairs, setTradingPairs] = useState<string[]>(FALLBACK_TRADING_PAIRS)
  const [loadingPairs, setLoadingPairs] = useState(false)
  const [pairsError, setPairsError] = useState<string | null>(null)

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

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const previewData = sessionStorage.getItem("previewStrategy")
    if (previewData) {
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
        // Clear preview data after loading
        sessionStorage.removeItem("previewStrategy")
        console.log("[v0] Preview data loaded and cleared from sessionStorage")
      } catch (error) {
        console.error("[v0] Error loading preview data:", error)
        sessionStorage.removeItem("previewStrategy")
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
    setPairsError(null)

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
        setTradingPairs(data.pairs)
        setPairsError(null)
      } else {
        throw new Error("No pairs received from API")
      }
    } catch (error) {
      console.error("[v0] Error fetching trading pairs:", error)
      setPairsError(
        "Mostrando lista limitada de pares populares. Conecta tu exchange en Integraciones para ver todos los pares disponibles.",
      )
      setTradingPairs(FALLBACK_TRADING_PAIRS)
    } finally {
      setLoadingPairs(false)
    }
  }

  const validateStep = (currentStep: number) => {
    const newErrors: Record<string, string> = {}

    if (currentStep === 1) {
      if (!formData.name.trim()) newErrors.name = "El nombre es requerido"
    } else if (currentStep === 2) {
      if (!formData.marketType) newErrors.marketType = "Debes seleccionar el tipo de mercado"
    } else if (currentStep === 3) {
      if (!formData.pair) newErrors.pair = "Debes seleccionar un par"
    } else if (currentStep === 4) {
      if (!formData.riskType) newErrors.riskType = "Debes seleccionar un tipo de gestión"
      if (!formData.riskAmount) {
        newErrors.riskAmount = "Debes ingresar una cantidad"
      } else {
        const amount = Number.parseFloat(formData.riskAmount)
        if (isNaN(amount) || amount <= 0) {
          newErrors.riskAmount = "La cantidad debe ser mayor a 0"
        } else if (formData.riskType === "percentage" && (amount < 0 || amount > 100)) {
          newErrors.riskAmount = "El porcentaje debe estar entre 0 y 100"
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1)
    }
  }

  const prevStep = () => {
    setStep(step - 1)
    setErrors({})
  }

  const handleSave = () => {
    if (validateStep(step)) {
      console.log("[v0] Saving new strategy:", formData)
      // Save strategy to localStorage
      const existingStrategies = JSON.parse(localStorage.getItem("strategies") || "[]")
      const newStrategy = {
        id: `strat-${Date.now()}`,
        ...formData,
        createdAt: new Date().toISOString(),
        status: "active",
      }
      localStorage.setItem("strategies", JSON.stringify([...existingStrategies, newStrategy]))
      console.log("[v0] Strategy saved successfully")
      router.push("/app/estrategias")
    }
  }

  const copyWebhook = () => {
    const webhookUrl = `https://api.biconnect.io/w/user123/strat-${Date.now()}`
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getBaseCurrency = () => formData.pair.split("/")[0]
  const getQuoteCurrency = () => formData.pair.split("/")[1]

  const generatePayload = () => {
    const payload: any = {
      action: "{{action}}",
      symbol: formData.pair,
      market_type: formData.marketType,
    }

    if (formData.marketType === "futures") {
      payload.leverage = formData.leverage
    }

    if (formData.riskType === "fixed_quantity") {
      payload.quantity = Number.parseFloat(formData.riskAmount)
    } else if (formData.riskType === "fixed_amount") {
      payload.amount_usdt = Number.parseFloat(formData.riskAmount)
    } else if (formData.riskType === "percentage") {
      payload.capital_percentage = Number.parseFloat(formData.riskAmount)
    }

    payload.client_id = "{{strategy.order.id}}"

    return JSON.stringify(payload, null, 2)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nueva estrategia</h1>
          <p className="text-muted-foreground mt-1">Configura una nueva estrategia de trading automatizado</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((s, idx) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                  step >= s ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {s}
              </div>
              {idx < 4 && <div className="flex-1 h-0.5 bg-border" />}
            </div>
          ))}
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
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
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

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

            <Button onClick={nextStep} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              Siguiente
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 2: Market Type & Leverage */}
        {step === 2 && (
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Tipo de mercado</h2>

            <div className="space-y-4">
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
                {errors.marketType && <p className="text-xs text-destructive">{errors.marketType}</p>}
              </div>

              {formData.marketType === "futures" && (
                <div className="space-y-2">
                  <Label htmlFor="leverage">Apalancamiento *</Label>
                  <Select
                    value={formData.leverage.toString()}
                    onValueChange={(value) => setFormData({ ...formData, leverage: Number.parseInt(value) })}
                  >
                    <SelectTrigger id="leverage">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEVERAGE_OPTIONS.map((lev) => (
                        <SelectItem key={lev} value={lev.toString()}>
                          {lev}x
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Mayor apalancamiento = mayor riesgo y potencial ganancia
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={prevStep} variant="outline" className="bg-transparent">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Atrás
              </Button>
              <Button onClick={nextStep} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                Siguiente
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Trading Pair */}
        {step === 3 && (
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Par de trading</h2>

            {pairsError && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{pairsError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>Selecciona el par a operar *</Label>
              <Popover open={openPairSelect} onOpenChange={setOpenPairSelect}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openPairSelect}
                    className={`w-full justify-between bg-transparent ${errors.pair ? "border-destructive" : ""}`}
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
                        {tradingPairs.map((pair) => (
                          <CommandItem
                            key={pair}
                            value={pair}
                            onSelect={(value) => {
                              setFormData({ ...formData, pair: value.toUpperCase() })
                              setOpenPairSelect(false)
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
              {errors.pair && <p className="text-xs text-destructive">{errors.pair}</p>}
              <p className="text-xs text-muted-foreground">
                {loadingPairs
                  ? "Cargando pares disponibles desde Binance..."
                  : `${tradingPairs.length} pares ${pairsError ? "populares" : "disponibles"}`}
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={prevStep} variant="outline" className="bg-transparent">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Atrás
              </Button>
              <Button onClick={nextStep} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                Siguiente
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Risk Management */}
        {step === 4 && (
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Gestión del riesgo</h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de gestión *</Label>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, riskType: "fixed_quantity" })}
                    className={`relative w-full p-4 rounded-xl border-2 text-left transition-all ${
                      formData.riskType === "fixed_quantity"
                        ? "border-accent bg-accent/10 shadow-lg ring-2 ring-accent/20"
                        : "border-border hover:border-accent/50"
                    }`}
                  >
                    {formData.riskType === "fixed_quantity" && (
                      <div className="absolute top-4 right-4 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3 text-accent-foreground" />
                      </div>
                    )}
                    <div className="font-semibold text-foreground">Cantidad fija ({getBaseCurrency() || "Cripto"})</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Operar siempre la misma cantidad de {getBaseCurrency() || "criptomoneda"}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, riskType: "fixed_amount" })}
                    className={`relative w-full p-4 rounded-xl border-2 text-left transition-all ${
                      formData.riskType === "fixed_amount"
                        ? "border-accent bg-accent/10 shadow-lg ring-2 ring-accent/20"
                        : "border-border hover:border-accent/50"
                    }`}
                  >
                    {formData.riskType === "fixed_amount" && (
                      <div className="absolute top-4 right-4 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3 text-accent-foreground" />
                      </div>
                    )}
                    <div className="font-semibold text-foreground">Monto fijo ({getQuoteCurrency()})</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Operar siempre el mismo monto en {getQuoteCurrency()}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, riskType: "percentage" })}
                    className={`relative w-full p-4 rounded-xl border-2 text-left transition-all ${
                      formData.riskType === "percentage"
                        ? "border-accent bg-accent/10 shadow-lg ring-2 ring-accent/20"
                        : "border-border hover:border-accent/50"
                    }`}
                  >
                    {formData.riskType === "percentage" && (
                      <div className="absolute top-4 right-4 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3 text-accent-foreground" />
                      </div>
                    )}
                    <div className="font-semibold text-foreground">% del capital ({getQuoteCurrency()})</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Operar un porcentaje de tu capital disponible
                    </div>
                  </button>
                </div>
                {errors.riskType && <p className="text-xs text-destructive">{errors.riskType}</p>}
              </div>

              {formData.riskType && (
                <div className="space-y-2">
                  <Label htmlFor="risk-amount">
                    {formData.riskType === "fixed_quantity" && `Cantidad (${getBaseCurrency()}) *`}
                    {formData.riskType === "fixed_amount" && `Monto (${getQuoteCurrency()}) *`}
                    {formData.riskType === "percentage" && "Porcentaje (%) *"}
                  </Label>
                  <Input
                    id="risk-amount"
                    type="number"
                    step={formData.riskType === "fixed_quantity" ? "0.00001" : "0.01"}
                    placeholder={
                      formData.riskType === "fixed_quantity"
                        ? "Ej: 0.01"
                        : formData.riskType === "fixed_amount"
                          ? "Ej: 100"
                          : "Ej: 5"
                    }
                    value={formData.riskAmount}
                    onChange={(e) => setFormData({ ...formData, riskAmount: e.target.value })}
                    className={errors.riskAmount ? "border-destructive" : ""}
                  />
                  {errors.riskAmount && <p className="text-xs text-destructive">{errors.riskAmount}</p>}
                  {formData.riskType === "percentage" && (
                    <p className="text-xs text-muted-foreground">Debe estar entre 0 y 100</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={prevStep} variant="outline" className="bg-transparent">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Atrás
              </Button>
              <Button onClick={nextStep} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                Siguiente
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Review & Save */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Webhook de TradingView</h2>
              <p className="text-sm text-muted-foreground">
                Usa esta URL en tus alertas de TradingView para ejecutar órdenes automáticamente
              </p>

              <div className="flex gap-2">
                <Input
                  value={`https://api.biconnect.io/w/user123/strat-${Date.now()}`}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button onClick={copyWebhook} variant="outline" className="bg-transparent">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Payload JSON</h2>
              <p className="text-sm text-muted-foreground">
                Copia este payload en el mensaje de tu alerta de TradingView
              </p>

              <Textarea value={generatePayload()} readOnly className="font-mono text-sm" rows={12} />
            </div>

            <div className="flex gap-2">
              <Button onClick={prevStep} variant="outline" className="bg-transparent">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Atrás
              </Button>
              <Button onClick={handleSave} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                Guardar estrategia
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
