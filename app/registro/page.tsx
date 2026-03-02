"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, AlertCircle, Check, X, Moon, Sun } from "lucide-react"
import { createUserWithEmailAndPassword, sendEmailVerification, setPersistence, browserSessionPersistence } from "firebase/auth"
import { firebaseAuth } from "@/lib/firebase/client"
import { authFetch } from "@/lib/api"
import { useTheme } from "next-themes"

export default function RegisterPage() {
  const router = useRouter()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  // Password validation
  const passwordValidation = {
    length: formData.password.length >= 8,
    number: /\d/.test(formData.password),
    uppercase: /[A-Z]/.test(formData.password),
    symbol: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
  }

  const isPasswordValid = Object.values(passwordValidation).every(Boolean)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    console.log("Registration attempt for:", formData.email)

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
      const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/registro/confirmado`
        : `${window.location.origin}/registro/confirmado`

      await setPersistence(firebaseAuth, browserSessionPersistence)
      const credential = await createUserWithEmailAndPassword(firebaseAuth, formData.email, formData.password)
      const user = credential.user

      await sendEmailVerification(user, { url: redirectUrl })

      try {
        sessionStorage.setItem("signup_email", formData.email)
      } catch (storageError) {
        console.warn("Unable to persist signup email in sessionStorage", storageError)
      }

      await authFetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          plan: "free",
        }),
      })

      if (user) {
        // Check both localStorage and sessionStorage
        const previewDataString = localStorage.getItem("previewStrategy") || sessionStorage.getItem("previewStrategy")
        const fromPreviewString = localStorage.getItem("fromPreview") || sessionStorage.getItem("fromPreview")

        console.log("📋 Registro - Checking for preview strategy:", { 
          hasPreviewData: !!previewDataString, 
          fromPreview: fromPreviewString,
          email: formData.email 
        })

        if (previewDataString && fromPreviewString === "true") {
          try {
            const strategyData = JSON.parse(previewDataString)
            console.log("💾 Registro - Saving pending strategy for user:", formData.email)
            console.log("💾 Strategy data:", { name: strategyData.name, exchange: strategyData.exchange })

            // Save to pending_strategies table with user's email
            const pendingResponse = await fetch("/api/pending-strategies", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: formData.email.toLowerCase(),
                strategy_data: strategyData,
              }),
            })

            if (!pendingResponse.ok) {
              console.error("❌ Registro - Error saving pending strategy")
            } else {
              console.log("✅ Registro - Pending strategy saved successfully to database")
              console.log("✅ LocalStorage + SessionStorage preserved for confirmation + login")
            }
          } catch (error) {
            console.error("❌ Registro - Error saving pending strategy:", error)
          }
        } else {
          console.log("⚠️ Registro - No preview strategy found in sessionStorage")
        }

        console.log("Registration successful, redirecting to success page")
        router.push(`/registro/exito?email=${encodeURIComponent(formData.email)}`)
      }
    } catch (err) {
      console.error("Registration error:", err)
      const message = err instanceof Error ? err.message : ""
      if (message.includes("email-already-in-use")) {
        setError("Este email ya está registrado. Por favor inicia sesión o usa otro email.")
      } else if (message.includes("invalid-email")) {
        setError("El email ingresado no es válido")
      } else if (message.includes("weak-password")) {
        setError("La contraseña no cumple con los requisitos de seguridad")
      } else {
        setError("Error inesperado al crear la cuenta. Por favor intenta nuevamente.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Theme Toggle */}
      {mounted && (
        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="fixed top-4 right-4 p-2 rounded-lg bg-card border border-border hover:bg-accent/10 transition-colors"
          aria-label="Toggle theme"
        >
          {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      )}
      
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">C</span>
          </div>
          <span className="text-2xl font-bold text-foreground">Cuanted</span>
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

            {/* Terms */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={(checked) => setAcceptTerms(!!checked)}
                required
                className="mt-1"
              />
              <Label htmlFor="terms" className="text-sm font-normal cursor-pointer text-muted-foreground">
                He leído y acepto los<a href="/terminos" className="text-primary font-semibold hover:underline"> Términos de Uso</a> y la<a href="/privacidad" className="text-primary font-semibold hover:underline"> Política de Privacidad</a>
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
