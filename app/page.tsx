"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { firebaseAuth } from "@/lib/firebase/client"
import { authFetch } from "@/lib/api"

export default function Home() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (!user) {
        try {
          const sessionResponse = await fetch("/api/auth/session-status")
          const sessionData = await sessionResponse.json()
          if (sessionData.authenticated) {
            router.replace("/dashboard/estrategias")
            return
          }
        } catch (error) {
          console.error("Error checking session status:", error)
        }

        router.replace("/preview/estrategia")
        return
      }

      const response = await authFetch("/api/profile/strategies")
      if (!response.ok) {
        router.replace("/dashboard/estrategias/nueva")
        return
      }

      const data = await response.json()
      if (data.hasStrategies) {
        router.replace("/dashboard/estrategias")
      } else {
        router.replace("/dashboard/estrategias/nueva")
      }
    })

    return () => unsubscribe()
  }, [router])

  // Mostrar loading mientras se verifica
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    </div>
  )
}
