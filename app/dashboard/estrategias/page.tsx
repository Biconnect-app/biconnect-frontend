"use client"

import type React from "react"

import { useState, useEffect, useMemo, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus, Power, PowerOff, Copy, MoreVertical, TrendingUp, ChevronDown, ChevronUp, AlertCircle, CreditCard } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { ApiKeyAlert } from "@/components/api-key-alert"
import { useUserPlan } from "@/hooks/use-user-plan"
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

// Helper function to check if a strategy has all required fields
const isStrategyComplete = (strategy: any): boolean => {
  // Para futuros, también necesita leverage y position_side
  const isFutures = strategy.market_type === "futures"
  
  const baseComplete = !!(
    strategy.name &&
    strategy.name !== "Estrategia sin nombre" &&
    strategy.exchange_name &&
    strategy.trading_pair &&
    strategy.market_type &&
    strategy.risk_type &&
    strategy.risk_value !== null &&
    strategy.risk_value !== undefined &&
    strategy.risk_value > 0
  )
  
  if (isFutures) {
    return baseComplete && 
      strategy.leverage !== null && 
      strategy.leverage > 0 &&
      strategy.position_side
  }
  
  return baseComplete
}

// Helper function to get missing fields
const getMissingFields = (strategy: any): string[] => {
  const missing: string[] = []
  if (!strategy.name || strategy.name === "Estrategia sin nombre") missing.push("Nombre")
  if (!strategy.exchange_name) missing.push("Exchange")
  if (!strategy.trading_pair) missing.push("Par de trading")
  if (!strategy.market_type) missing.push("Tipo de mercado")
  if (!strategy.risk_type) missing.push("Tipo de gestión de riesgo")
  if (strategy.risk_value === null || strategy.risk_value === undefined || strategy.risk_value <= 0) missing.push("Cantidad/Monto de riesgo")
  
  // Para futuros, verificar campos adicionales
  if (strategy.market_type === "futures") {
    if (!strategy.leverage || strategy.leverage <= 0) missing.push("Apalancamiento")
    if (!strategy.position_side) missing.push("Dirección (Long/Short)")
  }
  
  return missing
}

