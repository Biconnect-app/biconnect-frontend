"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowRight, ArrowLeft, Check, Search, Sparkles, AlertCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

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

export default function PreviewStrategyPage() {
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
    email: "", // Added email field
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        console.log("[v0] User is already logged in, redirecting to create strategy")
        // Save current form data to sessionStorage before redirecting
        if (formData.name || formData.pair) {
          sessionStorage.setItem("previewStrategy", JSON.stringify(formData))
        }
        router.push("/app/estrategias/nueva")
      }
    }
    checkAuth()
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
        "Mostrando lista limitada de pares populares. Conecta tu exchange después del registro para ver todos los pares disponibles.",
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

  const copyWebhook = () => {
    const webhookUrl = `https://biconnect.vercel.app/api/webhook`
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getBaseCurrency = () => formData.pair.split("/")[0] || "Cripto"
  const getQuoteCurrency = () => formData.pair.split("/")[1] || "USDT"

  const generatePayload = () => {
    const payload = {
      user_id: "{{user_id}}",
      strategy_id: "{{strategy_id}}",
    }

    return JSON.stringify(payload, null, 2)
  }

  const handleRegisterClick = async () => {
    console.log("[v0] User clicked register from preview, saving strategy to database")

    try {
      const supabase = createClient()

      // Save to pending_strategies table
      const { error } = await supabase.from("pending_strategies").insert({
        email: formData.email || "temp@preview.com", // Will be updated with actual email during registration
        strategy_data: formData,
      })

      if (error) {
        console.error("[v0] Error saving pending strategy:", error)
        // Fallback to sessionStorage if database save fails
        sessionStorage.setItem("previewStrategy", JSON.stringify(formData))
        sessionStorage.setItem("fromPreview", "true")
      } else {
        console.log("[v0] Pending strategy saved to database")
        // Also save to sessionStorage as backup
        sessionStorage.setItem("previewStrategy", JSON.stringify(formData))
        sessionStorage.setItem("fromPreview", "true")
      }
    } catch (error) {
      console.error("[v0] Error in handleRegisterClick:", error)
      // Fallback to sessionStorage
      sessionStorage.setItem("previewStrategy", JSON.stringify(formData))
      sessionStorage.setItem("fromPreview", "true")
    }
  }

  const handleLoginClick = async () => {
    console.log("[v0] User clicked login from preview, saving strategy to database")

    try {
      const supabase = createClient()

      // Save to pending_strategies table
      const { error } = await supabase.from("pending_strategies").insert({
        email: formData.email || "temp@preview.com",
        strategy_data: formData,
      })

      if (error) {
        console.error("[v0] Error saving pending strategy:", error)
        // Fallback to sessionStorage if database save fails
        sessionStorage.setItem("previewStrategy", JSON.stringify(formData))
        sessionStorage.setItem("fromPreview", "true")
      } else {
        console.log("[v0] Pending strategy saved to database")
        // Also save to sessionStorage as backup
        sessionStorage.setItem("previewStrategy", JSON.stringify(formData))
        sessionStorage.setItem("fromPreview", "true")
      }
    } catch (error) {
      console.error("[v0] Error in handleLoginClick:", error)
      // Fallback to sessionStorage
      sessionStorage.setItem("previewStrategy", JSON.stringify(formData))
      sessionStorage.setItem("fromPreview", "true")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Preview Banner */}
      <div className="bg-accent/10 border-b border-accent/20 py-3 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            <span className="text-sm font-medium text-foreground">
              Modo Preview - Explora cómo funciona sin registrarte
            </span>
          </div>
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              Volver al inicio
            </Button>
          </Link>
        </div>
      </div>

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
                      <div className="font-semibold text-foreground">
                        Cantidad fija ({getBaseCurrency() || "Cripto"})
                      </div>
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

          {/* Step 5: Registration CTA */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-accent/10 via-accent/5 to-background border-2 border-accent/20 rounded-xl p-8 text-center space-y-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-accent/20 rounded-full mb-2">
                  <Sparkles className="h-8 w-8 text-accent" />
                </div>

                <div className="space-y-3">
                  <h2 className="text-3xl font-bold text-foreground">¡Excelente configuración!</h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Has completado la configuración de tu estrategia{" "}
                    <span className="font-semibold text-foreground">{formData.name}</span>. Para guardarla y comenzar a
                    ejecutar operaciones automáticas, necesitas crear una cuenta.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-lg p-6 space-y-3 text-left max-w-md mx-auto">
                  <h3 className="font-semibold text-foreground text-center mb-4">Tu estrategia incluye:</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Par:</span>
                      <span className="font-medium text-foreground">{formData.pair}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mercado:</span>
                      <span className="font-medium text-foreground capitalize">{formData.marketType}</span>
                    </div>
                    {formData.marketType === "futures" && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Apalancamiento:</span>
                        <span className="font-medium text-foreground">{formData.leverage}x</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gestión de riesgo:</span>
                      <span className="font-medium text-foreground">
                        {formData.riskType === "fixed_quantity" && `${formData.riskAmount} ${getBaseCurrency()}`}
                        {formData.riskType === "fixed_amount" && `${formData.riskAmount} USDT`}
                        {formData.riskType === "percentage" && `${formData.riskAmount}% del capital`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-4">
                  <Link href="/registro?from=preview" className="block" onClick={handleRegisterClick}>
                    <Button
                      size="lg"
                      className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg h-14 px-8 w-full max-w-md"
                    >
                      Crear cuenta gratis
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    ¿Ya tienes cuenta?{" "}
                    <Link
                      href="/login?from=preview"
                      className="text-accent hover:underline font-medium"
                      onClick={handleLoginClick}
                    >
                      Inicia sesión aquí
                    </Link>
                  </p>
                </div>

                <div className="pt-6 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Al registrarte, podrás guardar esta estrategia y comenzar a operar automáticamente con el plan
                    gratuito (100 ejecuciones/mes)
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <Button onClick={prevStep} variant="outline" className="bg-transparent">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver atrás
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
