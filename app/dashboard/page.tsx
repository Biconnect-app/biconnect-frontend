"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Activity, TrendingUp, AlertCircle, Clock, Zap } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ApiKeyAlert } from "@/components/api-key-alert"
import { Paywall } from "@/components/paywall"
import { useUserPlan } from "@/hooks/use-user-plan"

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ email: string; name: string; plan?: string } | null>(null)
  const [hasApiKeys, setHasApiKeys] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { isFree, loading: planLoading } = useUserPlan()

  useEffect(() => {
    async function checkAuth() {
      try {
        const {
          data: { user: authUser },
          error,
        } = await supabase.auth.getUser()

        if (error || !authUser) {
          router.push("/login")
          return
        }

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
          console.error("Error checking API keys:", exchangeError)
        }

        setHasApiKeys(exchanges && exchanges.length > 0)

        const previewData = sessionStorage.getItem("previewStrategy")

        if (previewData) {
          try {
            const strategyData = JSON.parse(previewData)

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

            // Add to strategies list in localStorage
            const existingStrategies = localStorage.getItem("strategies")

            const strategies = existingStrategies ? JSON.parse(existingStrategies) : []
            const updatedStrategies = [...strategies, newStrategy]

            localStorage.setItem("strategies", JSON.stringify(updatedStrategies))

            // Clear the preview data
            sessionStorage.removeItem("previewStrategy")

            // Redirect to strategies page to show the new strategy
            router.push("/dashboard/estrategias")
            return // Added return to prevent further execution
          } catch (error) {
            console.error("Error creating strategy from preview:", error)
            sessionStorage.removeItem("previewStrategy")
          }
        }

        setLoading(false)
      } catch (err) {
        console.error("Auth check error:", err)
        router.push("/login")
      }
    }

    checkAuth()
  }, [router, supabase])

  if (loading || planLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (isFree) {
    return (
      <div>
        <ApiKeyAlert />
        <Paywall feature="El Dashboard avanzado" />
      </div>
    )
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
    {
      time: "14:25:12",
      type: "error",
      message: "Error: Insufficient balance",
      strategy: "Multi-Pair Momentum",
    },
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
        <ApiKeyAlert />

        {!hasApiKeys && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-500 dark:border-amber-600 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-400 mb-2">
                  Completa tu configuración
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-300 mb-4">
                  Para comenzar a ejecutar órdenes automáticamente, necesitas configurar las API keys de tu exchange.
                  Este es el último paso para completar tu registro.
                </p>
                <Link href="/dashboard/configuracion/api-inicial">
                  <Button className="bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white">
                    Configurar API Keys ahora
                  </Button>
                </Link>
              </div>
              <button
                onClick={() => setHasApiKeys(true)}
                className="flex-shrink-0 text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
                aria-label="Cerrar advertencia"
              >
                <AlertCircle className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
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
      </div>
    </div>
  )
}
