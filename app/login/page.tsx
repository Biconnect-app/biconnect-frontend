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

    console.log("[v0] Login attempt for:", formData.emailOrUsername)

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
        console.log("[v0] Input is username, looking up email...")
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", formData.emailOrUsername)
          .maybeSingle()

        if (profileError) {
          console.error("[v0] Error looking up username:", profileError)
          setError("Error al buscar el usuario")
          setLoading(false)
          return
        }

        if (!profile) {
          console.log("[v0] Username not found")
          setError("Usuario o contraseña incorrectos")
          setLoading(false)
          return
        }

        // Get the email from auth.users using the user ID
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(profile.id)

        if (userError || !userData.user) {
          console.error("[v0] Error getting user email:", userError)
          setError("Error al obtener información del usuario")
          setLoading(false)
          return
        }

        emailToUse = userData.user.email || ""
        console.log("[v0] Found email for username:", emailToUse)
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password: formData.password,
      })

      console.log("[v0] Login response:", { data, error: signInError })

      if (signInError) {
        console.error("[v0] Login error:", signInError)
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
            console.log("[v0] User logged in from preview, checking strategy name:", strategyData.name)

            // Verificar si el nombre de la estrategia ya existe
            const { data: existingStrategies, error: checkError } = await supabase
              .from("strategies")
              .select("name")
              .eq("user_id", data.user.id)
              .eq("name", strategyData.name)

            if (checkError) {
              console.error("[v0] Error checking existing strategy names:", checkError)
            } else if (existingStrategies && existingStrategies.length > 0) {
              console.log("[v0] Strategy name already exists, adding (copia) suffix")

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

              console.log("[v0] New unique strategy name:", newName)
              strategyData.name = newName

              // Actualizar el sessionStorage con el nuevo nombre
              sessionStorage.setItem("previewStrategy", JSON.stringify(strategyData))
            }
          } catch (error) {
            console.error("[v0] Error processing preview strategy name:", error)
          }
        }

        localStorage.setItem("login_timestamp", Date.now().toString())
        console.log("[v0] Login successful, redirecting to /app/estrategias")
        router.replace("/app/estrategias")
      }
    } catch (err) {
      console.error("[v0] Unexpected error during login:", err)
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

          {/* OAuth Placeholder */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-card text-muted-foreground">O continúa con</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <Button variant="outline" disabled className="bg-transparent">
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>
              <Button variant="outline" disabled className="bg-transparent">
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
              </Button>
            </div>
          </div>

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
