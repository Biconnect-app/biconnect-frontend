"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Power, PowerOff, Copy, MoreVertical, TrendingUp, ChevronDown, ChevronUp } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { ApiKeyAlert } from "@/components/api-key-alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState<any[]>([])
  const [hasApiKeys, setHasApiKeys] = useState(false)
  const [checkingApiKeys, setCheckingApiKeys] = useState(true)
  const [loading, setLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [strategyToDelete, setStrategyToDelete] = useState<any>(null)
  const [expandedStrategyId, setExpandedStrategyId] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    loadStrategies()
  }, [])

  const loadStrategies = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        console.error("[v0] No user found")
        setLoading(false)
        setCheckingApiKeys(false)
        return
      }

      console.log("[v0] Current user:", { id: user.id, email: user.email })

      const { data: exchanges, error: exchangesError } = await supabase
        .from("exchanges")
        .select("id")
        .eq("user_id", user.id)
        .limit(1)

      if (exchangesError) {
        console.error("[v0] Error checking API keys:", exchangesError)
      }

      setHasApiKeys(exchanges && exchanges.length > 0)
      setCheckingApiKeys(false)

      const { data: strategiesData, error: strategiesError } = await supabase
        .from("strategies")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (strategiesError) {
        console.error("[v0] Error loading strategies:", strategiesError)
        setLoading(false)
        return
      }

      console.log("[v0] Loaded strategies from database:", strategiesData)
      setStrategies(strategiesData || [])

      let strategyData = null
      let fromPreview = false
      let pendingStrategyId = null

      console.log("[v0] Checking for pending strategies with email:", user.email)

      const { data: pendingStrategies, error: pendingError } = await supabase
        .from("pending_strategies")
        .select("*")
        .eq("email", user.email)
        .order("created_at", { ascending: false })
        .limit(1)

      console.log("[v0] Pending strategies query result:", {
        data: pendingStrategies,
        error: pendingError,
        found: pendingStrategies && pendingStrategies.length > 0,
      })

      if (!pendingError && pendingStrategies && pendingStrategies.length > 0) {
        console.log("[v0] Found pending strategy in database:", pendingStrategies[0])
        strategyData = pendingStrategies[0].strategy_data
        fromPreview = true
        pendingStrategyId = pendingStrategies[0].id
      } else {
        console.log("[v0] No pending strategies found in database, checking sessionStorage")
        // Fallback to sessionStorage
        const previewDataString = sessionStorage.getItem("previewStrategy")
        const fromPreviewString = sessionStorage.getItem("fromPreview")

        if (previewDataString && fromPreviewString === "true") {
          console.log("[v0] Found preview strategy in sessionStorage")
          strategyData = JSON.parse(previewDataString)
          fromPreview = true
        }
      }

      if (strategyData && fromPreview) {
        try {
          console.log("[v0] Creating strategy from preview:", strategyData)

          const exchangeName = strategyData.exchange || "binance"

          console.log("[v0] Inserting strategy with data:", {
            user_id: user.id,
            exchange_id: null,
            exchange_name: exchangeName,
            name: strategyData.name,
            description: strategyData.description || "",
            trading_pair: strategyData.pair,
            market_type: strategyData.marketType,
            leverage: strategyData.leverage || 1,
            risk_type: strategyData.riskType,
            risk_value: Number.parseFloat(strategyData.riskAmount),
            is_active: true,
            webhook_url: `https://biconnect.vercel.app/api/webhook`,
          })

          const { data: newStrategy, error: insertError } = await supabase
            .from("strategies")
            .insert({
              user_id: user.id,
              exchange_id: null,
              exchange_name: exchangeName,
              name: strategyData.name,
              description: strategyData.description || "",
              trading_pair: strategyData.pair,
              market_type: strategyData.marketType,
              leverage: strategyData.leverage || 1,
              risk_type: strategyData.riskType,
              risk_value: Number.parseFloat(strategyData.riskAmount),
              is_active: true,
              webhook_url: `https://biconnect.vercel.app/api/webhook`,
            })
            .select()
            .single()

          if (insertError) {
            console.error("[v0] Error creating strategy from preview:", insertError)
          } else {
            console.log("[v0] Strategy created successfully:", newStrategy)

            if (pendingStrategyId) {
              console.log("[v0] Deleting pending strategy:", pendingStrategyId)
              const { error: deleteError } = await supabase
                .from("pending_strategies")
                .delete()
                .eq("id", pendingStrategyId)

              if (deleteError) {
                console.error("[v0] Error deleting pending strategy:", deleteError)
              } else {
                console.log("[v0] Pending strategy deleted successfully")
              }
            }

            // Reload strategies to show the new one
            loadStrategies()
          }

          // Clean up sessionStorage
          sessionStorage.removeItem("previewStrategy")
          sessionStorage.removeItem("fromPreview")
        } catch (error) {
          console.error("[v0] Error processing preview data:", error)
          sessionStorage.removeItem("previewStrategy")
          sessionStorage.removeItem("fromPreview")
        }
      } else {
        console.log("[v0] No preview data to process")
      }

      setLoading(false)
    } catch (error) {
      console.error("[v0] Error in loadStrategies:", error)
      setLoading(false)
      setCheckingApiKeys(false)
    }
  }

  const toggleStatus = async (id: string) => {
    try {
      const strategy = strategies.find((s) => s.id === id)
      if (!strategy) return

      const { error } = await supabase.from("strategies").update({ is_active: !strategy.is_active }).eq("id", id)

      if (error) {
        console.error("[v0] Error toggling strategy status:", error)
        return
      }

      setStrategies(strategies.map((s) => (s.id === id ? { ...s, is_active: !s.is_active } : s)))
    } catch (error) {
      console.error("[v0] Error in toggleStatus:", error)
    }
  }

  const duplicateStrategy = async (id: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const strategy = strategies.find((s) => s.id === id)
      if (!strategy) return

      const { data: newStrategy, error } = await supabase
        .from("strategies")
        .insert({
          user_id: user.id,
          exchange_id: null,
          exchange_name: strategy.exchange_name,
          name: `${strategy.name} (Copia)`,
          description: strategy.description,
          trading_pair: strategy.trading_pair,
          market_type: strategy.market_type,
          leverage: strategy.leverage,
          risk_type: strategy.risk_type,
          risk_value: strategy.risk_value,
          is_active: true,
          webhook_url: `https://biconnect.vercel.app/api/webhook`,
        })
        .select()
        .single()

      if (error) {
        console.error("[v0] Error duplicating strategy:", error)
        return
      }

      console.log("[v0] Strategy duplicated:", newStrategy)
      loadStrategies()
    } catch (error) {
      console.error("[v0] Error in duplicateStrategy:", error)
    }
  }

  const deleteStrategy = (id: string) => {
    const strategy = strategies.find((s) => s.id === id)
    if (!strategy) return

    setStrategyToDelete(strategy)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!strategyToDelete) return

    try {
      const { error } = await supabase.from("strategies").delete().eq("id", strategyToDelete.id)

      if (error) {
        console.error("[v0] Error deleting strategy:", error)
        return
      }

      console.log("[v0] Strategy deleted:", strategyToDelete.id)
      setStrategies(strategies.filter((s) => s.id !== strategyToDelete.id))
      setShowDeleteDialog(false)
      setStrategyToDelete(null)
    } catch (error) {
      console.error("[v0] Error in confirmDelete:", error)
    }
  }

  const getRiskLabel = (strategy: any) => {
    const baseCurrency = strategy.trading_pair?.includes("/")
      ? strategy.trading_pair.split("/")[0]
      : strategy.trading_pair?.replace(/USDT|BUSD|BNB|EUR|GBP/g, "") || ""

    if (strategy.risk_type === "fixed_quantity") {
      return `${strategy.risk_value} ${baseCurrency}`
    } else if (strategy.risk_type === "fixed_amount") {
      return `${strategy.risk_value} USDT`
    } else if (strategy.risk_type === "percentage") {
      return `${strategy.risk_value}% del capital`
    }
    return ""
  }

  const getUniqueExchanges = () => {
    if (strategies.length === 0) return ""
    const exchanges = [...new Set(strategies.map((s) => s.exchange_name).filter(Boolean))]
    return exchanges.map((e) => e.charAt(0).toUpperCase() + e.slice(1)).join(", ") || "Ninguno"
  }

  const getPayloadExample = (strategy: any) => {
    return {
      user_id: strategy.user_id,
      strategy_id: strategy.id,
    }
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center">Cargando estrategias...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="space-y-6">
        <ApiKeyAlert />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Estrategias</h1>
            <p className="text-muted-foreground mt-1">Gestiona tus estrategias de trading automatizado</p>
          </div>
          <Link href="/app/estrategias/nueva">
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Nueva estrategia
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-sm text-muted-foreground mb-1">Total estrategias</div>
            <div className="text-2xl font-bold text-foreground">{strategies.length}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-sm text-muted-foreground mb-1">Activas</div>
            <div className="text-2xl font-bold text-accent">{strategies.filter((s) => s.is_active).length}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-sm text-muted-foreground mb-1">Inactivas</div>
            <div className="text-2xl font-bold text-foreground">{strategies.filter((s) => !s.is_active).length}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-sm text-muted-foreground mb-1">Exchange</div>
            <div className="text-lg font-bold text-foreground">
              {getUniqueExchanges() || <span className="text-muted-foreground text-sm">Ninguno</span>}
            </div>
          </div>
        </div>

        {strategies.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No tienes estrategias aún</h3>
            <p className="text-muted-foreground mb-6">
              Crea tu primera estrategia para comenzar a automatizar tu trading
            </p>
            <Link href="/app/estrategias/nueva">
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Plus className="h-4 w-4 mr-2" />
                Crear primera estrategia
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {strategies.map((strategy) => (
              <div key={strategy.id} className="bg-card border border-border rounded-xl overflow-hidden">
                <div
                  className="p-6 hover:bg-accent/5 transition-colors cursor-pointer"
                  onClick={() => setExpandedStrategyId(expandedStrategyId === strategy.id ? null : strategy.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          strategy.is_active ? "bg-accent/10" : "bg-muted"
                        }`}
                      >
                        <TrendingUp
                          className={`h-6 w-6 ${strategy.is_active ? "text-accent" : "text-muted-foreground"}`}
                        />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-foreground">{strategy.name}</h3>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                              strategy.is_active ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {strategy.is_active ? (
                              <>
                                <Power className="h-3 w-3" />
                                Activa
                              </>
                            ) : (
                              <>
                                <PowerOff className="h-3 w-3" />
                                Inactiva
                              </>
                            )}
                          </span>
                        </div>

                        {strategy.description && (
                          <p className="text-sm text-muted-foreground mb-3">{strategy.description}</p>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Par:</span>
                            <span className="ml-2 text-foreground font-medium">{strategy.trading_pair}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Mercado:</span>
                            <span className="ml-2 text-foreground font-medium">
                              {strategy.market_type === "spot" ? "Spot" : `Futuros ${strategy.leverage}x`}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Gestión:</span>
                            <span className="ml-2 text-foreground font-medium">{getRiskLabel(strategy)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Exchange:</span>
                            <span className="ml-2 text-foreground font-medium">
                              {strategy.exchange_name
                                ? strategy.exchange_name.charAt(0).toUpperCase() + strategy.exchange_name.slice(1)
                                : "No configurado"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {expandedStrategyId === strategy.id ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toggleStatus(strategy.id)}>
                            {strategy.is_active ? "Desactivar" : "Activar"}
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/app/estrategias/${strategy.id}`}>Editar</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicateStrategy(strategy.id)}>Duplicar</DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteStrategy(strategy.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {expandedStrategyId === strategy.id && (
                    <div className="border-t border-border bg-muted/30 p-6 space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-foreground">Webhook URL</label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard("https://biconnect.vercel.app/api/webhook")}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copiar
                          </Button>
                        </div>
                        <div className="bg-background border border-border rounded-lg p-3 font-mono text-sm text-foreground break-all">
                          https://biconnect.vercel.app/api/webhook
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-foreground">Payload de ejemplo</label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(JSON.stringify(getPayloadExample(strategy), null, 2))}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copiar
                          </Button>
                        </div>
                        <div className="bg-background border border-border rounded-lg p-3 font-mono text-xs text-foreground overflow-x-auto">
                          <pre>{JSON.stringify(getPayloadExample(strategy), null, 2)}</pre>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Nota: Puedes cambiar el "action" a "buy", "sell", "long" o "short" según tu necesidad. Para
                          cerrar posiciones, agrega "close_position": true
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar estrategia?</AlertDialogTitle>
            <AlertDialogDescription>
              {`¿Estás seguro de que deseas eliminar la estrategia "${strategyToDelete?.name}"? Esta acción no se puede deshacer y se perderán todos los datos asociados.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
