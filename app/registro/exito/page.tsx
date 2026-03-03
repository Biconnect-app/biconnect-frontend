"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Mail, CheckCircle, Loader2, Moon, Sun } from "lucide-react"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "next-themes"
import { getIdToken } from "@/lib/firebase/client"

export default function SignUpSuccessPage() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const [resendStatus, setResendStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null)
  const [cooldownRemaining, setCooldownRemaining] = useState(0)
  const [cooldownAttempts, setCooldownAttempts] = useState(0)
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const baseCooldownSeconds = 120
  const maxCooldownSeconds = 900
  const cooldownKey = email ? `resend_verification:${email}` : "resend_verification:signup"

  useEffect(() => {
    const emailParam = searchParams.get("email")
    if (emailParam) {
      setEmail(emailParam)
      setResendStatus(null)
      return
    }

    try {
      const storedEmail = sessionStorage.getItem("signup_email")
      if (storedEmail) {
        setEmail(storedEmail)
      }
    } catch (storageError) {
      console.warn("Unable to read signup email from sessionStorage", storageError)
    }
  }, [searchParams])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(cooldownKey)
      if (!raw) {
        return
      }

      const data = JSON.parse(raw)
      if (typeof data?.until !== "number") {
        return
      }

      if (Date.now() >= data.until) {
        sessionStorage.removeItem(cooldownKey)
        return
      }

      setCooldownUntil(data.until)
      setCooldownAttempts(typeof data.attempts === "number" ? data.attempts : 0)
    } catch (storageError) {
      console.warn("Unable to read resend cooldown", storageError)
    }
  }, [cooldownKey])

  useEffect(() => {
    if (!cooldownUntil) {
      setCooldownRemaining(0)
      return
    }

    const updateRemaining = () => {
      const remaining = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000))
      setCooldownRemaining(remaining)

      if (remaining === 0) {
        setCooldownUntil(null)
      }
    }

    updateRemaining()
    const intervalId = window.setInterval(updateRemaining, 1000)
    return () => window.clearInterval(intervalId)
  }, [cooldownUntil])

  const formatCooldown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const startCooldown = () => {
    const nextAttempts = Math.min(cooldownAttempts + 1, 6)
    const nextSeconds = Math.min(baseCooldownSeconds * Math.pow(2, nextAttempts - 1), maxCooldownSeconds)
    const until = Date.now() + nextSeconds * 1000

    setCooldownAttempts(nextAttempts)
    setCooldownUntil(until)
    setCooldownRemaining(nextSeconds)

    sessionStorage.setItem(cooldownKey, JSON.stringify({ until, attempts: nextAttempts }))
  }

  const clearCooldown = () => {
    setCooldownAttempts(0)
    setCooldownUntil(null)
    setCooldownRemaining(0)

    sessionStorage.removeItem(cooldownKey)
  }

  const handleResendEmail = async () => {
    const idToken = await getIdToken()
    if (!idToken) {
      const message = "Tu sesión expiró. Por favor inicia sesión nuevamente para reenviar el correo."
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
      setResendStatus({ type: "error", message })
      return
    }

    if (cooldownRemaining > 0) {
      const message = `Espera ${formatCooldown(cooldownRemaining)} para reenviar el correo.`
      toast({
        title: "Espera un momento",
        description: message,
      })
      setResendStatus({ type: "error", message })
      return
    }

    setIsResending(true)
    setResendStatus(null)

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      })

      if (!response.ok) {
        let errorCode = "send_failed"
        try {
          const errorPayload = await response.json()
          errorCode = errorPayload?.code || errorPayload?.error || errorCode
        } catch (parseError) {
          console.warn("Failed to parse resend error response", parseError)
        }
        throw new Error(errorCode)
      }

      clearCooldown()
      toast({
        title: "Correo reenviado",
        description: "Hemos enviado un nuevo correo de verificación. Por favor, revisa tu bandeja de entrada.",
      })
      setResendStatus({
        type: "success",
        message: "Correo reenviado. Revisa tu bandeja de entrada.",
      })
    } catch (error) {
      const errorCode = error instanceof Error ? error.message : "send_failed"
      console.error("Unexpected error resending email:", error)
      startCooldown()

      const message =
        errorCode === "TOO_MANY_ATTEMPTS_TRY_LATER"
          ? "Demasiados intentos. Intenta nuevamente en unos minutos."
          : "Ocurrió un error inesperado. Por favor, intenta nuevamente."

      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
      setResendStatus({ type: "error", message })
    } finally {
      setIsResending(false)
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

        {/* Success Card */}
        <div className="bg-card border border-border rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-accent" />
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-3">¡Cuenta creada exitosamente!</h1>

          <div className="mb-6 p-4 bg-muted/50 border border-border rounded-lg">
            <Mail className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Hemos enviado un correo de verificación a tu email.</p>
          </div>

          <div className="space-y-4 text-left mb-8">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-accent">1</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Revisa tu bandeja de entrada</p>
                <p className="text-xs text-muted-foreground">Busca el correo de Cuanted</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-accent">2</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Haz clic en el enlace de verificación</p>
                <p className="text-xs text-muted-foreground">Confirma tu dirección de email</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-accent">3</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Inicia sesión</p>
                <p className="text-xs text-muted-foreground">Comienza a automatizar tus estrategias</p>
              </div>
            </div>
          </div>

          <Button asChild size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link href="/login">Ir a iniciar sesión</Link>
          </Button>

          <p className="mt-6 text-xs text-muted-foreground">
            ¿No recibiste el correo?{" "}
            <button
              onClick={handleResendEmail}
              disabled={isResending || cooldownRemaining > 0}
              className="text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
            >
              {isResending && <Loader2 className="h-3 w-3 animate-spin" />}
              {cooldownRemaining > 0
                ? `Reenviar en ${formatCooldown(cooldownRemaining)}`
                : "Reenviar correo de verificación"}
            </button>
          </p>
          {resendStatus && (
            <p
              className={`mt-2 text-xs ${
                resendStatus.type === "success" ? "text-green-600" : "text-destructive"
              }`}
            >
              {resendStatus.message}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
