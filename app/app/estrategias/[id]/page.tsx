"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Copy, Check, Save, Search, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import Link from "next/link"

const TRADING_PAIRS = [
  "BTCUSDT",
  "ETHUSDT",
  "BNBUSDT",
  "SOLUSDT",
  "XRPUSDT",
  "ADAUSDT",
  "DOGEUSDT",
  "AVAXUSDT",
  "DOTUSDT",
  "MATICUSDT",
  "LINKUSDT",
  "UNIUSDT",
  "LTCUSDT",
  "ATOMUSDT",
  "ETCUSDT",
  "XLMUSDT",
  "NEARUSDT",
  "ALGOUSDT",
  "FILUSDT",
  "APTUSDT",
  "ARBUSDT",
  "OPUSDT",
  "SUIUSDT",
  "SEIUSDT",
  "TIAUSDT",
  "WLDUSDT",
  "PEPEUSDT",
  "SHIBUSDT",
  "INJUSDT",
  "RUNEUSDT",
  "FTMUSDT",
  "AAVEUSDT",
  "GRTUSDT",
  "SNXUSDT",
  "MKRUSDT",
  "LDOUSDT",
  "CRVUSDT",
  "COMPUSDT",
  "SUSHIUSDT",
  "YFIUSDT",
  "1INCHUSDT",
  "BALUSDT",
  "ZRXUSDT",
  "ENJUSDT",
  "MANAUSDT",
  "SANDUSDT",
  "AXSUSDT",
  "GALAUSDT",
  "CHZUSDT",
  "FLOWUSDT",
  "IMXUSDT",
  "APEUSDT",
  "BLURUSDT",
  "MAGICUSDT",
  "GMTUSDT",
  "TRXUSDT",
  "TONUSDT",
  "ICPUSDT",
  "STXUSDT",
  "RENDERUSDT",
  "FETUSDT",
  "TAOUSDT",
  "WIFUSDT",
  "BONKUSDT",
  "JUPUSDT",
  "PYTHUSDT",
]

const LEVERAGE_OPTIONS = [1, 2, 3, 5, 10, 20, 25, 50, 75, 100, 125]

export default function EditStrategyPage() {
  const router = useRouter()
  const params = useParams()
  const [copied, setCopied] = useState(false)
  const [openPairSelect, setOpenPairSelect] = useState(false)
  const [formData, setFormData] = useState<any>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    // Load strategy from localStorage
    const saved = localStorage.getItem("strategies")
    if (saved) {
      const strategies = JSON.parse(saved)
      const strategy = strategies.find((s: any) => s.id === params.id)
      if (strategy) {
        setFormData(strategy)
      }
    }
  }, [params.id])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = "El nombre es requerido"
    if (!formData.pair) newErrors.pair = "Debes seleccionar un par"
    if (!formData.marketType) newErrors.marketType = "Debes seleccionar el tipo de mercado"
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

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (validateForm()) {
      // Update strategy in localStorage
      const saved = localStorage.getItem("strategies")
      if (saved) {
        const strategies = JSON.parse(saved)
        const updated = strategies.map((s: any) => (s.id === params.id ? formData : s))
        localStorage.setItem("strategies", JSON.stringify(updated))
        router.push("/app/estrategias")
      }
    }
  }

  const handleDelete = () => {
    if (
      confirm(
        `¿Estás seguro de que deseas eliminar la estrategia "${formData.name}"? Esta acción no se puede deshacer.`,
      )
    ) {
      const saved = localStorage.getItem("strategies")
      if (saved) {
        const strategies = JSON.parse(saved)
        const updated = strategies.filter((s: any) => s.id !== params.id)
        localStorage.setItem("strategies", JSON.stringify(updated))
        router.push("/app/estrategias")
      }
    }
  }

  const copyWebhook = () => {
    const webhookUrl = `https://api.biconnect.io/w/user123/${params.id}`
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getBaseCurrency = () => formData?.pair?.replace("USDT", "") || ""
  const getQuoteCurrency = () => "USDT"

  const generatePayload = () => {
    if (!formData) return ""

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

        {/* Basic Info */}
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
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Trading Pair */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Par de trading</h2>

          <div className="space-y-2">
            <Label>Par a operar *</Label>
            <Popover open={openPairSelect} onOpenChange={setOpenPairSelect}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openPairSelect}
                  className={`w-full justify-between bg-transparent ${errors.pair ? "border-destructive" : ""}`}
                >
                  {formData.pair || "Buscar par..."}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar par..." />
                  <CommandList>
                    <CommandEmpty>No se encontró el par.</CommandEmpty>
                    <CommandGroup>
                      {TRADING_PAIRS.map((pair) => (
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
          </div>
        </div>

        {/* Market Type & Leverage */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Tipo de mercado</h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de operación *</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, marketType: "spot", leverage: 1 })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.marketType === "spot"
                      ? "border-accent bg-accent/5"
                      : "border-border hover:border-accent/50"
                  }`}
                >
                  <div className="font-semibold text-foreground">Spot</div>
                  <div className="text-sm text-muted-foreground mt-1">Compra/venta directa</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, marketType: "futures" })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.marketType === "futures"
                      ? "border-accent bg-accent/5"
                      : "border-border hover:border-accent/50"
                  }`}
                >
                  <div className="font-semibold text-foreground">Futuros</div>
                  <div className="text-sm text-muted-foreground mt-1">Con apalancamiento</div>
                </button>
              </div>
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
              </div>
            )}
          </div>
        </div>

        {/* Risk Management */}
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
                  <div className="font-semibold text-foreground">Cantidad fija ({getBaseCurrency()})</div>
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
                  <div className="font-semibold text-foreground">Monto fijo ({getQuoteCurrency()})</div>
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
                  <div className="font-semibold text-foreground">% del capital ({getQuoteCurrency()})</div>
                </button>
              </div>
            </div>

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
                value={formData.riskAmount}
                onChange={(e) => setFormData({ ...formData, riskAmount: e.target.value })}
                className={errors.riskAmount ? "border-destructive" : ""}
              />
              {errors.riskAmount && <p className="text-xs text-destructive">{errors.riskAmount}</p>}
            </div>
          </div>
        </div>

        {/* Webhook & Payload */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Webhook de TradingView</h2>

          <div className="flex gap-2">
            <Input value={`https://api.biconnect.io/w/user123/${params.id}`} readOnly className="font-mono text-sm" />
            <Button onClick={copyWebhook} variant="outline" className="bg-transparent">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Payload JSON</h2>

          <Textarea value={generatePayload()} readOnly className="font-mono text-sm" rows={12} />
        </div>

        {/* Actions */}
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
