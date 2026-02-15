"use client"

<<<<<<< HEAD
import type React from "react"

import { useState, useEffect } from "react"
=======
import { useEffect, useState } from "react"
>>>>>>> dc4a679 (last local change)
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
<<<<<<< HEAD
import { AlertCircle, CheckCircle, Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function NuevaContrasenaPage() {
  const router = useRouter()
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
    const supabase = createClient()

    // Listen for the PASSWORD_RECOVERY event from Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === "PASSWORD_RECOVERY") {
          setSessionReady(true)
          setCheckingSession(false)
        }
      }
    )

    // Also check if user already has a session (in case the event already fired)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setSessionReady(true)
      }
      setCheckingSession(false)
    }

    // Give a small delay for the auth event to fire, then check session
    const timeout = setTimeout(checkSession, 2000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
=======
import { AlertCircle, CheckCircle, ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function NewPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    async function checkSession() {
      const supabase = createClient()
      const { data, error: sessionError } = await supabase.auth.getUser()

      if (sessionError || !data.user) {
        setError("Tu enlace expiró o no es válido. Solicita una nueva recuperación.")
      }

      setCheckingSession(false)
    }

    checkSession()
>>>>>>> dc4a679 (last local change)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password.length < 8) {
<<<<<<< HEAD
      setError("La contrasena debe tener al menos 8 caracteres")
=======
      setError("La contraseña debe tener al menos 8 caracteres")
>>>>>>> dc4a679 (last local change)
      return
    }

    if (password !== confirmPassword) {
<<<<<<< HEAD
      setError("Las contrasenas no coinciden")
=======
      setError("Las contraseñas no coinciden")
>>>>>>> dc4a679 (last local change)
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
<<<<<<< HEAD

      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        console.error("Password update error:", updateError)
        if (updateError.message.includes("same as")) {
          setError("La nueva contrasena debe ser diferente a la anterior")
        } else {
          setError(updateError.message)
        }
=======
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })

      if (updateError) {
        setError(updateError.message)
>>>>>>> dc4a679 (last local change)
        setLoading(false)
        return
      }

<<<<<<< HEAD
      // Sign out so user logs in fresh with new password
=======
>>>>>>> dc4a679 (last local change)
      await supabase.auth.signOut()
      setSuccess(true)
      setLoading(false)
    } catch (err) {
      console.error("Unexpected error updating password:", err)
<<<<<<< HEAD
      setError("Error al actualizar la contrasena. Intenta nuevamente.")
=======
      setError("Ocurrió un error inesperado. Intenta nuevamente.")
>>>>>>> dc4a679 (last local change)
      setLoading(false)
    }
  }

<<<<<<< HEAD
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="w-full max-w-md">
        {/* Logo */}
=======
  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando enlace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="w-full max-w-md">
>>>>>>> dc4a679 (last local change)
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">B</span>
          </div>
          <span className="text-2xl font-bold text-foreground">Biconnect</span>
        </Link>

<<<<<<< HEAD
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
              <h1 className="text-2xl font-bold text-foreground mb-2">Contrasena actualizada</h1>
              <p className="text-muted-foreground mb-6">
                Tu contrasena ha sido actualizada correctamente. Ya podes iniciar sesion con tu nueva contrasena.
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
                <h1 className="text-3xl font-bold text-foreground mb-2">Nueva contrasena</h1>
                <p className="text-muted-foreground">
                  Ingresa tu nueva contrasena para restablecer el acceso a tu cuenta.
                </p>
=======
        <div className="bg-card border border-border rounded-2xl shadow-xl p-8">
          {!success ? (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground mb-2">Nueva contraseña</h1>
                <p className="text-muted-foreground">Elige una contraseña segura para tu cuenta</p>
>>>>>>> dc4a679 (last local change)
              </div>

              {error && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
<<<<<<< HEAD
                  <Label htmlFor="password">Nueva contrasena</Label>
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
                      aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar contrasena</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Repeti tu nueva contrasena"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-12 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showConfirmPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
=======
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12"
                  />
>>>>>>> dc4a679 (last local change)
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                  disabled={loading}
                >
<<<<<<< HEAD
                  {loading ? "Actualizando..." : "Actualizar contrasena"}
=======
                  {loading ? "Guardando..." : "Guardar nueva contraseña"}
>>>>>>> dc4a679 (last local change)
                </Button>
              </form>

              <div className="mt-6">
<<<<<<< HEAD
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver al inicio de sesion
                </Link>
              </div>
            </>
=======
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver al inicio de sesión
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-accent" />
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Contraseña actualizada</h1>
                <p className="text-muted-foreground">Ya puedes iniciar sesión con tu nueva contraseña</p>
              </div>

              <Button
                size="lg"
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                onClick={() => router.push("/login")}
              >
                Ir a iniciar sesión
              </Button>
            </>
>>>>>>> dc4a679 (last local change)
          )}
        </div>
      </div>
    </div>
  )
}
