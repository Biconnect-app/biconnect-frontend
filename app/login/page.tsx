"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    emailOrUsername: "", // Changed from 'email' to 'emailOrUsername'
    password: "",
  })

  useEffect(() => {
    if (searchParams.get("expired") === "true") {
      setError("Tu sesión ha expirado por seguridad. Por favor inicia sesión nuevamente.")
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (formData.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      let emailToUse = formData.emailOrUsername

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const isEmail = emailRegex.test(formData.emailOrUsername)

      if (!isEmail) {
        // Input is a username, look up the email
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", formData.emailOrUsername)
          .maybeSingle()

        if (profileError) {
          console.error("Error looking up username:", profileError)
          setError("Error al buscar el usuario")
          setLoading(false)
          return
        }

        if (!profile) {
          setError("Usuario o contraseña incorrectos")
          setLoading(false)
          return
        }

        // Get the email from auth.users using the user ID
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(profile.id)

        if (userError || !userData.user) {
          console.error("Error getting user email:", userError)
          setError("Error al obtener información del usuario")
          setLoading(false)
          return
        }

        emailToUse = userData.user.email || ""
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password: formData.password,
      })

      if (signInError) {
        console.error("Login error:", signInError)
        if (signInError.message.includes("Email not confirmed")) {
          setError("Por favor verifica tu email antes de iniciar sesión")
        } else if (signInError.message.includes("Invalid login credentials")) {
          setError("Usuario o contraseña incorrectos")
        } else {
          setError(signInError.message)
        }
        setLoading(false)
        return
      }

      if (data.user) {
        const previewDataString = sessionStorage.getItem("previewStrategy")
        const fromPreviewString = sessionStorage.getItem("fromPreview")

        if (previewDataString && fromPreviewString === "true") {
          try {
            const strategyData = JSON.parse(previewDataString)
            console.log("Preview strategy detected for logged in user, will process in dashboard")

            // Verificar si el nombre de la estrategia ya existe
            const { data: existingStrategies, error: checkError } = await supabase
              .from("strategies")
              .select("name")
              .eq("user_id", data.user.id)
              .eq("name", strategyData.name)

            if (checkError) {
              console.error("Error checking existing strategy names:", checkError)
            } else if (existingStrategies && existingStrategies.length > 0) {
              // Encontrar un nombre único agregando (copia), (copia 2), etc.
              let newName = `${strategyData.name} (copia)`
              let counter = 2

              while (true) {
                const { data: duplicateCheck } = await supabase
                  .from("strategies")
                  .select("name")
                  .eq("user_id", data.user.id)
                  .eq("name", newName)

                if (!duplicateCheck || duplicateCheck.length === 0) {
                  break
                }

                newName = `${strategyData.name} (copia ${counter})`
                counter++
              }

              strategyData.name = newName

              // Actualizar el sessionStorage con el nuevo nombre
              sessionStorage.setItem("previewStrategy", JSON.stringify(strategyData))
            }
          } catch (error) {
            console.error("Error processing preview strategy name:", error)
          }
        }

        localStorage.setItem("login_timestamp", Date.now().toString())
        router.replace("/dashboard/estrategias")
      }
    } catch (err) {
      console.error("Unexpected error during login:", err)
      setError("Error al iniciar sesión. Intenta nuevamente.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">B</span>
          </div>
          <span className="text-2xl font-bold text-foreground">Biconnect</span>
        </Link>

        {/* Login Card */}
        <div className="bg-card border border-border rounded-2xl shadow-xl p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Bienvenido de nuevo</h1>
            <p className="text-muted-foreground">Ingresa a tu cuenta para continuar</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email or Username */}
            <div className="space-y-2">
              <Label htmlFor="emailOrUsername">Email o usuario</Label>
              <Input
                id="emailOrUsername"
                type="text"
                placeholder="tu@email.com o usuario"
                required
                value={formData.emailOrUsername}
                onChange={(e) => setFormData({ ...formData, emailOrUsername: e.target.value })}
                className="h-12"
                aria-invalid={error ? "true" : "false"}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="h-12 pr-12"
                  aria-invalid={error ? "true" : "false"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox id="remember" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(!!checked)} />
                <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                  Recordarme
                </Label>
              </div>
              <Link href="/recuperar" className="text-sm text-primary hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              disabled={loading}
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </Button>
          </form>

          {/* Sign Up Link */}
          <p className="mt-8 text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link href="/registro" className="text-primary font-semibold hover:underline">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
