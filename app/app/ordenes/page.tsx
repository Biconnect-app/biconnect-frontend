"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download, Search } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ApiKeyAlert } from "@/components/api-key-alert"
import { Paywall } from "@/components/paywall"
import { useUserPlan } from "@/hooks/use-user-plan"

export default function OrdersPage() {
  const { isFree, loading: planLoading } = useUserPlan()
  const [orders] = useState([
    {
      id: "ord-001",
      timestamp: "2024-01-15 14:32:15",
      exchange: "Binance Futuros",
      symbol: "BTCUSDT",
      side: "LONG",
      qty: "0.01",
      type: "MARKET",
      price: "43,500",
      status: "FILLED",
      txId: "abc123xyz",
      clientOrderId: "strat-001-sig-456",
      strategy: "BTC Scalping 5m",
    },
    {
      id: "ord-002",
      timestamp: "2024-01-15 14:28:03",
      exchange: "Binance Spot",
      symbol: "ETHUSDT",
      side: "SELL",
      qty: "0.5",
      type: "LIMIT",
      price: "2,280",
      status: "FILLED",
      txId: "def456uvw",
      clientOrderId: "strat-002-sig-789",
      strategy: "ETH Swing Trading",
    },
    {
      id: "ord-003",
      timestamp: "2024-01-15 14:20:45",
      exchange: "Binance Futuros",
      symbol: "SOLUSDT",
      side: "LONG",
      qty: "10",
      type: "MARKET",
      price: "98.5",
      status: "FILLED",
      txId: "ghi789rst",
      clientOrderId: "strat-003-sig-012",
      strategy: "Multi-Pair Momentum",
    },
    {
      id: "ord-004",
      timestamp: "2024-01-15 14:15:30",
      exchange: "Binance Futuros",
      symbol: "BTCUSDT",
      side: "SHORT",
      qty: "0.02",
      type: "MARKET",
      price: "43,200",
      status: "REJECTED",
      txId: null,
      clientOrderId: "strat-001-sig-345",
      strategy: "BTC Scalping 5m",
    },
  ])

  if (planLoading) {
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
            <p className="text-muted-foreground mt-1">Historial completo de órdenes ejecutadas</p>
          </div>
          <Button variant="outline" className="bg-transparent">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Filtros</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date-from">Desde</Label>
              <Input id="date-from" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-to">Hasta</Label>
              <Input id="date-to" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="symbol">Símbolo</Label>
              <Input id="symbol" placeholder="BTCUSDT" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="strategy">Estrategia</Label>
              <Select>
                <SelectTrigger id="strategy">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="strat-001">BTC Scalping 5m</SelectItem>
                  <SelectItem value="strat-002">ETH Swing Trading</SelectItem>
                  <SelectItem value="strat-003">Multi-Pair Momentum</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Timestamp</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Exchange</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Símbolo</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Lado</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Cantidad</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Tipo</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Precio</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Estado</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">TX ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 text-sm font-mono text-muted-foreground">{order.timestamp}</td>
                    <td className="p-4 text-sm text-foreground">{order.exchange}</td>
                    <td className="p-4 text-sm font-medium text-foreground">{order.symbol}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                          order.side === "LONG" || order.side === "BUY"
                            ? "bg-accent/10 text-accent"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {order.side}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-foreground">{order.qty}</td>
                    <td className="p-4 text-sm text-muted-foreground">{order.type}</td>
                    <td className="p-4 text-sm text-foreground">${order.price}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                          order.status === "FILLED"
                            ? "bg-accent/10 text-accent"
                            : order.status === "REJECTED"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-mono text-muted-foreground">{order.txId || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
