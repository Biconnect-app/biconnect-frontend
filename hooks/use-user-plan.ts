"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export function useUserPlan() {
  const [plan, setPlan] = useState<"free" | "pro" | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUserPlan() {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          // First try to get from user metadata
          const metadataPlan = user.user_metadata?.plan
          if (metadataPlan) {
            setPlan(metadataPlan)
            setLoading(false)
            return
          }

          // If not in metadata, query profiles table
          const { data: profile, error } = await supabase.from("profiles").select("plan").eq("id", user.id).single()

          if (error) {
            console.error("Error fetching user plan:", error)
            setPlan("free") // Default to free on error
          } else {
            setPlan(profile?.plan || "free")
          }
        }
      } catch (error) {
        console.error("Error fetching user plan:", error)
        setPlan("free") // Default to free on error
      } finally {
        setLoading(false)
      }
    }

    fetchUserPlan()
  }, [])

  return { plan, loading, isPro: plan === "pro", isFree: plan === "free" }
}
