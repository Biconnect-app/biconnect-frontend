import { DashboardLayout } from "@/components/dashboard/layout"

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Configuración</h1>
            <p className="text-muted-foreground">Administra tu cuenta y preferencias</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <p className="text-muted-foreground">
              Esta página contendrá configuraciones de cuenta, seguridad (2FA), notificaciones, y preferencias de la
              plataforma.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Integrar con backend real para gestión de configuración de usuario.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
