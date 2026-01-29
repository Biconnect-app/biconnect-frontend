"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save } from "lucide-react"
import { ApiKeyAlert } from "@/components/api-key-alert"
import { createClient } from "@/lib/supabase/client"

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    plan: "Plan Gratuito",
  })

  const supabase = createClient()

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Obtener datos del perfil
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name, plan")
          .eq("id", user.id)
          .single()

        setUserData({
          firstName: profile?.first_name || "",
          lastName: profile?.last_name || "",
          email: user.email || "",
          plan: profile?.plan === "pro" ? "Plan Pro" : "Plan Gratuito",
        })
      }
    } catch (error) {
      console.error("Error loading user data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { error } = await supabase
          .from("profiles")
          .update({
            first_name: userData.firstName,
            last_name: userData.lastName,
          })
          .eq("id", user.id)

        if (error) {
          console.error("Error saving profile:", error)
          alert("Error al guardar los cambios")
        } else {
          alert("Cambios guardados correctamente")
        }
      }
    } catch (error) {
      console.error("Error saving:", error)
      alert("Error al guardar los cambios")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="space-y-6 max-w-3xl">
        <ApiKeyAlert />

        <div>
          <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
          <p className="text-muted-foreground mt-1">Gestiona tu perfil</p>
        </div>

        {/* Profile */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Perfil</h2>

          {loading ? (
            <div className="text-muted-foreground">Cargando...</div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input
                    id="firstName"
                    value={userData.firstName}
                    onChange={(e) => setUserData({ ...userData, firstName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input
                    id="lastName"
                    value={userData.lastName}
                    onChange={(e) => setUserData({ ...userData, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={userData.email}
                  disabled
                  className="bg-muted/50"
                />
                <p className="text-xs text-muted-foreground">El email no puede ser modificado</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan">Plan actual</Label>
                <Input id="plan" value={userData.plan} disabled />
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
            onClick={handleSave}
            disabled={loading || saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </div>
  )
}
