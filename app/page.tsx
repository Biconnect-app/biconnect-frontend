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
      
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Usuario no logueado → redirigir a preview/estrategia
        router.replace("/preview/estrategia")
        return
      }

      // Usuario logueado → verificar si tiene estrategias
      const { data: strategies, error } = await supabase
        .from("strategies")
        .select("id")
        .eq("user_id", user.id)

      if (error) {
        console.error("Error fetching strategies:", error)
        router.replace("/app/estrategias/nueva")
        return
      }

      if (!strategies || strategies.length === 0) {
        // Usuario logueado pero sin estrategias → crear estrategia
        router.replace("/app/estrategias/nueva")
      } else {
        // Usuario logueado con estrategias → mostrar lista
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
