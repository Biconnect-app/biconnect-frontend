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
            .select("id, api_key, api_secret")
            .eq("user_id", user.id)

          if (error) {
            console.error("Error checking API keys:", error)
          }

          // Check if at least one exchange has both api_key and api_secret
          const hasValidKeys = exchanges && exchanges.some((ex) => ex.api_key && ex.api_secret)
          setHasApiKeys(hasValidKeys)
        }
      } catch (error) {
        console.error("Error checking API keys:", error)
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
    <div className="bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-500 dark:border-amber-600 rounded-xl p-6 mb-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-400 mb-2">Completa tu configuración</h3>
          <p className="text-sm text-amber-800 dark:text-amber-300 mb-4">
            Para comenzar a ejecutar órdenes automáticamente, necesitas configurar las API keys de tu exchange. Este es
            el último paso para completar tu registro.
          </p>
          <Link href="/dashboard/integraciones">
            <Button className="bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white">
              Configurar API Keys ahora
            </Button>
          </Link>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
          aria-label="Cerrar advertencia"
        >
          <XCircle className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
