import { TrendingUp } from "lucide-react"

export function PortfolioWidget() {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Total Balance */}
      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-2xl p-6">
        <div className="text-sm opacity-90 mb-2">Balance Total</div>
        <div className="text-4xl font-bold mb-4">$12,458.32</div>
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="h-4 w-4" />
          <span>+8.24% ($948.12)</span>
        </div>
      </div>

      {/* Today's Change */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="text-sm text-muted-foreground mb-2">Cambio de Hoy</div>
        <div className="text-3xl font-bold text-accent mb-4">+$234.56</div>
        <div className="flex items-center gap-2 text-sm text-accent">
          <TrendingUp className="h-4 w-4" />
          <span>+1.92%</span>
        </div>
      </div>

      {/* Available Balance */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="text-sm text-muted-foreground mb-2">Balance Disponible</div>
        <div className="text-3xl font-bold text-foreground mb-4">$3,245.00</div>
        <div className="text-sm text-muted-foreground">USD</div>
      </div>
    </div>
  )
}
