"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle, Eye, EyeOff, ArrowLeft, Loader2, Moon, Sun } from "lucide-react"
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth"
import { firebaseAuth } from "@/lib/firebase/client"
import { useTheme } from "next-themes"

export default function NuevaContrasenaPage() {
  const router = useRouter()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const oobCode = params.get("oobCode")

    if (!oobCode) {
      setSessionReady(false)
      setCheckingSession(false)
      return
    }

    const verify = async () => {
      try {
        await verifyPasswordResetCode(firebaseAuth, oobCode)
        setSessionReady(true)
      } catch (error) {
        console.error("Invalid reset code:", error)
        setSessionReady(false)
      } finally {
        setCheckingSession(false)
      }
    }

    verify()
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      return
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    setLoading(true)

    try {
      const params = new URLSearchParams(window.location.search)
      const oobCode = params.get("oobCode")

      if (!oobCode) {
        setError("Enlace invalido o expirado")
        setLoading(false)
        return
      }

      await confirmPasswordReset(firebaseAuth, oobCode, password)
      setSuccess(true)
      setLoading(false)

      setTimeout(() => {
        router.push("/login")
      }, 3000)
    } catch (err) {
      console.error("Unexpected error updating password:", err)
      setError("Error al actualizar la contraseña. Intenta nuevamente.")
      setLoading(false)
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

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl shadow-xl p-8">
          {checkingSession ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto mb-4" />
              <p className="text-muted-foreground">Verificando enlace de recuperacion...</p>
            </div>
          ) : !sessionReady && !success ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Enlace invalido o expirado</h1>
              <p className="text-muted-foreground mb-6">
                El enlace de recuperacion ha expirado o ya fue utilizado. Solicita uno nuevo.
              </p>
              <Link href="/recuperar">
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  Solicitar nuevo enlace
                </Button>
              </Link>
            </div>
          ) : success ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-accent" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Contraseña actualizada</h1>
              <p className="text-muted-foreground mb-6">
                Tu contraseña ha sido actualizada correctamente. Seras redirigido al inicio de sesion en unos segundos.
              </p>
              <Link href="/login">
                <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" size="lg">
                  Iniciar sesion
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground mb-2">Nueva contraseña</h1>
                <p className="text-muted-foreground">
                  Ingresa tu nueva contraseña para restablecer el acceso a tu cuenta.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="password">Nueva contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimo 8 caracteres"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Repeti tu nueva contraseña"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                  disabled={loading}
                >
                  {loading ? "Actualizando..." : "Actualizar contraseña"}
                </Button>
              </form>

              <div className="mt-6">
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver al inicio de sesion
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
