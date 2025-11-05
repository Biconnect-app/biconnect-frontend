"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Power, PowerOff, Edit, Copy, MoreVertical, TrendingUp } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState<any[]>([])

  useEffect(() => {
    // Load strategies from localStorage
    const saved = localStorage.getItem("strategies")
    if (saved) {
      setStrategies(JSON.parse(saved))
    }

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
          status: "inactive", // Start as inactive
          createdAt: new Date().toISOString(),
        }

        // Add to strategies list
        const existingStrategies = saved ? JSON.parse(saved) : []
        const updatedStrategies = [...existingStrategies, newStrategy]

        // Save to localStorage
        localStorage.setItem("strategies", JSON.stringify(updatedStrategies))
        setStrategies(updatedStrategies)

        // Clear the preview data from sessionStorage
        sessionStorage.removeItem("previewStrategy")

        console.log("[v0] Created strategy from preview:", newStrategy)
      } catch (error) {
        console.error("[v0] Error creating strategy from preview:", error)
        // Clear invalid data
        sessionStorage.removeItem("previewStrategy")
      }
    }
  }, [])

  const toggleStatus = (id: string) => {
    const updated = strategies.map((s) =>
      s.id === id ? { ...s, status: s.status === "active" ? "inactive" : "active" } : s,
    )
    setStrategies(updated)
    localStorage.setItem("strategies", JSON.stringify(updated))
  }

  const duplicateStrategy = (id: string) => {
    const strategy = strategies.find((s) => s.id === id)
    if (strategy) {
      const newStrategy = {
        ...strategy,
        id: `strat-${Date.now()}`,
        name: `${strategy.name} (Copia)`,
        status: "inactive",
      }
      const updated = [...strategies, newStrategy]
      setStrategies(updated)
      localStorage.setItem("strategies", JSON.stringify(updated))
    }
  }

  const deleteStrategy = (id: string) => {
    const strategy = strategies.find((s) => s.id === id)
    if (
      strategy &&
      confirm(
        `¿Estás seguro de que deseas eliminar la estrategia "${strategy.name}"? Esta acción no se puede deshacer.`,
      )
    ) {
      const updated = strategies.filter((s) => s.id !== id)
      setStrategies(updated)
      localStorage.setItem("strategies", JSON.stringify(updated))
    }
  }

  const getRiskLabel = (strategy: any) => {
    if (strategy.riskType === "fixed_quantity") {
      return `${strategy.riskAmount} ${strategy.pair.replace("USDT", "")}`
    } else if (strategy.riskType === "fixed_amount") {
      return `${strategy.riskAmount} USDT`
    } else if (strategy.riskType === "percentage") {
      return `${strategy.riskAmount}% del capital`
    }
    return ""
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="space-y-6">
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

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-sm text-muted-foreground mb-1">Total estrategias</div>
            <div className="text-2xl font-bold text-foreground">{strategies.length}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-sm text-muted-foreground mb-1">Activas</div>
            <div className="text-2xl font-bold text-accent">
              {strategies.filter((s) => s.status === "active").length}
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-sm text-muted-foreground mb-1">Inactivas</div>
            <div className="text-2xl font-bold text-foreground">
              {strategies.filter((s) => s.status === "inactive").length}
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-sm text-muted-foreground mb-1">Exchange</div>
            <div className="text-lg font-bold text-foreground">Binance</div>
          </div>
        </div>

        {/* Strategies List */}
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
              <div
                key={strategy.id}
                className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        strategy.status === "active" ? "bg-accent/10" : "bg-muted"
                      }`}
                    >
                      <TrendingUp
                        className={`h-6 w-6 ${strategy.status === "active" ? "text-accent" : "text-muted-foreground"}`}
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-foreground">{strategy.name}</h3>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            strategy.status === "active" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {strategy.status === "active" ? (
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
                          <span className="ml-2 text-foreground font-medium">{strategy.pair}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Mercado:</span>
                          <span className="ml-2 text-foreground font-medium">
                            {strategy.marketType === "spot" ? "Spot" : `Futuros ${strategy.leverage}x`}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Gestión:</span>
                          <span className="ml-2 text-foreground font-medium">{getRiskLabel(strategy)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Exchange:</span>
                          <span className="ml-2 text-foreground font-medium">Binance</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => toggleStatus(strategy.id)}>
                        {strategy.status === "active" ? "Desactivar" : "Activar"}
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

                <div className="flex gap-2">
                  <Link href={`/app/estrategias/${strategy.id}`} className="flex-1">
                    <Button variant="outline" className="w-full bg-transparent">
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="bg-transparent"
                    onClick={() => {
                      navigator.clipboard.writeText(`https://api.biconnect.io/w/user123/${strategy.id}`)
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar webhook
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
