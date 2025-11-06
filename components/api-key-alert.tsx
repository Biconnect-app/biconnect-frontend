"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertCircle, XCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export function ApiKeyAlert() {
  const [hasApiKeys, setHasApiKeys] = useState(false)
  const [checking, setChecking] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    async function checkApiKeys() {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const { data: exchanges, error } = await supabase
            .from("exchanges")
            .select("id")
            .eq("user_id", user.id)
            .limit(1)

          if (error) {
            console.error("[v0] Error checking API keys:", error)
          }

          setHasApiKeys(exchanges && exchanges.length > 0)
        }
      } catch (error) {
        console.error("[v0] Error checking API keys:", error)
      } finally {
        setChecking(false)
      }
    }

    checkApiKeys()
  }, [])

  if (checking || hasApiKeys || dismissed) {
    return null
  }

  return (
    <div className="bg-destructive/10 border-2 border-destructive rounded-xl p-6 mb-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-destructive mb-2">Completa tu configuración</h3>
          <p className="text-sm text-foreground mb-4">
            Para comenzar a ejecutar órdenes automáticamente, necesitas configurar las API keys de tu exchange. Este es
            el último paso para completar tu registro.
          </p>
          <Link href="/app/configuracion/api-inicial">
            <Button className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Configurar API Keys ahora
            </Button>
          </Link>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Cerrar advertencia"
        >
          <XCircle className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
