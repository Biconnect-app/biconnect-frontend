"use client"

import { useState, useEffect } from "react"
import { CreditCard, Sparkles, Calendar, AlertTriangle, Shield } from "lucide-react"
import { ApiKeyAlert } from "@/components/api-key-alert"
import { createClient } from "@/lib/supabase/client"
import { CheckoutButton } from "@/components/checkout-button"
import { ManageSubscriptionButton } from "@/components/manage-subscription-button"

interface ProfileData {
  plan: string | null
  stripe_subscription_status: string | null
  stripe_current_period_end: string | null
  trial_ends_at: string | null
  is_admin: boolean | null
}

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("plan, stripe_subscription_status, stripe_current_period_end, trial_ends_at, is_admin")
          .eq("id", user.id)
          .single()

        setProfileData(profile)
      }
    } catch (error) {
      console.error("Error loading user data:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const isOnTrial = () => {
    return profileData?.stripe_subscription_status === "trialing"
  }

  const isPro = () => {
    return profileData?.stripe_subscription_status === "active"
  }

  const isAdmin = () => {
    return profileData?.is_admin === true
  }

  const hasNoSubscription = () => {
    const status = profileData?.stripe_subscription_status
    return !status || status === "canceled" || status === "unpaid" || status === "incomplete_expired"
  }

  const hasUsedTrial = () => {
    // User has used trial if they have a trial_ends_at date or had a subscription before
    const status = profileData?.stripe_subscription_status
    return !!(
      profileData?.trial_ends_at || 
      status === "canceled" || 
      status === "past_due" ||
      status === "unpaid"
    )
  }

  const getSubscriptionStatusText = () => {
    if (!profileData?.stripe_subscription_status) return null
    
    const statusMap: Record<string, string> = {
      active: "Activa",
      trialing: "En período de prueba",
      past_due: "Pago pendiente",
      canceled: "Cancelada",
      unpaid: "Sin pagar",
      incomplete: "Incompleta",
      incomplete_expired: "Expirada",
    }
    
    return statusMap[profileData.stripe_subscription_status] || profileData.stripe_subscription_status
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="space-y-6 max-w-3xl">
        <ApiKeyAlert />

        <div>
          <h1 className="text-3xl font-bold text-foreground">Suscripción</h1>
          <p className="text-muted-foreground mt-1">Gestiona tu plan y facturación</p>
        </div>

        {/* Current Plan */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-accent" />
            <h2 className="text-xl font-semibold text-foreground">Tu plan actual</h2>
          </div>

          {loading ? (
            <div className="text-muted-foreground">Cargando...</div>
          ) : isAdmin() ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-purple-500">
                <Shield className="h-5 w-5" />
                <span className="font-semibold">Cuenta de Administrador</span>
              </div>
              
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                <p className="text-sm text-purple-600 dark:text-purple-400">
                  Tienes acceso completo a todas las funciones sin necesidad de suscripción.
                </p>
              </div>

              <p className="text-muted-foreground">
                Como administrador, puedes usar todas las funciones de la plataforma sin restricciones.
              </p>
            </div>
          ) : isPro() ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-accent">
                <Sparkles className="h-5 w-5" />
                <span className="font-semibold">Plan Pro activo</span>
              </div>
              
              {profileData?.stripe_subscription_status && (
                <div className="text-sm text-muted-foreground">
                  Estado: <span className="font-medium text-foreground">{getSubscriptionStatusText()}</span>
                </div>
              )}

              {profileData?.stripe_current_period_end && (
                <div className="text-sm text-muted-foreground">
                  Próxima facturación: {formatDate(profileData.stripe_current_period_end)}
                </div>
              )}

              <ManageSubscriptionButton>
                Gestionar suscripción
              </ManageSubscriptionButton>
            </div>
          ) : isOnTrial() ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-amber-500">
                <Calendar className="h-5 w-5" />
                <span className="font-semibold">Período de Prueba</span>
              </div>
              
              {profileData?.trial_ends_at && (
                <div className="flex items-center gap-2 bg-amber-500/10 text-amber-500 px-3 py-2 rounded-lg text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>Tu prueba termina el {formatDate(profileData.trial_ends_at)}</span>
                </div>
              )}

              <p className="text-muted-foreground">
                Estás en el período de prueba. Tus estrategias están activas. Al finalizar el período, se te cobrará automáticamente.
              </p>

              <ManageSubscriptionButton>
                Gestionar suscripción
              </ManageSubscriptionButton>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-semibold">Sin suscripción activa</span>
              </div>
              
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <p className="text-sm text-destructive">
                  {hasUsedTrial()
                    ? "Tu suscripción ha expirado. Tus estrategias están inactivas y no se ejecutarán hasta que pases al Plan Pro."
                    : "No tienes una suscripción activa. Tus estrategias están inactivas y no se ejecutarán hasta que inicies tu período de prueba."
                  }
                </p>
              </div>

              <p className="text-muted-foreground">
                {hasUsedTrial()
                  ? "Suscríbete al Plan Pro para reactivar tus estrategias y continuar operando automáticamente."
                  : "Inicia tu período de prueba de 30 días para activar tus estrategias. No se te cobrará hasta que termine el período de prueba."
                }
              </p>

              <CheckoutButton priceType="monthly" size="default">
                {hasUsedTrial() ? "Pasar a Plan Pro" : "Iniciar período de prueba"}
              </CheckoutButton>
            </div>
          )}
        </div>

        {/* Plan Benefits */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Beneficios del Plan Pro</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              Ejecuciones ilimitadas
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              Estrategias ilimitadas
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              Soporte prioritario
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              Funciones avanzadas
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
