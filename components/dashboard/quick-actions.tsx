"use client"

import { Button } from "@/components/ui/button"
import { ArrowUpRight, ArrowDownLeft, Repeat, CreditCard } from "lucide-react"

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Button
        size="lg"
        className="h-auto flex-col gap-3 py-6 bg-accent hover:bg-accent/90 text-accent-foreground"
        onClick={() => alert("Funcionalidad de compra - Integrar con backend")}
      >
        <ArrowUpRight className="h-6 w-6" />
        <span>Comprar</span>
      </Button>

      <Button
        size="lg"
        variant="outline"
        className="h-auto flex-col gap-3 py-6 bg-transparent"
        onClick={() => alert("Funcionalidad de venta - Integrar con backend")}
      >
        <ArrowDownLeft className="h-6 w-6" />
        <span>Vender</span>
      </Button>

      <Button
        size="lg"
        variant="outline"
        className="h-auto flex-col gap-3 py-6 bg-transparent"
        onClick={() => alert("Funcionalidad de intercambio - Integrar con backend")}
      >
        <Repeat className="h-6 w-6" />
        <span>Intercambiar</span>
      </Button>

      <Button
        size="lg"
        variant="outline"
        className="h-auto flex-col gap-3 py-6 bg-transparent"
        onClick={() => alert("Funcionalidad de depósito - Integrar con backend")}
      >
        <CreditCard className="h-6 w-6" />
        <span>Depositar</span>
      </Button>
    </div>
  )
}
