"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Activity, TrendingUp, AlertCircle, Clock, Zap, XCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ email: string; name: string; plan?: string } | null>(null)
  const [hasApiKeys, setHasApiKeys] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function checkAuth() {
      try {
        const {
          data: { user: authUser },
          error,
        } = await supabase.auth.getUser()

        if (error || !authUser) {
          console.log("[v0] No authenticated user, redirecting to login")
          router.push("/login")
          return
        }

        console.log("[v0] User authenticated:", authUser.email)

        setUser({
          email: authUser.email || "",
          name: authUser.user_metadata?.first_name || authUser.email?.split("@")[0] || "Usuario",
          plan: authUser.user_metadata?.plan || "free",
        })

        const { data: exchanges, error: exchangeError } = await supabase
          .from("exchanges")
          .select("id")
          .eq("user_id", authUser.id)
          .limit(1)

        if (exchangeError) {
          console.error("[v0] Error checking API keys:", exchangeError)
        }

        setHasApiKeys(exchanges && exchanges.length > 0)

        const previewData = sessionStorage.getItem("previewStrategy")
        console.log("[v0] Dashboard: Checking for preview data:", previewData)

        if (previewData) {
          try {
            const strategyData = JSON.parse(previewData)
            console.log("[v0] Dashboard: Parsed preview strategy:", strategyData)

            // Create a new strategy from the preview data
            const newStrategy = {
              id: `strat-${Date.now()}`,
              name: strategyData.name,
              exchange: strategyData.exchange,
              description: strategyData.description || "",
              pair: strategyData.pair,
              marketType: strategyData.marketType,
              leverage: strategyData.leverage,
              riskType: strategyData.riskType,
              riskAmount: strategyData.riskAmount,
              status: "inactive",
              createdAt: new Date().toISOString(),
            }

            console.log("[v0] Dashboard: Creating new strategy:", newStrategy)

            // Add to strategies list in localStorage
            const existingStrategies = localStorage.getItem("strategies")
            console.log("[v0] Dashboard: Existing strategies in localStorage:", existingStrategies)

            const strategies = existingStrategies ? JSON.parse(existingStrategies) : []
            const updatedStrategies = [...strategies, newStrategy]

            localStorage.setItem("strategies", JSON.stringify(updatedStrategies))
            console.log("[v0] Dashboard: Saved updated strategies:", updatedStrategies)

            // Clear the preview data
            sessionStorage.removeItem("previewStrategy")
            console.log("[v0] Dashboard: Cleared preview data from sessionStorage")

            // Redirect to strategies page to show the new strategy
            console.log("[v0] Dashboard: Redirecting to strategies page")
            router.push("/app/estrategias")
          } catch (error) {
            console.error("[v0] Dashboard: Error creating strategy from preview:", error)
            sessionStorage.removeItem("previewStrategy")
          }
        }

        setLoading(false)
      } catch (err) {
        console.error("[v0] Auth check error:", err)
        router.push("/login")
      }
    }

    checkAuth()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const events = [
    {
      time: "14:32:15",
      type: "success",
      message: "Orden ejecutada: BTCUSDT LONG 0.01 BTC @ 43,500",
      strategy: "BTC Scalping 5m",
    },
    { time: "14:31:48", type: "received", message: "Señal recibida de TradingView", strategy: "BTC Scalping 5m" },
    {
      time: "14:28:03",
      type: "success",
      message: "Orden ejecutada: ETHUSDT SHORT 0.5 ETH @ 2,280",
      strategy: "ETH Swing Trading",
    },
    { time: "14:25:12", type: "error", message: "Error: Insufficient balance", strategy: "Multi-Pair Momentum" },
    {
      time: "14:20:45",
      type: "success",
      message: "Orden ejecutada: SOLUSDT LONG 10 SOL @ 98.5",
      strategy: "Multi-Pair Momentum",
    },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="space-y-8">
        {!hasApiKeys && (
          <div className="bg-destructive/10 border-2 border-destructive rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-destructive mb-2">Completa tu configuración</h3>
                <p className="text-sm text-foreground mb-4">
                  Para comenzar a ejecutar órdenes automáticamente, necesitas configurar las API keys de tu exchange.
                  Este es el último paso para completar tu registro.
                </p>
                <Link href="/app/configuracion/api-inicial">
                  <Button className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                    Configurar API Keys ahora
                  </Button>
                </Link>
              </div>
              <button
                onClick={() => setHasApiKeys(true)}
                className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Cerrar advertencia"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Overview</h1>
          <p className="text-muted-foreground">Monitorea tus estrategias y ejecuciones en tiempo real</p>
        </div>

        {/* KPIs */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Órdenes hoy</div>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold text-foreground">47</div>
            <div className="text-xs text-accent mt-1">+12 vs ayer</div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Tasa de éxito</div>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold text-foreground">94.5%</div>
            <div className="text-xs text-accent mt-1">+2.1% vs ayer</div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Latencia p50</div>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold text-foreground">0.8s</div>
            <div className="text-xs text-muted-foreground mt-1">p95: 1.2s</div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Fallos</div>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold text-foreground">3</div>
            <div className="text-xs text-destructive mt-1">2 por balance</div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Drawdown</div>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold text-foreground">-2.3%</div>
            <div className="text-xs text-muted-foreground mt-1">Acumulado</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4">
          <Link href="/app/estrategias" className="block">
            <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer">
              <h3 className="font-semibold text-foreground mb-2">Mis estrategias</h3>
              <p className="text-sm text-muted-foreground">Gestiona y crea nuevas estrategias de trading</p>
            </div>
          </Link>

          <Link href="/app/integraciones" className="block">
            <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer">
              <h3 className="font-semibold text-foreground mb-2">Conectar exchange</h3>
              <p className="text-sm text-muted-foreground">Añade API keys de exchanges</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
