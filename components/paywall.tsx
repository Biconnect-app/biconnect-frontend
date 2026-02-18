"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Lock, Zap } from "lucide-react"

interface PaywallProps {
  feature: string
}

export function Paywall({ feature }: PaywallProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-card border-2 border-accent/20 rounded-2xl p-12 text-center">
        <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="h-10 w-10 text-blue-400" />
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-4">Función exclusiva del Plan Pro</h2>
        <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
          {feature} está disponible solo para usuarios del Plan Pro. Actualiza tu plan para desbloquear esta función y
          muchas más.
        </p>

        <div className="bg-muted/50 rounded-xl p-6 mb-8 max-w-2xl mx-auto">
          <h3 className="text-xl font-semibold text-foreground mb-4">El Plan Pro incluye:</h3>
          <ul className="text-left space-y-3 text-gray-300">
            <li className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <span>Ejecuciones ilimitadas por mes</span>
            </li>
            <li className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <span>Estrategias activas ilimitadas</span>
            </li>
            <li className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <span>Múltiples exchanges conectados</span>
            </li>
            <li className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <span>Dashboard avanzado con métricas en tiempo real</span>
            </li>
            <li className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <span>Logs y órdenes con retención de 90 días</span>
            </li>
            <li className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <span>Gestión de riesgo avanzada</span>
            </li>
            <li className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
              <span>Alertas por email y Telegram</span>
            </li>
            <li className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
              <span>Soporte prioritario</span>
            </li>
          </ul>
        </div>

        <div className="flex gap-4 justify-center">
          <Link href="/precios">
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Zap className="h-5 w-5 mr-2" />
              Ver planes y precios
            </Button>
          </Link>
          <Link href="/dashboard/estrategias">
            <Button size="lg" variant="outline" className="bg-transparent">
              Volver a Estrategias
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
