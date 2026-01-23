"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Save } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ApiKeyAlert } from "@/components/api-key-alert"

export default function SettingsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="space-y-6 max-w-3xl">
        <ApiKeyAlert />

        <div>
          <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
          <p className="text-muted-foreground mt-1">Gestiona tu perfil y preferencias</p>
        </div>

        {/* Profile */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Perfil</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" defaultValue="Juan Pérez" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="juan@example.com" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan">Plan actual</Label>
            <Input id="plan" defaultValue="Plan Gratuito" disabled />
          </div>
        </div>

        {/* Security */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Seguridad</h2>

          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div>
              <div className="font-medium text-foreground">Autenticación de dos factores (2FA)</div>
              <div className="text-sm text-muted-foreground">Requiere Plan Pro</div>
            </div>
            <input type="checkbox" disabled className="h-4 w-4" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ip-allowlist">IP Allowlist (CIDR)</Label>
            <Textarea
              id="ip-allowlist"
              placeholder="192.168.1.0/24&#10;10.0.0.0/8"
              rows={3}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">Solo estas IPs podrán enviar webhooks (Plan Pro)</p>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Notificaciones</h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div>
                <div className="font-medium text-foreground">Alertas por email</div>
                <div className="text-sm text-muted-foreground">Recibe notificaciones de errores</div>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4" />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div>
                <div className="font-medium text-foreground">Alertas por Telegram</div>
                <div className="text-sm text-muted-foreground">Requiere Plan Pro</div>
              </div>
              <input type="checkbox" disabled className="h-4 w-4" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="telegram-webhook">Telegram Webhook URL</Label>
            <Input id="telegram-webhook" placeholder="https://api.telegram.org/bot..." disabled />
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Preferencias</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timezone">Zona horaria</Label>
              <Select defaultValue="america-santiago">
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="america-santiago">América/Santiago</SelectItem>
                  <SelectItem value="america-mexico">América/México</SelectItem>
                  <SelectItem value="america-argentina">América/Buenos Aires</SelectItem>
                  <SelectItem value="utc">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Moneda base</Label>
              <Select defaultValue="usd">
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usd">USD</SelectItem>
                  <SelectItem value="eur">EUR</SelectItem>
                  <SelectItem value="clp">CLP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Save className="h-4 w-4 mr-2" />
            Guardar cambios
          </Button>
        </div>
      </div>
    </div>
  )
}
