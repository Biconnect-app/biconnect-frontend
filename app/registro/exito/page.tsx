"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Mail, CheckCircle, Loader2, ArrowRight } from "lucide-react"
import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useSearchParams, useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function SignUpSuccessPage() {
  const [isResending, setIsResending] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const [isAutoLoggedIn, setIsAutoLoggedIn] = useState(false)
  const [redirectCountdown, setRedirectCountdown] = useState(5)
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const emailParam = searchParams.get("email")
    if (emailParam) {
      setEmail(emailParam)
    }

    const checkSession = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session && session.user.email_confirmed_at) {
        console.log("[v0] User is auto-logged in and confirmed, will redirect to estrategias")
        setIsAutoLoggedIn(true)

        // Start countdown for redirect
        const interval = setInterval(() => {
          setRedirectCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(interval)
              router.push("/app/estrategias")
              return 0
            }
            return prev - 1
          })
        }, 1000)

        return () => clearInterval(interval)
      } else {
        console.log("[v0] Email confirmation required, showing verification instructions")
      }
    }

    checkSession()
  }, [searchParams, router])

  const handleResendEmail = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "No se pudo obtener tu dirección de email. Por favor, intenta registrarte nuevamente.",
        variant: "destructive",
      })
      return
    }

    setIsResending(true)

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
        },
      })

      if (error) {
        console.error("[v0] Error resending verification email:", error)
        toast({
          title: "Error al reenviar",
          description: error.message || "No se pudo reenviar el correo. Por favor, intenta nuevamente.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Correo reenviado",
          description: "Hemos enviado un nuevo correo de verificación. Por favor, revisa tu bandeja de entrada.",
        })
      }
    } catch (error) {
      console.error("[v0] Unexpected error resending email:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado. Por favor, intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsResending(false)
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

        {/* Success Card */}
        <div className="bg-card border border-border rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-accent" />
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-3">¡Cuenta creada exitosamente!</h1>

          {isAutoLoggedIn ? (
            <>
              <div className="mb-6 p-4 bg-accent/10 border border-accent/20 rounded-lg">
                <Loader2 className="h-6 w-6 text-accent mx-auto mb-2 animate-spin" />
                <p className="text-sm text-foreground font-medium">Tu cuenta está lista</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Redirigiendo a tu panel en {redirectCountdown} segundo{redirectCountdown !== 1 ? "s" : ""}...
                </p>
              </div>

              <Button
                onClick={() => router.push("/app/estrategias")}
                size="lg"
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                Ir al panel ahora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
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
                    <p className="text-xs text-muted-foreground">Busca el correo de Biconnect</p>
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
                  disabled={isResending || !email}
                  className="text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
                >
                  {isResending && <Loader2 className="h-3 w-3 animate-spin" />}
                  Reenviar correo de verificación
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
