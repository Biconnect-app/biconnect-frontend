"use client"

import { useEffect } from "react"
import { useRouter } from 'next/navigation'
import { createClient } from "@/lib/supabase/client"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    async function checkAuthAndRedirect() {
      const supabase = createClient()
      
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const { data: { user }, error } = await supabase.auth.getUser()

      // Si hay un error de JWT corrupto, limpiar sesión
      if (error && error.message?.includes('does not exist')) {
        console.log("[v0] Corrupted session detected, signing out...")
        await supabase.auth.signOut()
        router.replace("/preview/estrategia")
        return
      }

      console.log("[v0] Home page - User check:", user?.email || "No user")

      if (!user) {
        // No autenticado -> preview
        console.log("[v0] Not authenticated, redirecting to preview")
        router.replace("/preview/estrategia")
        return
      }

      // Autenticado -> siempre ir a estrategias
      // La página de estrategias se encargará del resto
      console.log("[v0] Authenticated, redirecting to strategies")
      router.replace("/app/estrategias")
    }

    checkAuthAndRedirect()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )
}
