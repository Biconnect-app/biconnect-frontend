"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, AlertCircle, CheckCircle, Clock, TrendingUp } from "lucide-react"
import { ApiKeyAlert } from "@/components/api-key-alert"
import { Paywall } from "@/components/paywall"
import { useUserPlan } from "@/hooks/use-user-plan"

export default function ExecutionPage() {
  const { isFree, loading: planLoading } = useUserPlan()
  const [queue] = useState([
    {
      id: "exec-001",
      strategy: "BTC Scalping 5m",
      symbol: "BTCUSDT",
      side: "LONG",
      status: "pending",
      timestamp: "14:32:45",
      latency: null,
    },
    {
      id: "exec-002",
      strategy: "ETH Swing Trading",
      symbol: "ETHUSDT",
      side: "SHORT",
      status: "sent",
      timestamp: "14:32:12",
      latency: "0.8s",
    },
    {
      id: "exec-003",
      strategy: "Multi-Pair Momentum",
      symbol: "SOLUSDT",
      side: "LONG",
      status: "confirmed",
      timestamp: "14:31:48",
      latency: "1.2s",
    },
    {
      id: "exec-004",
      strategy: "BTC Scalping 5m",
      symbol: "BTCUSDT",
      side: "SHORT",
      status: "error",
      timestamp: "14:30:15",
      latency: null,
      error: "Insufficient balance",
    },
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "text-accent"
      case "error":
        return "text-destructive"
      case "sent":
        return "text-primary"
      default:
        return "text-muted-foreground"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-4 w-4" />
      case "error":
        return <AlertCircle className="h-4 w-4" />
      case "sent":
        return <TrendingUp className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

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
        <Paywall feature="La cola de ejecución en tiempo real" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="space-y-6">
        <ApiKeyAlert />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Cola de ejecución</h1>
            <p className="text-muted-foreground mt-1">Monitorea el estado de las órdenes en tiempo real</p>
          </div>
          <Button variant="outline" className="bg-transparent">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar fallidas
          </Button>
        </div>

        {/* Metrics */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-sm text-muted-foreground mb-1">Latencia p50</div>
            <div className="text-2xl font-bold text-foreground">0.8s</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-sm text-muted-foreground mb-1">Latencia p95</div>
            <div className="text-2xl font-bold text-foreground">1.2s</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-sm text-muted-foreground mb-1">Tasa de error</div>
            <div className="text-2xl font-bold text-destructive">5.5%</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-sm text-muted-foreground mb-1">En cola</div>
            <div className="text-2xl font-bold text-foreground">2</div>
          </div>
        </div>

        {/* Queue Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Timestamp</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Estrategia</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Símbolo</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Lado</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Estado</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Latencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {queue.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 text-sm font-mono text-muted-foreground">{item.timestamp}</td>
                    <td className="p-4 text-sm text-foreground">{item.strategy}</td>
                    <td className="p-4 text-sm font-medium text-foreground">{item.symbol}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                          item.side === "LONG" ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {item.side}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className={`flex items-center gap-2 ${getStatusColor(item.status)}`}>
                        {getStatusIcon(item.status)}
                        <span className="text-sm font-medium capitalize">{item.status}</span>
                      </div>
                      {item.error && <div className="text-xs text-destructive mt-1">{item.error}</div>}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{item.latency || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Error Analysis */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Análisis de errores</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="text-sm text-foreground">Insufficient balance</span>
              <span className="text-sm font-medium text-destructive">45%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="text-sm text-foreground">Rate limit exceeded</span>
              <span className="text-sm font-medium text-destructive">30%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="text-sm text-foreground">Invalid symbol</span>
              <span className="text-sm font-medium text-destructive">15%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="text-sm text-foreground">Network timeout</span>
              <span className="text-sm font-medium text-destructive">10%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
