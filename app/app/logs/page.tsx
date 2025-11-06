"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download, Search, ChevronRight } from "lucide-react"
import { ApiKeyAlert } from "@/components/api-key-alert"
import { Paywall } from "@/components/paywall"
import { useUserPlan } from "@/hooks/use-user-plan"

export default function LogsPage() {
  const { isFree, loading: planLoading } = useUserPlan()
  const [logs] = useState([
    {
      id: "log-001",
      timestamp: "2024-01-15 14:32:45.123",
      traceId: "trace-abc123",
      strategy: "BTC Scalping 5m",
      clientOrderId: "strat-001-sig-456",
      events: [
        { time: "14:32:45.123", stage: "received", message: "Webhook payload received", status: "success" },
        { time: "14:32:45.234", stage: "validation", message: "Payload validated successfully", status: "success" },
        { time: "14:32:45.345", stage: "decision", message: "Order decision: LONG BTCUSDT 0.01", status: "success" },
        { time: "14:32:45.456", stage: "send", message: "Order sent to Binance Futuros", status: "success" },
        { time: "14:32:45.789", stage: "response", message: "Order filled @ 43,500", status: "success" },
      ],
    },
    {
      id: "log-002",
      timestamp: "2024-01-15 14:25:12.456",
      traceId: "trace-def456",
      strategy: "Multi-Pair Momentum",
      clientOrderId: "strat-003-sig-789",
      events: [
        { time: "14:25:12.456", stage: "received", message: "Webhook payload received", status: "success" },
        { time: "14:25:12.567", stage: "validation", message: "Payload validated successfully", status: "success" },
        { time: "14:25:12.678", stage: "decision", message: "Order decision: LONG SOLUSDT 10", status: "success" },
        { time: "14:25:12.789", stage: "send", message: "Order sent to Binance Futuros", status: "success" },
        { time: "14:25:12.890", stage: "response", message: "Error: Insufficient balance", status: "error" },
      ],
    },
  ])

  const [expandedLog, setExpandedLog] = useState<string | null>(null)

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
        <Paywall feature="Los logs y auditoría completa" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="space-y-6">
        <ApiKeyAlert />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Logs y auditoría</h1>
            <p className="text-muted-foreground mt-1">Trazabilidad completa de cada señal</p>
          </div>
          <Button variant="outline" className="bg-transparent">
            <Download className="h-4 w-4 mr-2" />
            Descargar logs
          </Button>
        </div>

        {/* Search */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Buscar</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client-order-id">Client Order ID</Label>
              <Input id="client-order-id" placeholder="strat-001-sig-456" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trace-id">Trace ID</Label>
              <Input id="trace-id" placeholder="trace-abc123" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="strategy-search">Estrategia</Label>
              <Input id="strategy-search" placeholder="BTC Scalping 5m" />
            </div>
          </div>
          <div className="mt-4">
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>
        </div>

        {/* Logs Timeline */}
        <div className="space-y-4">
          {logs.map((log) => (
            <div key={log.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                className="w-full p-6 flex items-center justify-between hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start gap-4 flex-1 text-left">
                  <div className="text-sm font-mono text-muted-foreground mt-1">{log.timestamp}</div>
                  <div className="flex-1">
                    <div className="font-medium text-foreground mb-1">{log.strategy}</div>
                    <div className="text-sm text-muted-foreground">
                      Trace ID: {log.traceId} • Client Order ID: {log.clientOrderId}
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      log.events[log.events.length - 1].status === "success"
                        ? "bg-accent/10 text-accent"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {log.events[log.events.length - 1].status === "success" ? "Éxito" : "Error"}
                  </div>
                </div>
                <ChevronRight
                  className={`h-5 w-5 text-muted-foreground transition-transform ${expandedLog === log.id ? "rotate-90" : ""}`}
                />
              </button>

              {expandedLog === log.id && (
                <div className="border-t border-border p-6 bg-muted/20">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Timeline de eventos</h3>
                  <div className="space-y-4">
                    {log.events.map((event, index) => (
                      <div key={index} className="flex items-start gap-4">
                        <div className="text-xs font-mono text-muted-foreground w-24">{event.time}</div>
                        <div className="relative">
                          <div
                            className={`w-3 h-3 rounded-full ${event.status === "success" ? "bg-accent" : "bg-destructive"}`}
                          />
                          {index < log.events.length - 1 && (
                            <div className="absolute top-3 left-1.5 w-0.5 h-8 bg-border" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-foreground capitalize">{event.stage}</div>
                          <div className="text-sm text-muted-foreground">{event.message}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
