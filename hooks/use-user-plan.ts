"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export function useUserPlan() {
  const [plan, setPlan] = useState<"trial" | "pro" | "admin" | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasUsedTrial, setHasUsedTrial] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function fetchUserPlan() {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          // Query profiles table to check admin status and subscription
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("plan, paypal_status, trial_ends_at, is_admin")
            .eq("id", user.id)
            .single()

          if (error) {
            console.error("Error fetching user plan:", error)
            setPlan(null)
          } else {
            // Check if user is admin - admins bypass all subscription requirements
            if (profile?.is_admin) {
              setIsAdmin(true)
              setPlan("admin")
              setLoading(false)
              return
            }
            
            // Check paypal_status to determine actual plan
            const status = profile?.paypal_status
            
            // Check if user has already used trial
            const trialWasUsed = !!(
              profile?.trial_ends_at || 
              status === "canceled" || 
              status === "inactive"
            )
            setHasUsedTrial(trialWasUsed)
            
            if (status === "trialing") {
              setPlan("trial")
              setHasUsedTrial(true)
            } else if (status === "active") {
              setPlan("pro")
              setHasUsedTrial(true)
            } else {
              setPlan(null)
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user plan:", error)
        setPlan(null) // No plan on error
      } finally {
        setLoading(false)
      }
    }

    fetchUserPlan()
  }, [])

  const hasActiveSubscription = plan === "pro" || plan === "trial" || plan === "admin"
  
  return { 
    plan, 
    loading, 
    isPro: plan === "pro", 
    isTrial: plan === "trial",
    isAdmin,
    hasActiveSubscription,
    needsSubscription: !hasActiveSubscription && !loading,
    hasUsedTrial
  }
}
