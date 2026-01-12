"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download, Search, TrendingUp, TrendingDown, Activity } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ApiKeyAlert } from "@/components/api-key-alert"
import { Paywall } from "@/components/paywall"
import { useUserPlan } from "@/hooks/use-user-plan"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Operacion {
  id: number
  created_at: string
  user_id: string
  strategy_id: string
  status: string
  stage: string
  message: string
  http_status: number | null
  action_original: string | null
  action_internal: string | null
  close_position: boolean | null
  exchange_name: string | null
  market_type: string | null
  position_side: string | null
  trading_pair: string | null
  symbol: string | null
  risk_type: string | null
  risk_value: number | null
  leverage: number | null
  quantity_requested: number | null
  quantity: number | null
  price: number | null
  side: string | null
  order_position_side: string | null
}

interface Strategy {
  id: string
  name: string
}

export default function OrdersPage() {
  const { isFree, loading: planLoading } = useUserPlan()
  const [operaciones, setOperaciones] = useState<Operacion[]>([])
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [loading, setLoading] = useState(true)
  const [filteredOperaciones, setFilteredOperaciones] = useState<Operacion[]>([])

  // Filters
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [symbolFilter, setSymbolFilter] = useState("")
  const [strategyFilter, setStrategyFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [dateFrom, dateTo, symbolFilter, strategyFilter, statusFilter, operaciones])

  const loadData = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data: operacionesData, error: operacionesError } = await supabase
        .from("operaciones")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (operacionesError) {
        console.error("Error loading operaciones:", operacionesError)
      } else {
        setOperaciones(operacionesData || [])
      }

      const { data: strategiesData, error: strategiesError } = await supabase
        .from("strategies")
        .select("id, name")
        .eq("user_id", user.id)

      if (strategiesError) {
        console.error("Error loading strategies:", strategiesError)
      } else {
        setStrategies(strategiesData || [])
      }

      setLoading(false)
    } catch (error) {
      console.error("Error in loadData:", error)
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...operaciones]

    // Filter by date range
    if (dateFrom) {
      filtered = filtered.filter((op) => new Date(op.created_at) >= new Date(dateFrom))
    }
    if (dateTo) {
      const endDate = new Date(dateTo)
      endDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter((op) => new Date(op.created_at) <= endDate)
    }

    // Filter by symbol
    if (symbolFilter) {
      filtered = filtered.filter(
        (op) =>
          op.symbol?.toLowerCase().includes(symbolFilter.toLowerCase()) ||
          op.trading_pair?.toLowerCase().includes(symbolFilter.toLowerCase()),
      )
    }

    // Filter by strategy
    if (strategyFilter !== "all") {
      filtered = filtered.filter((op) => op.strategy_id === strategyFilter)
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((op) => op.status.toLowerCase() === statusFilter.toLowerCase())
    }

    setFilteredOperaciones(filtered)
  }

  const exportToCSV = () => {
    const headers = [
      "Timestamp",
      "Exchange",
      "Símbolo",
      "Tipo Mercado",
      "Lado",
      "Cantidad",
      "Precio",
      "Estado",
      "Mensaje",
      "Apalancamiento",
    ]

    const rows = filteredOperaciones.map((op) => [
      new Date(op.created_at).toLocaleString("es-AR"),
      op.exchange_name || "-",
      op.symbol || op.trading_pair || "-",
      op.market_type || "-",
      op.side || op.action_internal || "-",
      op.quantity || op.quantity_requested || "-",
      op.price || "-",
      op.status,
      op.message,
      op.leverage || "-",
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `operaciones_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const kpis = {
    total: filteredOperaciones.length,
    exitosas: filteredOperaciones.filter((op) => op.status.toLowerCase() === "success").length,
    fallidas: filteredOperaciones.filter((op) => op.status.toLowerCase() === "error").length,
    volumenTotal: filteredOperaciones.reduce((sum, op) => {
      const qty = op.quantity || op.quantity_requested || 0
      const price = op.price || 0
      return sum + qty * price
    }, 0),
  }

  const winRate = kpis.total > 0 ? ((kpis.exitosas / kpis.total) * 100).toFixed(1) : "0.0"

  if (planLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  if (isFree) {
    return (
      <div>
        <ApiKeyAlert />
        <Paywall feature="El historial completo de órdenes" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="space-y-6">
        <ApiKeyAlert />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Órdenes</h1>
            <p className="text-muted-foreground mt-1">Historial completo de operaciones ejecutadas</p>
          </div>
          <Button
            variant="outline"
            className="bg-transparent"
            onClick={exportToCSV}
            disabled={filteredOperaciones.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Operaciones</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.total}</div>
              <p className="text-xs text-muted-foreground">
                {kpis.exitosas} exitosas, {kpis.fallidas} fallidas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Éxito</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{winRate}%</div>
              <p className="text-xs text-muted-foreground">
                {kpis.exitosas} de {kpis.total} operaciones
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Operaciones Exitosas</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{kpis.exitosas}</div>
              <p className="text-xs text-muted-foreground">Completadas correctamente</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Operaciones Fallidas</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{kpis.fallidas}</div>
              <p className="text-xs text-muted-foreground">Con errores</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Filtros</h2>
          <div className="grid md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date-from">Desde</Label>
              <Input id="date-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-to">Hasta</Label>
              <Input id="date-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="symbol">Símbolo</Label>
              <Input
                id="symbol"
                placeholder="BTCUSDT"
                value={symbolFilter}
                onChange={(e) => setSymbolFilter(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="strategy">Estrategia</Label>
              <Select value={strategyFilter} onValueChange={setStrategyFilter}>
                <SelectTrigger id="strategy">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {strategies.map((strategy) => (
                    <SelectItem key={strategy.id} value={strategy.id}>
                      {strategy.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="success">Exitosas</SelectItem>
                  <SelectItem value="error">Fallidas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={applyFilters}>
              <Search className="h-4 w-4 mr-2" />
              Aplicar Filtros
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setDateFrom("")
                setDateTo("")
                setSymbolFilter("")
                setStrategyFilter("all")
                setStatusFilter("all")
              }}
            >
              Limpiar Filtros
            </Button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            {filteredOperaciones.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay operaciones para mostrar</p>
                {(dateFrom || dateTo || symbolFilter || strategyFilter !== "all" || statusFilter !== "all") && (
                  <p className="text-sm mt-2">Intenta ajustar los filtros</p>
                )}
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-foreground">Timestamp</th>
                    <th className="text-left p-4 text-sm font-semibold text-foreground">Exchange</th>
                    <th className="text-left p-4 text-sm font-semibold text-foreground">Símbolo</th>
                    <th className="text-left p-4 text-sm font-semibold text-foreground">Mercado</th>
                    <th className="text-left p-4 text-sm font-semibold text-foreground">Lado</th>
                    <th className="text-left p-4 text-sm font-semibold text-foreground">Cantidad</th>
                    <th className="text-left p-4 text-sm font-semibold text-foreground">Precio</th>
                    <th className="text-left p-4 text-sm font-semibold text-foreground">Estado</th>
                    <th className="text-left p-4 text-sm font-semibold text-foreground">Mensaje</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredOperaciones.map((operacion) => (
                    <tr key={operacion.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4 text-sm font-mono text-muted-foreground">
                        {new Date(operacion.created_at).toLocaleString("es-AR")}
                      </td>
                      <td className="p-4 text-sm text-foreground">{operacion.exchange_name || "-"}</td>
                      <td className="p-4 text-sm font-medium text-foreground">
                        {operacion.symbol || operacion.trading_pair || "-"}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{operacion.market_type || "-"}</td>
                      <td className="p-4">
                        <span
                          className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                            operacion.side?.toLowerCase() === "buy" ||
                            operacion.action_internal?.toLowerCase() === "long" ||
                            operacion.position_side?.toLowerCase() === "long"
                              ? "bg-accent/10 text-accent"
                              : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {operacion.side || operacion.action_internal || operacion.position_side || "-"}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-foreground">
                        {operacion.quantity || operacion.quantity_requested || "-"}
                      </td>
                      <td className="p-4 text-sm text-foreground">
                        {operacion.price ? `$${operacion.price.toLocaleString()}` : "-"}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                            operacion.status.toLowerCase() === "success"
                              ? "bg-accent/10 text-accent"
                              : operacion.status.toLowerCase() === "error"
                                ? "bg-destructive/10 text-destructive"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {operacion.status}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground max-w-xs truncate" title={operacion.message}>
                        {operacion.message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
