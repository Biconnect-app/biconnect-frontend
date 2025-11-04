import { DashboardLayout } from "@/components/dashboard/layout"

export default function OrdersPage() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Órdenes</h1>
            <p className="text-muted-foreground">Gestiona tus órdenes activas y pendientes</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <p className="text-muted-foreground">
              Esta página mostrará todas tus órdenes activas, pendientes, completadas y canceladas.
            </p>
            <p className="text-sm text-muted-foreground mt-4">Integrar con backend real para gestión de órdenes.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