export default function StrategiesPage() {
  const router = useRouter()
  const [strategies, setStrategies] = useState<any[]>([])
  const [hasApiKeys, setHasApiKeys] = useState(false)
  const [checkingApiKeys, setCheckingApiKeys] = useState(true)
  const [loading, setLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [strategyToDelete, setStrategyToDelete] = useState<any>(null)
  const [expandedStrategyId, setExpandedStrategyId] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [copiedPayload, setCopiedPayload] = useState<string | null>(null)
  const [showIncompleteDialog, setShowIncompleteDialog] = useState(false)
  const [incompleteStrategy, setIncompleteStrategy] = useState<any>(null)
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false)
  const isLoadingStrategiesRef = useRef(false)
  
  const { needsSubscription, hasUsedTrial, loading: planLoading } = useUserPlan()

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    loadStrategies()
  }, [])

  const loadStrategies = async () => {
    console.log("=== loadStrategies STARTED ===")
    
    // Prevent concurrent executions
    if (isLoadingStrategiesRef.current) {
      console.log("⚠ loadStrategies already running, skipping duplicate call")
      return
    }
    
    isLoadingStrategiesRef.current = true
    
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        console.error("No user found")
        setLoading(false)
        setCheckingApiKeys(false)
        isLoadingStrategiesRef.current = false
        return
      }

      console.log("User found:", user.email)

      const { data: exchanges, error: exchangesError } = await supabase
        .from("exchanges")
        .select("id")
        .eq("user_id", user.id)
        .limit(1)

      if (exchangesError) {
        console.error("Error checking API keys:", exchangesError)
      }

      setHasApiKeys(exchanges && exchanges.length > 0)
      setCheckingApiKeys(false)

      const { data: strategiesData, error: strategiesError } = await supabase
        .from("strategies")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (strategiesError) {
        console.error("Error loading strategies:", strategiesError)
        setLoading(false)
        isLoadingStrategiesRef.current = false
        return
      }

      console.log("Existing strategies count:", strategiesData?.length || 0)
      setStrategies(strategiesData || [])

      let strategyData = null
      let fromPreview = false
      let pendingStrategyId = null

      // Check sessionStorage first (most recent in current browser session)
      const previewDataString = sessionStorage.getItem("previewStrategy")
      const fromPreviewString = sessionStorage.getItem("fromPreview")

      console.log("sessionStorage check:", { hasData: !!previewDataString, fromPreview: fromPreviewString })

      if (previewDataString && fromPreviewString === "true") {
        strategyData = JSON.parse(previewDataString)
        fromPreview = true
        console.log("✓ Found preview strategy in sessionStorage:", strategyData.name)
      } else {
        // Fallback to pending_strategies table
        const { data: pendingStrategies, error: pendingError } = await supabase
          .from("pending_strategies")
          .select("*")
          .eq("email", user.email)
          .order("created_at", { ascending: false })
          .limit(1)

        console.log("pending_strategies check:", { count: pendingStrategies?.length || 0 })

        if (!pendingError && pendingStrategies && pendingStrategies.length > 0) {
          strategyData = pendingStrategies[0].strategy_data
          fromPreview = true
          pendingStrategyId = pendingStrategies[0].id
          console.log("✓ Found preview strategy in pending_strategies:", strategyData.name)
        }
      }

      console.log("Preview data decision:", { hasPreviewData: !!strategyData, fromPreview })

      if (strategyData && fromPreview) {
        console.log("→ Processing preview strategy...")
        try {
          // Clean up sessionStorage and pending_strategies FIRST to prevent duplicates
          sessionStorage.removeItem("previewStrategy")
          sessionStorage.removeItem("fromPreview")
          
          // Delete pending strategy from database if exists
          await supabase
            .from("pending_strategies")
            .delete()
            .eq("email", user.email.toLowerCase())

          console.log("Cleaned up preview data before saving strategy")

          const exchangeName = strategyData.exchange || null
          
          // Generar un ID único para el webhook
          const webhookId = crypto.randomUUID()
          const webhookUrl = `https://api-92000983434.southamerica-east1.run.app/api/webhook/${webhookId}`

          const { data: newStrategy, error: insertError } = await supabase
            .from("strategies")
            .insert({
              user_id: user.id,
              exchange_id: null,
              exchange_name: exchangeName,
              name: strategyData.name || "Estrategia sin nombre",
              description: strategyData.description || "",
              trading_pair: strategyData.pair || null,
              market_type: strategyData.marketType || null,
              leverage: strategyData.leverage > 0 ? strategyData.leverage : null,
              position_side: strategyData.positionSide || null,
              risk_type: strategyData.riskType || null,
              risk_value: strategyData.riskAmount ? Number.parseFloat(strategyData.riskAmount) : null,
              is_active: false,
              webhook_url: webhookUrl,
            })
            .select()
            .single()

          if (insertError) {
            console.error("✗ Error creating strategy from preview:", insertError)
            setLoading(false)
            isLoadingStrategiesRef.current = false
            return
          } else {
            console.log("✓ Strategy created from preview successfully")
            
            // Reload ONLY the strategies list without checking for pending strategies again
            const { data: updatedStrategies, error: reloadError } = await supabase
              .from("strategies")
              .select("*")
              .eq("user_id", user.id)
              .order("created_at", { ascending: false })

            if (!reloadError) {
              setStrategies(updatedStrategies || [])
              console.log("✓ Strategies reloaded, count:", updatedStrategies?.length || 0)
            }
            
            // Mark as done and return to prevent further redirections
            console.log("→ Finishing loadStrategies (after preview save)")
            setLoading(false)
            isLoadingStrategiesRef.current = false
            console.log("=== loadStrategies COMPLETED (preview path) ===")
            return
          }
        } catch (error) {
          console.error("✗ Error processing preview data:", error)
          sessionStorage.removeItem("previewStrategy")
          sessionStorage.removeItem("fromPreview")
          setLoading(false)
          isLoadingStrategiesRef.current = false
          return
        }
      }
      
      console.log("→ No preview data to process, checking existing strategies...")
      console.log("strategiesData.length:", strategiesData?.length || 0)
      
      // Only redirect to /nueva if there are no strategies AND no preview data was processed
      if (!strategiesData || strategiesData.length === 0) {
        console.log("→ No strategies found, redirecting to /nueva")
        router.replace("/dashboard/estrategias/nueva")
        isLoadingStrategiesRef.current = false
        return
      }

      console.log("→ Has strategies, staying on current page")
      setLoading(false)
      isLoadingStrategiesRef.current = false
      console.log("=== loadStrategies COMPLETED (normal path) ===")
    } catch (error) {
      console.error("✗ Error in loadStrategies:", error)
      setLoading(false)
      setCheckingApiKeys(false)
      isLoadingStrategiesRef.current = false
    }
  }

  const toggleStatus = async (id: string) => {
    try {
      const strategy = strategies.find((s) => s.id === id)
      if (!strategy) return

      // Si se quiere activar, verificar suscripción primero
      if (!strategy.is_active) {
        // Verificar si tiene suscripción activa
        if (needsSubscription) {
          setShowSubscriptionDialog(true)
          return
        }
        
        // Verificar que esté completa
        if (!isStrategyComplete(strategy)) {
          setIncompleteStrategy(strategy)
          setShowIncompleteDialog(true)
          return
        }
      }

      const { error } = await supabase.from("strategies").update({ is_active: !strategy.is_active }).eq("id", id)

      if (error) {
        console.error("Error toggling strategy status:", error)
        return
      }

      setStrategies(strategies.map((s) => (s.id === id ? { ...s, is_active: !s.is_active } : s)))
    } catch (error) {
      console.error("Error in toggleStatus:", error)
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
          webhook_url: `https://api-92000983434.southamerica-east1.run.app/api/webhook`,
        })
        .select()
        .single()

      if (error) {
        console.error("Error duplicating strategy:", error)
        return
      }

      loadStrategies()
    } catch (error) {
      console.error("Error in duplicateStrategy:", error)
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
        console.error("Error deleting strategy:", error)
        return
      }

      setStrategies(strategies.filter((s) => s.id !== strategyToDelete.id))
      setShowDeleteDialog(false)
      setStrategyToDelete(null)
    } catch (error) {
      console.error("Error in confirmDelete:", error)
    }
  }

  const getRiskLabel = (strategy: any) => {
    if (!strategy.risk_type || strategy.risk_value === null || strategy.risk_value === undefined) {
      return "No configurado"
    }
    
    const baseCurrency = strategy.trading_pair?.includes("/")
      ? strategy.trading_pair.split("/")[0]
      : strategy.trading_pair?.replace(/USDT|BUSD|BNB|EUR|GBP/g, "") || ""

    if (strategy.risk_type === "fixed_quantity") {
      return `${strategy.risk_value} ${baseCurrency || "unidades"}`
    } else if (strategy.risk_type === "fixed_amount") {
      return `${strategy.risk_value} USDT`
    } else if (strategy.risk_type === "percentage") {
      return `${strategy.risk_value}% del capital`
    }
    return "No configurado"
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
      action: "{{strategy.order.action}}",
      market_position: "{{strategy.market_position}}",
    }
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
  }

  const handleCopyUrl = async (e: React.MouseEvent, strategyId: string) => {
    e.stopPropagation()
    await copyToClipboard("https://api-92000983434.southamerica-east1.run.app/api/webhook")
    setCopiedUrl(strategyId)
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  const handleCopyPayload = async (e: React.MouseEvent, strategy: any) => {
    e.stopPropagation()
    await copyToClipboard(JSON.stringify(getPayloadExample(strategy), null, 2))
    setCopiedPayload(strategy.id)
    setTimeout(() => setCopiedPayload(null), 2000)
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

        {needsSubscription && !planLoading && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-destructive mb-1">Suscripción requerida</h3>
                <p className="text-sm text-destructive/90 mb-3">
                  {hasUsedTrial 
                    ? "Tu suscripción ha expirado. Tus estrategias están inactivas y no se ejecutarán hasta que pases al Plan Pro."
                    : "No tienes una suscripción activa. Tus estrategias están inactivas y no se ejecutarán hasta que inicies tu período de prueba."
                  }
                </p>
                <Link href="/dashboard/suscripcion">
                  <Button size="sm" variant="destructive">
                    {hasUsedTrial ? "Pasar a Plan Pro" : "Iniciar período de prueba"}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Estrategias</h1>
            <p className="text-gray-400 mt-1">Gestiona tus estrategias de trading automatizado</p>
          </div>
          <Link href="/dashboard/estrategias/nueva">
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Nueva estrategia
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-sm text-gray-400 mb-1">Total estrategias</div>
            <div className="text-2xl font-bold text-foreground">{strategies.length}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-sm text-gray-400 mb-1">Activas</div>
            <div className="text-2xl font-bold text-green-500">{strategies.filter((s) => s.is_active).length}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-sm text-gray-400 mb-1">Inactivas</div>
            <div className="text-2xl font-bold text-foreground">{strategies.filter((s) => !s.is_active).length}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-sm text-gray-400 mb-1">Exchange</div>
            <div className="text-lg font-bold text-foreground">
              {getUniqueExchanges() || <span className="text-muted-foreground text-sm">Ninguno</span>}
            </div>
          </div>
        </div>

        {strategies.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <TrendingUp className="h-12 w-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No tienes estrategias aún</h3>
            <p className="text-muted-foreground mb-6">
              Crea tu primera estrategia para comenzar a automatizar tu trading
            </p>
            <Link href="/dashboard/estrategias/nueva">
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
                          strategy.is_active ? "bg-green-500/10" : "bg-muted"
                        }`}
                      >
                        <TrendingUp
                          className={`h-6 w-6 ${strategy.is_active ? "text-green-500" : "text-muted-foreground"}`}
                        />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-foreground">{strategy.name}</h3>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                              strategy.is_active ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"
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
                          {!isStrategyComplete(strategy) && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
                              <AlertCircle className="h-3 w-3" />
                              Incompleta
                            </span>
                          )}
                        </div>

                        {strategy.description && (
                          <p className="text-sm text-muted-foreground mb-3">{strategy.description}</p>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Par:</span>
                            <span className="ml-2 text-foreground font-medium">
                              {strategy.trading_pair || "No configurado"}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Mercado:</span>
                            <span className="ml-2 text-foreground font-medium">
                              {!strategy.market_type 
                                ? "No configurado" 
                                : strategy.market_type === "spot" 
                                  ? "Spot" 
                                  : `Futuros ${strategy.leverage ? `${strategy.leverage}x` : ""}`}
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
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleStatus(strategy.id)
                            }}
                          >
                            {strategy.is_active ? "Desactivar" : "Activar"}
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/estrategias/${strategy.id}`}>Editar</Link>
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
                          <Button variant="ghost" size="sm" onClick={(e) => handleCopyUrl(e, strategy.id)}>
                            <Copy className="h-3 w-3 mr-1" />
                            {copiedUrl === strategy.id ? "Copiado" : "Copiar"}
                          </Button>
                        </div>
                        <div className="bg-background border border-border rounded-lg p-3 font-mono text-sm text-foreground break-all">
                          https://api-92000983434.southamerica-east1.run.app/api/webhook
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-foreground">Payload de ejemplo</label>
                          <Button variant="ghost" size="sm" onClick={(e) => handleCopyPayload(e, strategy)}>
                            <Copy className="h-3 w-3 mr-1" />
                            {copiedPayload === strategy.id ? "Copiado" : "Copiar"}
                          </Button>
                        </div>
                        <div className="bg-background border border-border rounded-lg p-3 font-mono text-xs text-foreground overflow-x-auto">
                          <pre>{JSON.stringify(getPayloadExample(strategy), null, 2)}</pre>
                        </div>
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

      <AlertDialog open={showIncompleteDialog} onOpenChange={setShowIncompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Estrategia incompleta
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>No puedes activar esta estrategia porque faltan campos obligatorios:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {incompleteStrategy && getMissingFields(incompleteStrategy).map((field) => (
                    <li key={field} className="text-amber-600 dark:text-amber-400">{field}</li>
                  ))}
                </ul>
                <p className="text-sm">Completa todos los campos para poder activar la estrategia.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cerrar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowIncompleteDialog(false)
                if (incompleteStrategy) {
                  router.push(`/dashboard/estrategias/${incompleteStrategy.id}`)
                }
              }}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Editar estrategia
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-destructive" />
              Suscripción requerida
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>No puedes activar estrategias porque no tienes una suscripción activa.</p>
                <p className="text-sm">
                  {hasUsedTrial 
                    ? "Pasa al Plan Pro para reactivar tus estrategias y continuar operando automáticamente."
                    : "Inicia tu período de prueba gratuito de 30 días para activar tus estrategias y comenzar a operar automáticamente."
                  }
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cerrar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowSubscriptionDialog(false)
                router.push("/dashboard/suscripcion")
              }}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {hasUsedTrial ? "Pasar a Plan Pro" : "Iniciar período de prueba"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
