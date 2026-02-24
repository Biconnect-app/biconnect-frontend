"use client"

import { useState, useEffect } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { firebaseAuth } from "@/lib/firebase/client"
import { authFetch } from "@/lib/api"

export function useUserPlan() {
  const [plan, setPlan] = useState<"trial" | "pro" | "admin" | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasUsedTrial, setHasUsedTrial] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (!user) {
        setPlan(null)
        setIsAdmin(false)
        setHasUsedTrial(false)
        setLoading(false)
        return
      }

      try {
        const response = await authFetch("/api/profile")
        if (!response.ok) {
          setPlan(null)
          setLoading(false)
          return
        }

        const { profile } = await response.json()
        if (!profile) {
          setPlan(null)
          setLoading(false)
          return
        }

        if (profile.is_admin) {
          setIsAdmin(true)
          setPlan("admin")
          setLoading(false)
          return
        }

        const status = profile.paypal_status
        const trialWasUsed = !!(
          profile.trial_ends_at || status === "canceled" || status === "inactive"
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
      } catch (error) {
        console.error("Error fetching user plan:", error)
        setPlan(null)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
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
