"use client"

import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'
import { createClient } from "@/lib/supabase/client"

export default function Home() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function checkAuthAndStrategies() {
      const supabase = createClient()
      
      console.log("[v0] ========== CHECKING AUTH AND STRATEGIES ==========")
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        console.log("[v0] No user found, redirecting to preview/estrategia")
        router.replace("/preview/estrategia")
        return
      }

      console.log("[v0] User found:", { id: user.id, email: user.email })

      const { data: strategies, error } = await supabase
        .from("strategies")
        .select("id")
        .eq("user_id", user.id)

      if (error) {
        console.error("[v0] Error fetching strategies:", error)
        router.replace("/app/estrategias/nueva")
        return
      }

      console.log("[v0] Strategies found:", strategies?.length || 0)

      const { data: pendingStrategies, error: pendingError } = await supabase
        .from("pending_strategies")
        .select("id")
        .eq("email", user.email)

      if (pendingError) {
        console.error("[v0] Error fetching pending strategies:", pendingError)
      }

      console.log("[v0] Pending strategies found:", pendingStrategies?.length || 0)

      const hasAnyStrategy = (strategies && strategies.length > 0) || (pendingStrategies && pendingStrategies.length > 0)

      if (!hasAnyStrategy) {
        console.log("[v0] No strategies or pending strategies found, redirecting to nueva")
        router.replace("/app/estrategias/nueva")
      } else {
        console.log("[v0] Strategies or pending strategies found, redirecting to estrategias")
        router.replace("/app/estrategias")
      }
    }

    checkAuthAndStrategies()
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
