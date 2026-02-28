"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, AlertCircle, Moon, Sun } from "lucide-react"
import { signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence, browserSessionPersistence } from "firebase/auth"
import { firebaseAuth, getIdToken } from "@/lib/firebase/client"
import { authFetch } from "@/lib/api"
import { useTheme } from "next-themes"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)
  const [resendToken, setResendToken] = useState<string | null>(null)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    emailOrUsername: "", // Changed from 'email' to 'emailOrUsername'
    password: "",
  })

  useEffect(() => {
    if (searchParams.get("expired") === "true") {
      setError("Tu sesión ha expirado por seguridad. Por favor inicia sesión nuevamente.")
    }
  }, [searchParams])

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    setResendMessage(null)

    if (formData.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      setLoading(false)
      return
    }

    try {
      let emailToUse = formData.emailOrUsername

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const isEmail = emailRegex.test(formData.emailOrUsername)

      if (!isEmail) {
        const response = await fetch("/api/auth/username-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: formData.emailOrUsername }),
        })

        if (!response.ok) {
          setError("Usuario o contraseña incorrectos")
          setLoading(false)
          return
        }

        const data = await response.json()
        emailToUse = data.email || ""
      }

      await setPersistence(firebaseAuth, rememberMe ? browserLocalPersistence : browserSessionPersistence)
      const credential = await signInWithEmailAndPassword(firebaseAuth, emailToUse, formData.password)
      const user = credential.user
      await user.getIdToken(true)
      await user.reload()

      if (!user.emailVerified) {
        const idToken = await user.getIdToken()
        setUnverifiedEmail(user.email || emailToUse)
        setResendToken(idToken)
        setResendMessage("Tu cuenta no está verificada. Puedes reenviar el correo desde aquí.")
        await signOut(firebaseAuth)
        setLoading(false)
        return
      }

      const idToken = await getIdToken()
      if (idToken) {
        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken, rememberMe }),
        })
      }

      if (user) {
        // Check both localStorage and sessionStorage
        const previewDataString = localStorage.getItem("previewStrategy") || sessionStorage.getItem("previewStrategy")
        const fromPreviewString = localStorage.getItem("fromPreview") || sessionStorage.getItem("fromPreview")

        console.log("📋 Login - Checking for preview strategy:", { 
          hasPreviewData: !!previewDataString, 
          fromPreview: fromPreviewString,
          email: user.email 
        })

        if (previewDataString && fromPreviewString === "true") {
          try {
            const strategyData = JSON.parse(previewDataString)
            console.log("💾 Login - Preview strategy detected, will process in dashboard")
            console.log("💾 Strategy data:", { name: strategyData.name, exchange: strategyData.exchange })

            // Verificar si el nombre de la estrategia ya existe
            const checkResponse = await authFetch("/api/profile/strategies/check-name", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: strategyData.name }),
            })

            if (!checkResponse.ok) {
              console.error("Error checking existing strategy names")
            } else {
              const checkData = await checkResponse.json()
              if (checkData.exists) {
              // Encontrar un nombre único agregando (copia), (copia 2), etc.
              const uniqueResponse = await authFetch("/api/profile/strategies/unique-name", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ baseName: strategyData.name }),
              })

              if (uniqueResponse.ok) {
                const uniqueData = await uniqueResponse.json()
                strategyData.name = uniqueData.name
              }

              // Actualizar tanto localStorage como sessionStorage con el nuevo nombre
              localStorage.setItem("previewStrategy", JSON.stringify(strategyData))
              sessionStorage.setItem("previewStrategy", JSON.stringify(strategyData))
            }
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

  const handleResendVerification = async () => {
    if (!resendToken) {
      setResendMessage("Tu sesión expiró. Inicia sesión nuevamente para reenviar el correo.")
      return
    }

    setResendLoading(true)
    setResendMessage(null)

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: resendToken }),
      })

      if (!response.ok) {
        throw new Error("resend-failed")
      }

      setResendMessage("Correo reenviado. Revisa tu bandeja de entrada.")
    } catch (resendError) {
      console.error("Resend verification failed:", resendError)
      setResendMessage("No se pudo reenviar el correo. Intenta nuevamente.")
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
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
      
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">C</span>
          </div>
          <span className="text-2xl font-bold text-foreground">Cuanted</span>
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

          {unverifiedEmail && (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                {resendMessage || `Tu cuenta (${unverifiedEmail}) no está verificada.`}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={handleResendVerification}
                disabled={resendLoading}
              >
                {resendLoading ? "Reenviando..." : "Reenviar correo de verificación"}
              </Button>
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
