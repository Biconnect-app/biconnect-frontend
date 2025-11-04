"use client"

import { Button } from "@/components/ui/button"
import { AlertTriangle, Shield } from "lucide-react"

export default function RiskPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Control de riesgo</h1>
          <p className="text-muted-foreground mt-1">Monitorea límites y violaciones de riesgo</p>
        </div>

        {/* Risk Limits */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Límites configurados</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm text-foreground">Tamaño máximo por orden</span>
                <span className="text-sm font-medium text-foreground">$1,000</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm text-foreground">Límite diario</span>
                <span className="text-sm font-medium text-foreground">$5,000</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm text-foreground">Leverage máximo</span>
                <span className="text-sm font-medium text-foreground">10x</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm text-foreground">Cooldown entre órdenes</span>
                <span className="text-sm font-medium text-foreground">30s</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Uso actual</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-foreground">Límite diario usado</span>
                  <span className="text-sm font-medium text-foreground">$2,340 / $5,000</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-accent h-2 rounded-full" style={{ width: "46.8%" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-foreground">Órdenes por hora</span>
                  <span className="text-sm font-medium text-foreground">12 / 60</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: "20%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Violations */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Violaciones recientes</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">Límite diario excedido</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Estrategia "Multi-Pair Momentum" intentó ejecutar orden de $1,500 cuando el límite diario restante era
                  $800
                </div>
                <div className="text-xs text-muted-foreground mt-2">Hace 2 horas</div>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">Símbolo no permitido</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Estrategia "BTC Scalping 5m" intentó operar DOGEUSDT que no está en la lista blanca
                </div>
                <div className="text-xs text-muted-foreground mt-2">Hace 5 horas</div>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Actions */}
        <div className="bg-card border border-destructive rounded-xl p-6">
          <div className="flex items-start gap-4">
            <Shield className="h-6 w-6 text-destructive mt-1" />
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-foreground mb-2">Acciones de emergencia</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Usa estas acciones solo en caso de emergencia. Todas las estrategias se detendrán inmediatamente.
              </p>
              <Button variant="destructive">Pánico: Cerrar todo</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
