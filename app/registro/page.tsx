"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, AlertCircle, Check, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planFromUrl = searchParams.get("plan") || "free"

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(null)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    plan: planFromUrl,
  })

  // Password validation
  const passwordValidation = {
    length: formData.password.length >= 8,
    number: /\d/.test(formData.password),
    uppercase: /[A-Z]/.test(formData.password),
    symbol: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
  }

  const isPasswordValid = Object.values(passwordValidation).every(Boolean)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    console.log("Registration attempt for:", formData.email, "username:", formData.username)

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Por favor ingresa un email válido")
      setLoading(false)
      return
    }

    // Validate password
    if (!isPasswordValid) {
      setError("La contraseña no cumple con todos los requisitos")
      setLoading(false)
      return
    }

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      setLoading(false)
      return
    }

    // Validate terms
    if (!acceptTerms) {
      setError("Debes aceptar los términos y condiciones")
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()

      console.log("Checking if username already exists...")
      const { data: existingUsername, error: usernameCheckError } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", formData.username)
        .maybeSingle()

      if (usernameCheckError) {
        console.error("Error checking username:", usernameCheckError)
      }

      if (existingUsername) {
        console.log("Username already exists")
        setError("Este nombre de usuario ya está en uso. Por favor elige otro.")
        setLoading(false)
        return
      }

      // Sign up with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard/estrategias`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            username: formData.username,
            plan: formData.plan,
          },
        },
      })

      console.log("Registration response:", { data, error: signUpError })

      if (signUpError) {
        console.error("Registration error:", signUpError)
        console.error("Error code:", signUpError.code)
        console.error("Error status:", signUpError.status)

        if (
          signUpError.message.includes("already registered") ||
          signUpError.message.includes("User already registered") ||
          signUpError.code === "user_already_exists"
        ) {
          setError("Este email ya está registrado. Por favor inicia sesión o usa otro email.")
        } else if (signUpError.message.includes("Database error")) {
          // This could be username conflict if our check above failed
          setError("El nombre de usuario ya está en uso. Por favor elige otro.")
        } else if (signUpError.message.includes("Invalid email")) {
          setError("El email ingresado no es válido")
        } else if (signUpError.message.includes("Password")) {
          setError("La contraseña no cumple con los requisitos de seguridad")
        } else {
          setError(`Error al crear la cuenta: ${signUpError.message}`)
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
            console.log("Saving pending strategy for user:", formData.email)

            // Save to pending_strategies table with user's email
            const { error: pendingError } = await supabase.from("pending_strategies").upsert(
              {
                email: formData.email.toLowerCase(),
                strategy_data: strategyData,
              },
              {
                onConflict: "email",
                ignoreDuplicates: false, // Replace existing strategy
              },
            )

            if (pendingError) {
              console.error("Error saving pending strategy:", pendingError)
            } else {
              console.log("Pending strategy saved successfully")
            }
          } catch (error) {
            console.error("Error saving pending strategy:", error)
          }
        }

        console.log("Registration successful, redirecting to success page")
        router.push(`/registro/exito?email=${encodeURIComponent(formData.email)}`)
      }
    } catch (err) {
      console.error("Unexpected error during registration:", err)
      setError("Error inesperado al crear la cuenta. Por favor intenta nuevamente.")
      setLoading(false)
    }
  }

  const handleOAuthSignUp = async (provider: "google" | "github") => {
    setError("")
    setOauthLoading(provider)

    try {
      const supabase = createClient()
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error(`${provider} OAuth error:`, error)
        setError(`Error al registrarse con ${provider === "google" ? "Google" : "GitHub"}`)
        setOauthLoading(null)
      }
    } catch (err) {
      console.error(`Unexpected ${provider} OAuth error:`, err)
      setError(`Error inesperado al registrarse con ${provider === "google" ? "Google" : "GitHub"}`)
      setOauthLoading(null)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">B</span>
          </div>
          <span className="text-2xl font-bold text-foreground">Biconnect</span>
        </Link>

        {/* Register Card */}
        <div className="bg-card border border-border rounded-2xl shadow-xl p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Crear cuenta</h1>
            <p className="text-muted-foreground">Automatiza tus estrategias de TradingView en segundos</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* OAuth Buttons */}
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-4">
              <Button 
                type="button"
                variant="outline" 
                className="bg-transparent h-12"
                onClick={() => handleOAuthSignUp("google")}
                disabled={loading || oauthLoading !== null}
              >
                {oauthLoading === "google" ? (
                  <div className="h-5 w-5 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
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
                )}
                Google
              </Button>
              <Button 
                type="button"
                variant="outline" 
                className="bg-transparent h-12"
                onClick={() => handleOAuthSignUp("github")}
                disabled={loading || oauthLoading !== null}
              >
                {oauthLoading === "github" ? (
                  <div className="h-5 w-5 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                )}
                GitHub
              </Button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-card text-muted-foreground">O regístrate con email</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* First Name */}
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Juan"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="h-12"
                />
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Pérez"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="h-12"
                />
              </div>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                type="text"
                placeholder="juanperez"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="h-12"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-12"
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

              {/* Password Requirements */}
              {formData.password && (
                <div className="mt-3 space-y-2 text-sm">
                  <div
                    className={`flex items-center gap-2 ${passwordValidation.length ? "text-accent" : "text-muted-foreground"}`}
                  >
                    {passwordValidation.length ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    <span>Mínimo 8 caracteres</span>
                  </div>
                  <div
                    className={`flex items-center gap-2 ${passwordValidation.number ? "text-accent" : "text-muted-foreground"}`}
                  >
                    {passwordValidation.number ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    <span>Al menos un número</span>
                  </div>
                  <div
                    className={`flex items-center gap-2 ${passwordValidation.uppercase ? "text-accent" : "text-muted-foreground"}`}
                  >
                    {passwordValidation.uppercase ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    <span>Al menos una mayúscula</span>
                  </div>
                  <div
                    className={`flex items-center gap-2 ${passwordValidation.symbol ? "text-accent" : "text-muted-foreground"}`}
                  >
                    {passwordValidation.symbol ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    <span>Al menos un símbolo (!@#$%...)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="h-12 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-sm text-destructive flex items-center gap-2">
                  <X className="h-4 w-4" />
                  Las contraseñas no coinciden
                </p>
              )}
            </div>

            {/* Plan Selection */}
            <div className="space-y-3">
              <Label>Selecciona tu plan</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, plan: "free" })}
                  className={`relative p-5 border-2 rounded-xl text-left transition-all ${
                    formData.plan === "free"
                      ? "border-accent bg-accent/10 shadow-lg shadow-accent/20 ring-2 ring-accent/30"
                      : "border-border hover:border-accent/50 hover:bg-accent/5"
                  }`}
                >
                  {formData.plan === "free" && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-accent-foreground" />
                    </div>
                  )}
                  <div className="font-semibold text-foreground mb-1">Plan Gratuito</div>
                  <div className="text-sm text-muted-foreground">100 ejecuciones/mes</div>
                  {formData.plan === "free" && <div className="mt-2 text-xs font-medium text-accent">Seleccionado</div>}
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, plan: "pro" })}
                  className={`relative p-5 border-2 rounded-xl text-left transition-all ${
                    formData.plan === "pro"
                      ? "border-accent bg-accent/10 shadow-lg shadow-accent/20 ring-2 ring-accent/30"
                      : "border-border hover:border-accent/50 hover:bg-accent/5"
                  }`}
                >
                  {formData.plan === "pro" && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-accent-foreground" />
                    </div>
                  )}
                  <div className="font-semibold text-foreground mb-1">Plan Pro</div>
                  <div className="text-sm text-muted-foreground">Ejecuciones ilimitadas</div>
                  {formData.plan === "pro" && <div className="mt-2 text-xs font-medium text-accent">Seleccionado</div>}
                </button>
              </div>
            </div>

            {/* Pro Plan Payment Placeholder */}
            {formData.plan === "pro" && (
              <div className="p-4 bg-muted/50 border border-border rounded-xl">
                <p className="text-sm text-muted-foreground mb-2">
                  <strong className="text-foreground">Nota:</strong> Integrar pasarela de pago aquí
                </p>
                <p className="text-xs text-muted-foreground">
                  En producción, aquí se integraría Stripe u otra pasarela de pago para procesar el pago del plan Pro.
                </p>
              </div>
            )}

            {/* Terms */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={(checked) => setAcceptTerms(!!checked)}
                required
                className="mt-1"
              />
              <Label htmlFor="terms" className="text-sm font-normal cursor-pointer leading-relaxed">
                Acepto los{" "}
                <Link href="/terminos" className="text-primary hover:underline">
                  Términos y Condiciones
                </Link>{" "}
                y la{" "}
                <Link href="/privacidad" className="text-primary hover:underline">
                  Política de Privacidad
                </Link>
              </Label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              disabled={loading || !acceptTerms || !isPasswordValid}
            >
              {loading ? "Registrando..." : "Crear cuenta"}
            </Button>
          </form>

          {/* Login Link */}
          <p className="mt-8 text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Ingresa
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
