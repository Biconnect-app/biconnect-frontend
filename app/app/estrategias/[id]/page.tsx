"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Copy, Check, Save, Search, Trash2, AlertCircle } from "lucide-react"
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
]

const LEVERAGE_OPTIONS = [1, 2, 5, 10, 20, 50, 100, 125]

export default function EditStrategyPage() {
  const router = useRouter()
  const params = useParams()
  const [copied, setCopied] = useState(false)
  const [openPairSelect, setOpenPairSelect] = useState(false)
  const [formData, setFormData] = useState<any>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [userId, setUserId] = useState<string>("")
  const [tradingPairs, setTradingPairs] = useState<string[]>(FALLBACK_TRADING_PAIRS)
  const [loadingPairs, setLoadingPairs] = useState(false)
  const [pairsError, setPairsError] = useState<string | null>(null)

  useEffect(() => {
    loadStrategy()
  }, [params.id])

  useEffect(() => {
    if (formData?.marketType && formData?.exchange) {
      fetchTradingPairs()
    }
  }, [formData?.marketType, formData?.exchange])

  const fetchTradingPairs = async () => {
    setLoadingPairs(true)
    setPairsError(null)

    try {
      const response = await fetch(`/api/exchanges/${formData.exchange}/pairs?marketType=${formData.marketType}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || "Failed to fetch pairs")
      }

      const data = await response.json()

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

  const loadStrategy = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        console.error("[v0] No user found")
        return
      }

      setUserId(user.id)

      const { data: strategy, error } = await supabase
        .from("strategies")
        .select("*")
        .eq("id", params.id)
        .eq("user_id", user.id)
        .single()

      if (error) {
        console.error("[v0] Error loading strategy:", error)
        return
      }

      console.log("[v0] Loaded strategy:", strategy)
      setFormData({
        id: strategy.id,
        name: strategy.name,
        exchange: "binance",
        description: strategy.description || "",
        pair: strategy.trading_pair,
        marketType: strategy.market_type,
        leverage: strategy.leverage || 1,
        positionSide: strategy.position_side || "long",
        riskType: strategy.risk_type,
        riskAmount: strategy.risk_value?.toString() || "",
        webhookUrl: strategy.webhook_url,
        order: strategy.order || { action: "" },
        market_position: strategy.market_position || "",
      })
    } catch (error) {
      console.error("[v0] Error in loadStrategy:", error)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido"
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "El nombre debe tener al menos 3 caracteres"
    } else if (formData.name.trim().length > 50) {
      newErrors.name = "El nombre no puede exceder 50 caracteres"
    }

    if (!formData.pair) {
      newErrors.pair = "Debes seleccionar un par"
    }

    if (!formData.marketType) {
      newErrors.marketType = "Debes seleccionar el tipo de mercado"
    }

    if (formData.marketType === "futures") {
      const leverage = Number(formData.leverage)
      if (isNaN(leverage) || leverage < 1 || leverage > 125) {
        newErrors.leverage = "El apalancamiento debe estar entre 1x y 125x"
      }
    }

    if (!formData.riskType) {
      newErrors.riskType = "Debes seleccionar un tipo de gestión"
    }

    if (!formData.riskAmount) {
      newErrors.riskAmount = "Debes ingresar una cantidad"
    } else {
      const amount = Number.parseFloat(formData.riskAmount)

      if (isNaN(amount)) {
        newErrors.riskAmount = "Debes ingresar un número válido"
      } else if (amount < 0) {
        newErrors.riskAmount = "La cantidad no puede ser negativa"
      } else if (amount === 0) {
        newErrors.riskAmount = "La cantidad debe ser mayor a 0"
      } else if (formData.riskType === "percentage") {
        if (amount > 100) {
          newErrors.riskAmount = "El porcentaje no puede ser mayor a 100"
        } else if (amount < 0.01) {
          newErrors.riskAmount = "El porcentaje debe ser al menos 0.01"
        }
      } else if (formData.riskType === "fixed_quantity") {
        if (amount < 0.00001) {
          newErrors.riskAmount = "La cantidad debe ser al menos 0.00001"
        }
      } else if (formData.riskType === "fixed_amount") {
        if (amount < 1) {
          newErrors.riskAmount = "El monto debe ser al menos 1"
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (validateForm()) {
      try {
        const supabase = createClient()

        const { error } = await supabase
          .from("strategies")
          .update({
            name: formData.name,
            description: formData.description || "",
            trading_pair: formData.pair,
            market_type: formData.marketType,
            leverage: formData.leverage || 1,
            position_side: formData.marketType === "futures" ? formData.positionSide : null,
            risk_type: formData.riskType,
            risk_value: Number.parseFloat(formData.riskAmount),
            updated_at: new Date().toISOString(),
            order: formData.order,
            market_position: formData.market_position,
          })
          .eq("id", params.id)

        if (error) {
          console.error("[v0] Error updating strategy:", error)
          return
        }

        console.log("[v0] Strategy updated successfully")
        router.push("/app/estrategias")
      } catch (error) {
        console.error("[v0] Error in handleSave:", error)
      }
    }
  }

  const handleDelete = async () => {
    if (
      !confirm(
        `¿Estás seguro de que deseas eliminar la estrategia "${formData.name}"? Esta acción no se puede deshacer.`,
      )
    ) {
      return
    }

    try {
      const supabase = createClient()

      const { error } = await supabase.from("strategies").delete().eq("id", params.id)

      if (error) {
        console.error("[v0] Error deleting strategy:", error)
        return
      }

      console.log("[v0] Strategy deleted successfully")
      router.push("/app/estrategias")
    } catch (error) {
      console.error("[v0] Error in handleDelete:", error)
    }
  }

  const copyWebhook = () => {
    const webhookUrl = formData.webhookUrl || `https://biconnect.vercel.app/api/webhook`
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getBaseCurrency = () => formData?.pair?.replace("USDT", "") || ""
  const getQuoteCurrency = () => "USDT"

  const generatePayload = () => {
    if (!formData) return ""

    const payload = {
      user_id: userId || "{{user_id}}",
      strategy_id: params.id || "{{strategy_id}}",
      action: formData.order.action || "{{strategy.order.action}}",
      market_position: formData.market_position || "{{strategy.market_position}}",
    }

    return JSON.stringify(payload, null, 2)
  }

  if (!formData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-4">
          <Link href="/app/estrategias">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Editar estrategia</h1>
            <p className="text-muted-foreground mt-1">Modifica la configuración de tu estrategia</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Información básica</h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la estrategia *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Mercado y activo</h2>

          {pairsError && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{pairsError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
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
              <>
                <div className="space-y-2">
                  <Label>Dirección *</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, positionSide: "long" })}
                      className={`relative p-4 rounded-xl border-2 transition-all ${
                        formData.positionSide === "long"
                          ? "border-accent bg-accent/10 shadow-lg ring-2 ring-accent/20"
                          : "border-border hover:border-accent/50"
                      }`}
                    >
                      {formData.positionSide === "long" && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                          <Check className="h-3 w-3 text-accent-foreground" />
                        </div>
                      )}
                      <div className="font-semibold text-foreground">Long</div>
                      <div className="text-sm text-muted-foreground mt-1">Compra (alcista)</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, positionSide: "short" })}
                      className={`relative p-4 rounded-xl border-2 transition-all ${
                        formData.positionSide === "short"
                          ? "border-accent bg-accent/10 shadow-lg ring-2 ring-accent/20"
                          : "border-border hover:border-accent/50"
                      }`}
                    >
                      {formData.positionSide === "short" && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                          <Check className="h-3 w-3 text-accent-foreground" />
                        </div>
                      )}
                      <div className="font-semibold text-foreground">Short</div>
                      <div className="text-sm text-muted-foreground mt-1">Venta (bajista)</div>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Apalancamiento *</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 5, 10, 20, 50, 100, 125].map((lev) => (
                      <button
                        key={lev}
                        type="button"
                        onClick={() => setFormData({ ...formData, leverage: lev })}
                        className={`p-2 rounded-lg border-2 text-sm font-medium transition-all ${
                          formData.leverage === lev
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-border hover:border-accent/50"
                        }`}
                      >
                        {lev}x
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Label htmlFor="custom-leverage" className="text-xs text-muted-foreground whitespace-nowrap">
                      Personalizado:
                    </Label>
                    <Input
                      id="custom-leverage"
                      type="number"
                      min="1"
                      max="125"
                      value={formData.leverage}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        if (val >= 1 && val <= 125) {
                          setFormData({ ...formData, leverage: val })
                        }
                      }}
                      className="h-8 text-sm"
                    />
                    <span className="text-xs text-muted-foreground">x</span>
                  </div>
                  {errors.leverage && <p className="text-xs text-destructive">{errors.leverage}</p>}
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Par a operar *</Label>
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
                  <div className="font-semibold text-foreground">Cantidad de contratos</div>
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
                  <div className="font-semibold text-foreground">Monto fijo</div>
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
                  <div className="font-semibold text-foreground">Porcentaje de capital</div>
                </button>
              </div>
              {errors.riskType && <p className="text-xs text-destructive">{errors.riskType}</p>}
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
                step="any"
                min="0"
                value={formData.riskAmount}
                onChange={(e) => setFormData({ ...formData, riskAmount: e.target.value })}
                className={errors.riskAmount ? "border-destructive" : ""}
              />
              {errors.riskAmount && <p className="text-xs text-destructive">{errors.riskAmount}</p>}
            </div>

            {formData.riskType && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <h3 className="text-sm font-semibold text-foreground mb-2">Ejemplo:</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {formData.riskType === "fixed_quantity" && (
                    <>
                      <li>• Si ingresas 0.1, comprarás exactamente 0.1 {getBaseCurrency()} en cada operación</li>
                      <li>• Ideal para mantener un tamaño de posición constante</li>
                      <li>• El monto en USDT variará según el precio del activo</li>
                    </>
                  )}
                  {formData.riskType === "fixed_amount" && (
                    <>
                      <li>• Si ingresas 100, invertirás 100 USDT en cada operación</li>
                      <li>• La cantidad de {getBaseCurrency()} variará según el precio del mercado</li>
                      <li>• Perfecto para gestionar un presupuesto fijo por operación</li>
                    </>
                  )}
                  {formData.riskType === "percentage" && (
                    <>
                      <li>• Si ingresas 5% con 1000 USDT de capital, invertirás 50 USDT por operación</li>
                      <li>• El monto se ajusta automáticamente según tu balance disponible</li>
                      <li>• Recomendado para gestión de riesgo proporcional a tu capital</li>
                    </>
                  )}
                </ul>
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
          <Button onClick={handleSave} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Save className="h-4 w-4 mr-2" />
            Guardar cambios
          </Button>
          <Link href="/app/estrategias">
            <Button variant="outline" className="bg-transparent">
              Cancelar
            </Button>
          </Link>
          <Button
            onClick={handleDelete}
            variant="outline"
            className="bg-transparent text-destructive hover:bg-destructive/10 ml-auto"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar estrategia
          </Button>
        </div>
      </div>
    </div>
  )
}
