"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle, LogIn, Moon, Sun } from "lucide-react"
import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"

export default function RegistroConfirmadoPage() {
  const router = useRouter()
  const { theme, setTheme, resolvedTheme } = useTheme()

  useEffect(() => {
    // Sign out the user so they have to login manually
    // This prevents auto-login after email confirmation
    async function signOut() {
      const supabase = createClient()
      await supabase.auth.signOut()
    }
    signOut()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Theme Toggle */}
      <button
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        className="fixed top-4 right-4 p-2 rounded-lg bg-card border border-border hover:bg-accent/10 transition-colors"
        aria-label="Toggle theme"
      >
        {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>
      
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">C</span>
          </div>
          <span className="text-2xl font-bold text-foreground">Cuanted</span>
        </Link>

        {/* Confirmation Card */}
        <div className="bg-card border border-border rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-3">
            Email verificado correctamente
          </h1>

          <p className="text-muted-foreground mb-8">
            Tu cuenta ha sido confirmada exitosamente. Ya podes iniciar sesion y comenzar a automatizar tus estrategias de trading.
          </p>

          <Button
            asChild
            size="lg"
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            <Link href="/login" className="flex items-center justify-center gap-2">
              <LogIn className="h-5 w-5" />
              Iniciar sesion
            </Link>
          </Button>

          <p className="mt-6 text-xs text-muted-foreground">
            Si tenes algún problema,{" "}
            <a
              href="mailto:soporte@cuanted.com"
              className="text-primary hover:underline"
            >
              contacta a soporte
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
