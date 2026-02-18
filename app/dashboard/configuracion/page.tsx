"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save, Eye, EyeOff, Check, X, Key } from "lucide-react"
import { ApiKeyAlert } from "@/components/api-key-alert"
import { createClient } from "@/lib/supabase/client"

interface ProfileData {
  first_name: string | null
  last_name: string | null
  plan: string
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    plan: "Plan Gratuito",
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState("")

  const supabase = createClient()

  // Password validation
  const passwordValidation = {
    length: passwordData.newPassword.length >= 8,
    number: /\d/.test(passwordData.newPassword),
    uppercase: /[A-Z]/.test(passwordData.newPassword),
    symbol: /[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword),
  }

  const isPasswordValid = Object.values(passwordValidation).every(Boolean)

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

        setProfileData(profile)
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

  const handlePasswordChange = async () => {
    setPasswordError("")
    setPasswordSuccess("")

    // Validate current password is provided
    if (!passwordData.currentPassword) {
      setPasswordError("Debes ingresar tu contraseña actual")
      return
    }

    // Validate passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("Las contraseñas no coinciden")
      return
    }

    // Validate password strength
    if (!isPasswordValid) {
      setPasswordError("La contraseña no cumple con todos los requisitos")
      return
    }

    try {
      setSavingPassword(true)

      // Get current user email
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) {
        setPasswordError("No se pudo obtener el email del usuario")
        return
      }

      // Verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.currentPassword,
      })

      if (signInError) {
        setPasswordError("La contraseña actual es incorrecta")
        setSavingPassword(false)
        return
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      })

      if (error) {
        console.error("Error changing password:", error)
        setPasswordError("Error al cambiar la contraseña: " + error.message)
      } else {
        setPasswordSuccess("Contraseña cambiada correctamente")
        // Clear form
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      }
    } catch (error) {
      console.error("Error changing password:", error)
      setPasswordError("Error al cambiar la contraseña")
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="space-y-6 max-w-3xl">
        <ApiKeyAlert />

        <div>
          <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
          <p className="text-gray-400 mt-1">Gestiona tu perfil</p>
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
            </>
          )}
        </div>

        {/* Change Password */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-blue-400" />
            <h2 className="text-xl font-semibold text-foreground">Cambiar contraseña</h2>
          </div>

          {passwordError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{passwordError}</p>
            </div>
          )}

          {passwordSuccess && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <p className="text-sm text-green-600 dark:text-green-400">{passwordSuccess}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Contraseña actual</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva contraseña</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {passwordData.newPassword && (
              <div className="space-y-2 text-sm">
                <p className="font-medium text-foreground">La contraseña debe tener:</p>
                <div className="space-y-1">
                  <div className={`flex items-center gap-2 ${passwordValidation.length ? "text-green-500" : "text-gray-400"}`}>
                    {passwordValidation.length ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    <span>Mínimo 8 caracteres</span>
                  </div>
                  <div className={`flex items-center gap-2 ${passwordValidation.number ? "text-green-500" : "text-gray-400"}`}>
                    {passwordValidation.number ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    <span>Al menos un número</span>
                  </div>
                  <div className={`flex items-center gap-2 ${passwordValidation.uppercase ? "text-green-500" : "text-gray-400"}`}>
                    {passwordValidation.uppercase ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    <span>Al menos una mayúscula</span>
                  </div>
                  <div className={`flex items-center gap-2 ${passwordValidation.symbol ? "text-green-500" : "text-gray-400"}`}>
                    {passwordValidation.symbol ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    <span>Al menos un símbolo (!@#$%...)</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              className="bg-blue-500 hover:bg-blue-600 text-white"
              onClick={handlePasswordChange}
              disabled={!passwordData.newPassword || !passwordData.confirmPassword || savingPassword}
            >
              <Key className="h-4 w-4 mr-2" />
              {savingPassword ? "Cambiando contraseña..." : "Cambiar contraseña"}
            </Button>
          </div>
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
