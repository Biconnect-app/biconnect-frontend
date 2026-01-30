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
            .select("plan, stripe_subscription_status, trial_ends_at, is_admin")
            .eq("id", user.id)
            .single()

          if (error) {
            console.error("Error fetching user plan:", error)
            setPlan(null) // No plan on error
          } else {
            console.log("Profile data:", profile) // DEBUG
            
            // Check if user is admin - admins bypass all subscription requirements
            if (profile?.is_admin) {
              console.log("User is admin!") // DEBUG
              setIsAdmin(true)
              setPlan("admin")
              setLoading(false)
              return
            }
            
            // Check stripe_subscription_status to determine actual plan
            const status = profile?.stripe_subscription_status
            
            // Check if user has already used trial
            // Trial was used if: trial_ends_at exists OR status was ever trialing/active/canceled
            const trialWasUsed = !!(
              profile?.trial_ends_at || 
              status === "canceled" || 
              status === "past_due" ||
              status === "unpaid"
            )
            setHasUsedTrial(trialWasUsed)
            
            if (status === "trialing") {
              setPlan("trial")
              setHasUsedTrial(true) // Currently in trial means trial was used
            } else if (status === "active") {
              setPlan("pro")
              setHasUsedTrial(true) // Was pro means trial was used
            } else {
              setPlan(null) // No active subscription
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
