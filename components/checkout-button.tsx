"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, ShieldCheck, Sparkles, CreditCard, Clock } from "lucide-react"
import { firebaseAuth } from "@/lib/firebase/client"
import { authFetch } from "@/lib/api"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

interface CheckoutButtonProps {
  priceType?: "monthly" | "yearly"
  className?: string
  children?: React.ReactNode
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
}

export function CheckoutButton({
  priceType = "monthly",
  className,
  children = "Obtener Pro",
  variant = "default",
  size = "lg",
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const [showPayPal, setShowPayPal] = useState(false)
  const [paypalReady, setPaypalReady] = useState(false)
  const paypalButtonRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const planId =
    priceType === "yearly"
      ? process.env.NEXT_PUBLIC_PAYPAL_PLAN_ANNUAL
      : process.env.NEXT_PUBLIC_PAYPAL_PLAN_MONTHLY

  const handleCheckout = async () => {
    try {
      setLoading(true)

      // Check if user is logged in
      const user = firebaseAuth.currentUser

      if (!user) {
        router.push("/login?redirect=/precios&plan=pro")
        return
      }

      setShowPayPal(true)
    } catch (error) {
      console.error("Checkout error:", error)
      alert("Error al procesar el pago. Por favor, intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!showPayPal) return

    // Wait for the dialog to render and the ref to be available
    const timer = setTimeout(() => {
      if (!paypalButtonRef.current) {
        console.error("PayPal button ref is not available")
        return
      }

      // Clear previous buttons
      paypalButtonRef.current.innerHTML = ""

      const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
      
      if (!clientId) {
        console.error("NEXT_PUBLIC_PAYPAL_CLIENT_ID not set")
        alert("Error: PayPal no está configurado correctamente.")
        return
      }

      if (!planId) {
        console.error("Plan ID not set")
        alert("Error: Plan ID no está configurado correctamente.")
        return
      }

      // Load PayPal SDK
      const existingScript = document.getElementById("paypal-sdk")
      if (existingScript) {
        existingScript.remove()
      }

      const script = document.createElement("script")
      script.id = "paypal-sdk"
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&vault=true&intent=subscription`
      script.setAttribute("data-sdk-integration-source", "button-factory")

      script.onload = () => {
        if (
          window.paypal &&
          paypalButtonRef.current
        ) {
          setPaypalReady(true)
          window.paypal
            .Buttons({
              style: {
                shape: "rect",
                color: "gold",
                layout: "vertical",
                label: "subscribe",
              },
              createSubscription: async (
                _data: Record<string, unknown>,
                actions: { subscription: { create: (opts: Record<string, unknown>) => Promise<string> } }
              ) => {
                return actions.subscription.create({
                  plan_id: planId,
                  custom_id: firebaseAuth.currentUser?.uid || "",
                  application_context: {
                    shipping_preference: "NO_SHIPPING",
                  },
                })
              },
              onApprove: async (data: { subscriptionID: string }) => {
                // Activate the subscription on our backend
                try {
                  const response = await authFetch("/api/paypal/activate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      subscriptionId: data.subscriptionID,
                      planType: priceType === "yearly" ? "annual" : "monthly",
                    }),
                  })

                  if (response.ok) {
                    setShowPayPal(false)
                    router.push("/dashboard/suscripcion?success=true")
                  } else {
                    alert("Error al activar la suscripcion. Contacta soporte.")
                  }
                } catch (error) {
                  console.error("Activation error:", error)
                  alert("Error al activar la suscripcion. Contacta soporte.")
                }
              },
              onError: (err: Error) => {
                console.error("PayPal error:", err)
                alert("Error con PayPal. Por favor, intenta de nuevo.")
              },
              onCancel: () => {
                setShowPayPal(false)
              },
            })
            .render(paypalButtonRef.current)
        }
      }

      script.onerror = () => {
        console.error("Failed to load PayPal SDK")
        alert("Error al cargar PayPal. Verifica tu conexión a internet.")
      }

      document.body.appendChild(script)
    }, 100) // Wait 100ms for the dialog to render

    return () => {
      clearTimeout(timer)
      const s = document.getElementById("paypal-sdk")
      if (s) s.remove()
    }
  }, [showPayPal, planId, priceType, router])

  return (
    <>
      <Button
        onClick={handleCheckout}
        disabled={loading}
        className={className}
        variant={variant}
        size={size}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Procesando...
          </>
        ) : (
          children
        )}
      </Button>

      <Dialog open={showPayPal} onOpenChange={setShowPayPal}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-lg border border-amber-500/20 bg-gradient-to-br from-[#0f0f0f] via-[#121212] to-[#18120a]"
        >
          <div className="rounded-lg border border-amber-500/20 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.15),_transparent_55%)] p-6">
            <DialogClose className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-amber-500/30 bg-black/40 text-amber-100 shadow-sm transition hover:bg-amber-500/20 focus:outline-hidden focus:ring-2 focus:ring-amber-400">
              <span className="text-lg leading-none">×</span>
              <span className="sr-only">Cerrar</span>
            </DialogClose>
            <DialogHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
                    <Sparkles className="h-3.5 w-3.5" />
                    Acceso inmediato
                  </div>
                  <DialogTitle className="text-2xl">Suscribirse al Plan Pro</DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    {priceType === "yearly"
                      ? "Plan anual: $250/ano con 30 dias de prueba gratis"
                      : "Plan mensual: $25/mes con 30 dias de prueba gratis"}
                  </DialogDescription>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs uppercase tracking-[0.2em] text-amber-400/70">Pro</span>
                  <span className="text-3xl font-semibold text-amber-300">
                    {priceType === "yearly" ? "$250" : "$25"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {priceType === "yearly" ? "por ano" : "por mes"}
                  </span>
                </div>
              </div>
            </DialogHeader>

            <div className="mt-5 grid gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-300" />
                30 dias de prueba gratis, cancela cuando quieras.
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Cobros seguros con PayPal y tarjeta.
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-400" />
                Acceso inmediato a estrategias y automatizaciones.
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-amber-500/20 bg-gradient-to-b from-white/95 to-white/85 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
              <div className="text-xs uppercase tracking-[0.2em] text-amber-400/70">
                Pagar ahora
              </div>
              <div className="mt-2">
                {!paypalReady && (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                )}
                <div className="rounded-lg bg-white p-2 shadow-inner" ref={paypalButtonRef} />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Type augmentation for PayPal SDK on window
declare global {
  interface Window {
    paypal?: {
      Buttons: (config: Record<string, unknown>) => {
        render: (container: HTMLElement) => void
      }
    }
  }
}
