"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Check, Search, Moon, Sun } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import Link from "next/link"
import { onAuthStateChanged } from "firebase/auth"
import { firebaseAuth } from "@/lib/firebase/client"
import { useTheme } from "next-themes"

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

export default function PreviewStrategyPage() {
  const router = useRouter()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [copied, setCopied] = useState(false)
  const [openPairSelect, setOpenPairSelect] = useState(false)
  const [tradingPairs, setTradingPairs] = useState<string[]>(FALLBACK_TRADING_PAIRS)
  const [loadingPairs, setLoadingPairs] = useState(false)
  const [pairsError, setPairsError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    exchange: "",
    description: "",
    pair: "",
    marketType: "",
    leverage: 1,
    positionSide: "long",
    riskType: "",
    riskAmount: "",
    email: "", // Added email field
    action: "", // Added action field
    market_position: "", // Added market_position field
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      if (user) {
        const hasAnyData =
          formData.name.trim() !== "" ||
          formData.exchange !== "" ||
          formData.marketType !== "" ||
          formData.pair !== "" ||
          formData.riskType !== "" ||
          formData.riskAmount !== ""

        if (hasAnyData) {
          sessionStorage.setItem("previewStrategy", JSON.stringify(formData))
        }
        router.push("/dashboard/estrategias/nueva")
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/session-status")
        const data = await response.json()
        if (data.authenticated) {
          router.replace("/dashboard/estrategias")
        }
      } catch (error) {
        console.error("Error checking session status:", error)
      }
    }

    checkSession()
  }, [router])

  useEffect(() => {
    if (formData.marketType && formData.exchange) {
      fetchTradingPairs()
    }
  }, [formData.marketType, formData.exchange])

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
      console.error("Error fetching trading pairs:", error)
      setPairsError(
        "Mostrando lista limitada de pares populares. Conecta tu exchange después del registro para ver todos los pares disponibles.",
      )
      setTradingPairs(FALLBACK_TRADING_PAIRS)
    } finally {
      setLoadingPairs(false)
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

    if (!formData.exchange) {
      newErrors.exchange = "Debes seleccionar un exchange"
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

    if (!formData.pair) {
      newErrors.pair = "Debes seleccionar un par"
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

  const copyWebhook = () => {
    const webhookUrl = `https://api-92000983434.southamerica-east1.run.app/api/webhook`
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
      action: "{{strategy.order.action}}",
      market_position: "{{strategy.market_position}}",
    }

    return JSON.stringify(payload, null, 2)
  }

  const handleRegisterClick = async (e: React.MouseEvent) => {
    // Verificar si el usuario ingresó algún dato (excluyendo valores por defecto)
    const hasAnyData = 
      formData.name.trim() !== "" ||
      formData.exchange !== "" ||
      formData.marketType !== "" ||
      formData.pair !== "" ||
      formData.riskType !== "" ||
      formData.riskAmount !== ""

    // Solo guardar si hay al menos un dato ingresado
    if (hasAnyData) {
      const strategyToSave = {
        ...formData,
        name: formData.name.trim() || "",
        exchange: formData.exchange || "",
        marketType: formData.marketType || "",
        pair: formData.pair || "",
        leverage: formData.leverage || 0,
        positionSide: formData.positionSide || "",
        riskType: formData.riskType || "",
        riskAmount: formData.riskAmount || "",
      }

      // Usar localStorage para persistir entre pestañas y navegación
      localStorage.setItem("previewStrategy", JSON.stringify(strategyToSave))
      localStorage.setItem("fromPreview", "true")
      sessionStorage.setItem("previewStrategy", JSON.stringify(strategyToSave))
      sessionStorage.setItem("fromPreview", "true")
      console.log("📝 Preview - Saved strategy to storage:", { name: strategyToSave.name, exchange: strategyToSave.exchange })
    } else {
      console.log("⚠️ Preview - No data to save (all fields empty)")
    }
  }

  const handleLoginClick = async (e: React.MouseEvent) => {
    // Verificar si el usuario ingresó algún dato (excluyendo valores por defecto)
    const hasAnyData = 
      formData.name.trim() !== "" ||
      formData.exchange !== "" ||
      formData.marketType !== "" ||
      formData.pair !== "" ||
      formData.riskType !== "" ||
      formData.riskAmount !== ""

    // Solo guardar si hay al menos un dato ingresado
    if (hasAnyData) {
      const strategyToSave = {
        ...formData,
        name: formData.name.trim() || "",
        exchange: formData.exchange || "",
        marketType: formData.marketType || "",
        pair: formData.pair || "",
        leverage: formData.leverage || 0,
        positionSide: formData.positionSide || "",
        riskType: formData.riskType || "",
        riskAmount: formData.riskAmount || "",
      }

      // Usar localStorage para persistir entre pestañas y navegación
      localStorage.setItem("previewStrategy", JSON.stringify(strategyToSave))
      localStorage.setItem("fromPreview", "true")
      sessionStorage.setItem("previewStrategy", JSON.stringify(strategyToSave))
      sessionStorage.setItem("fromPreview", "true")
      console.log("📝 Preview - Saved strategy to storage:", { name: strategyToSave.name, exchange: strategyToSave.exchange })
    } else {
      console.log("⚠️ Preview - No data to save (all fields empty)")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Logo */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold">C</span>
              </div>
              <span className="text-xl font-bold text-foreground">Cuanted</span>
            </Link>
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg bg-card border border-border hover:bg-accent/10 transition-colors"
              aria-label="Toggle theme"
            >
              {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6 max-w-3xl mx-auto">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Crea tu primera estrategia</h1>
            <p className="text-white mt-1">Configura una nueva estrategia de trading automatizado</p>
          </div>

          {/* Información básica */}
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
            </div>
          </div>

          {/* Mercado y activo */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Mercado y activo</h2>

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
                {errors.exchange && <p className="text-xs text-destructive">{errors.exchange}</p>}
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
                    <div className="text-sm text-white mt-1">Compra/venta directa</div>
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
                    <div className="text-sm text-white mt-1">Con apalancamiento</div>
                  </button>
                </div>
                {errors.marketType && <p className="text-xs text-destructive">{errors.marketType}</p>}
              </div>

              {/* Apalancamiento (solo para futuros) */}
              {formData.marketType === "futures" && (
                <div className="space-y-3">
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
                        <div className="text-sm text-white mt-1">Compra (alcista)</div>
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
                        <div className="text-sm text-white mt-1">Venta (bajista)</div>
                      </button>
                    </div>
                  </div>

                  <Label>Apalancamiento</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {QUICK_LEVERAGE_OPTIONS.map((lev) => (
                      <button
                        key={lev}
                        type="button"
                        onClick={() => setFormData({ ...formData, leverage: lev })}
                        className={`relative px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                          formData.leverage === lev
                            ? "border-accent bg-accent/20 shadow-lg ring-2 ring-accent/30 text-accent"
                            : "border-border hover:border-accent/50 text-white hover:text-foreground"
                        }`}
                      >
                        {formData.leverage === lev && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full flex items-center justify-center">
                            <Check className="h-2.5 w-2.5 text-accent-foreground" />
                          </div>
                        )}
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
                    <span className="text-sm text-white">Personalizado (1-125x)</span>
                  </div>
                  <p className="text-xs text-white">Multiplica tus ganancias (y pérdidas) potenciales</p>
                </div>
              )}

              {/* Par de trading */}
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
                <p className="text-xs text-white">
                  {loadingPairs
                    ? "Cargando pares disponibles desde Binance..."
                    : `${tradingPairs.length} pares ${pairsError ? "populares" : "disponibles"}`}
                </p>
              </div>
            </div>
          </div>

          {/* Gestión del riesgo */}
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

              {formData.riskType && (
                <div className="space-y-2">
                  <Label htmlFor="risk-amount">
                    {formData.riskType === "fixed_quantity" && "Cantidad *"}
                    {formData.riskType === "fixed_amount" && "Monto *"}
                    {formData.riskType === "percentage" && "Porcentaje *"}
                  </Label>
                  <Input
                    id="risk-amount"
                    type="text"
                    inputMode="decimal"
                    placeholder={
                      formData.riskType === "fixed_quantity"
                        ? "Ej: 0.5"
                        : formData.riskType === "fixed_amount"
                          ? "Ej: 1000"
                          : "Ej: 5"
                    }
                    value={formData.riskAmount}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === "" || /^\d*\.?\d*$/.test(val)) {
                        setFormData({ ...formData, riskAmount: val })
                      }
                    }}
                    className={errors.riskAmount ? "border-destructive" : ""}
                  />
                  {errors.riskAmount && <p className="text-xs text-destructive">{errors.riskAmount}</p>}
                  {formData.riskType === "percentage" && (
                    <p className="text-xs text-white">Debe estar entre 0 y 100</p>
                  )}
                </div>
              )}

              {formData.riskType && (
                <div className="mt-4 p-4 bg-muted/30 border border-border/50 rounded-lg">
                  <h3 className="text-sm font-semibold text-foreground mb-2">Ejemplo:</h3>
                  {formData.riskType === "fixed_quantity" && (
                    <div className="space-y-1 text-sm text-white">
                      <p>
                        Si ingresas <span className="font-semibold text-foreground">0.5</span> contratos de BTC/USDT:
                      </p>
                      <p>• Cada orden comprará o venderá exactamente 0.5 BTC</p>
                      <p>• Si el precio de BTC es $50,000, el tamaño de la orden será $25,000</p>
                    </div>
                  )}
                  {formData.riskType === "fixed_amount" && (
                    <div className="space-y-1 text-sm text-white">
                      <p>
                        Si ingresas <span className="font-semibold text-foreground">$1,000</span> como monto fijo:
                      </p>
                      <p>• Cada orden usará exactamente $1,000 USDT</p>
                      <p>• Si el precio de BTC es $50,000, comprará 0.02 BTC</p>
                    </div>
                  )}
                  {formData.riskType === "percentage" && (
                    <div className="space-y-1 text-sm text-white">
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

          {/* Botones de acción finales */}
          <Link href="/registro" onClick={handleRegisterClick}>
            <Button className="w-full h-12 text-base bg-accent hover:bg-accent/90 text-accent-foreground">
              Crear estrategia
            </Button>
          </Link>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" onClick={handleLoginClick} className="text-primary font-semibold hover:underline">
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
