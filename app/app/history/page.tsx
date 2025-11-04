import { DashboardLayout } from "@/components/dashboard/layout"

export default function HistoryPage() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Historial</h1>
            <p className="text-muted-foreground">Revisa todas tus transacciones y operaciones</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <p className="text-muted-foreground">
              Esta página mostrará el historial completo de transacciones, depósitos, retiros y operaciones.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Integrar con backend real para historial de transacciones.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
