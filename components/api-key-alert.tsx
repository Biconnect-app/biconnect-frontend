"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertCircle, XCircle } from "lucide-react"
import { onAuthStateChanged } from "firebase/auth"
import { firebaseAuth } from "@/lib/firebase/client"
import { authFetch } from "@/lib/api"

export function ApiKeyAlert() {
  const [hasApiKeys, setHasApiKeys] = useState(false)
  const [checking, setChecking] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (!user) {
        setChecking(false)
        return
      }

      try {
        const response = await authFetch("/api/exchanges")
        if (!response.ok) {
          console.error("Error checking API keys")
          setChecking(false)
          return
        }

        const { exchanges } = await response.json()
        const hasValidKeys = exchanges && exchanges.some((ex: { api_key?: string; api_secret?: string }) => ex.api_key && ex.api_secret)
        setHasApiKeys(hasValidKeys)
      } catch (error) {
        console.error("Error checking API keys:", error)
      } finally {
        setChecking(false)
      }
    })

    return () => unsubscribe()
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
