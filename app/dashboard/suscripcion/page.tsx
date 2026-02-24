"use client"

import { useState, useEffect } from "react"
import { CreditCard, Sparkles, Calendar, AlertTriangle, Shield } from "lucide-react"
import { ApiKeyAlert } from "@/components/api-key-alert"
import { authFetch } from "@/lib/api"
import { CheckoutButton } from "@/components/checkout-button"
import { ManageSubscriptionButton } from "@/components/manage-subscription-button"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

interface ProfileData {
  plan: string | null
  paypal_status: string | null
  paypal_plan_type: string | null
  trial_ends_at: string | null
  paypal_next_billing_time: string | null
  paypal_cancel_at_period_end: boolean | null
  is_admin: boolean | null
}

function SuccessMessage() {
  const searchParams = useSearchParams()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setShow(true)
      window.history.replaceState({}, "", "/dashboard/suscripcion")
    }
  }, [searchParams])

  if (!show) return null

  return (
    <div className="bg-accent/10 border border-accent/30 text-accent-foreground px-4 py-3 rounded-lg">
      Tu suscripcion se ha activado correctamente. Bienvenido al Plan Pro.
      <button
        onClick={() => setShow(false)}
        className="ml-4 text-sm underline hover:no-underline"
      >
        Cerrar
      </button>
    </div>
  )
}

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      setLoading(true)
      const response = await authFetch("/api/profile")
      if (!response.ok) {
        setLoading(false)
        return
      }

      const { profile } = await response.json()
      setProfileData(profile)
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
    return profileData?.paypal_status === "trialing"
  }

  const isPro = () => {
    return profileData?.paypal_status === "active"
  }

  const isAdmin = () => {
    return profileData?.is_admin === true
  }

  const hasNoSubscription = () => {
    const status = profileData?.paypal_status
    return !status || status === "canceled" || status === "inactive"
  }

  const hasUsedTrial = () => {
    const status = profileData?.paypal_status
    return !!(
      profileData?.trial_ends_at || 
      status === "canceled" || 
      status === "inactive"
    )
  }

  const getSubscriptionStatusText = () => {
    if (!profileData?.paypal_status) return null
    
    const statusMap: Record<string, string> = {
      active: "Activa",
      trialing: "En periodo de prueba",
      canceled: "Cancelada",
      inactive: "Inactiva",
    }
    
    return statusMap[profileData.paypal_status] || profileData.paypal_status
  }

  const getPlanTypeText = () => {
    if (!profileData?.paypal_plan_type) return null
    return profileData.paypal_plan_type === "annual" ? "Anual" : "Mensual"
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="space-y-6 max-w-3xl">
        <ApiKeyAlert />

        <Suspense fallback={null}>
          <SuccessMessage />
        </Suspense>

        <div>
          <h1 className="text-3xl font-bold text-foreground">Suscripcion</h1>
          <p className="text-gray-400 mt-1">Gestiona tu plan y facturacion</p>
        </div>

        {/* Current Plan */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-400" />
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
                  Tienes acceso completo a todas las funciones sin necesidad de suscripcion.
                </p>
              </div>

              <p className="text-muted-foreground">
                Como administrador, puedes usar todas las funciones de la plataforma sin restricciones.
              </p>
            </div>
          ) : isPro() ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-500">
                <Sparkles className="h-5 w-5" />
                <span className="font-semibold">Plan Pro activo</span>
              </div>
              
              {profileData?.paypal_cancel_at_period_end && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                    Tu suscripción ha sido cancelada y no se renovará.
                  </p>
                  {profileData?.paypal_next_billing_time && (
                    <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                      Tendrás acceso hasta el {formatDate(profileData.paypal_next_billing_time)}
                    </p>
                  )}
                </div>
              )}
              
              {profileData?.paypal_status && (
                <div className="text-sm text-muted-foreground">
                  Estado: <span className="font-medium text-foreground">{getSubscriptionStatusText()}</span>
                </div>
              )}

              {profileData?.paypal_plan_type && (
                <div className="text-sm text-muted-foreground">
                  Tipo de plan: <span className="font-medium text-foreground">{getPlanTypeText()}</span>
                </div>
              )}

              {profileData?.paypal_next_billing_time && !profileData?.paypal_cancel_at_period_end && (
                <div className="flex items-center gap-2 bg-blue-500/10 text-blue-300 px-3 py-2 rounded-lg text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>Próximo cobro: {formatDate(profileData.paypal_next_billing_time)}</span>
                </div>
              )}

              {!profileData?.paypal_cancel_at_period_end && (
                <ManageSubscriptionButton>
                  Cancelar suscripcion
                </ManageSubscriptionButton>
              )}
            </div>
          ) : isOnTrial() ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-amber-500">
                <Calendar className="h-5 w-5" />
                <span className="font-semibold">Periodo de Prueba</span>
              </div>
              
              {profileData?.paypal_cancel_at_period_end && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                    Tu periodo de prueba ha sido cancelado y no continuará.
                  </p>
                  {profileData?.trial_ends_at && (
                    <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                      Tendrás acceso hasta el {formatDate(profileData.trial_ends_at)}
                    </p>
                  )}
                </div>
              )}
              
              {profileData?.trial_ends_at && (
                <div className="flex items-center gap-2 bg-amber-500/10 text-amber-500 px-3 py-2 rounded-lg text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>Tu prueba termina el {formatDate(profileData.trial_ends_at)}</span>
                </div>
              )}

              {profileData?.paypal_next_billing_time && !profileData?.paypal_cancel_at_period_end && (
                <div className="flex items-center gap-2 bg-blue-500/10 text-blue-300 px-3 py-2 rounded-lg text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>Primer cobro será el {formatDate(profileData.paypal_next_billing_time)}</span>
                </div>
              )}

              <p className="text-muted-foreground">
                Estas en el periodo de prueba. Tus estrategias estan activas. {profileData?.paypal_cancel_at_period_end ? "Al finalizar, tus estrategias se desactivarán." : "Al finalizar el periodo, se te cobrara automaticamente."}
              </p>

              {!profileData?.paypal_cancel_at_period_end && (
                <ManageSubscriptionButton>
                  Cancelar suscripcion
                </ManageSubscriptionButton>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-semibold">Sin suscripcion activa</span>
              </div>
              
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <p className="text-sm text-destructive">
                  {hasUsedTrial()
                    ? "Tu suscripcion ha expirado. Tus estrategias estan inactivas y no se ejecutaran hasta que pases al Plan Pro."
                    : "No tienes una suscripcion activa. Tus estrategias estan inactivas y no se ejecutaran hasta que inicies tu periodo de prueba."
                  }
                </p>
              </div>

              <p className="text-muted-foreground">
                {hasUsedTrial()
                  ? "Suscribite al Plan Pro para reactivar tus estrategias y continuar operando automaticamente."
                  : "Inicia tu periodo de prueba de 30 dias para activar tus estrategias. No se te cobrara hasta que termine el periodo de prueba."
                }
              </p>

              <CheckoutButton priceType="monthly" size="default">
                {hasUsedTrial() ? "Pasar a Plan Pro" : "Iniciar periodo de prueba"}
              </CheckoutButton>
            </div>
          )}
        </div>

        {/* Plan Benefits */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Beneficios del Plan Pro</h2>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-green-500" />
              Ejecuciones ilimitadas
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-green-500" />
              Estrategias ilimitadas
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-green-500" />
              Soporte prioritario
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-green-500" />
              Funciones avanzadas
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
