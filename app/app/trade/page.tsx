import { DashboardLayout } from "@/components/dashboard/layout"

export default function TradePage() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Comprar/Vender</h1>
            <p className="text-muted-foreground">Página de trading - Funcionalidad pendiente de implementación</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <p className="text-muted-foreground">
              Esta página contendrá la interfaz de trading completa con gráficos, libro de órdenes, y formularios de
              compra/venta.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Integrar con backend real para ejecutar operaciones de trading.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
