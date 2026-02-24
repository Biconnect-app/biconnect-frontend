"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { firebaseAuth } from "@/lib/firebase/client"
import { useRouter } from "next/navigation"
import {
  Dialog,
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
                  const response = await fetch("/api/paypal/activate", {
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Suscribirse al Plan Pro</DialogTitle>
            <DialogDescription>
              {priceType === "yearly"
                ? "Plan anual: $250/ano con 30 dias de prueba gratis"
                : "Plan mensual: $25/mes con 30 dias de prueba gratis"}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {!paypalReady && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            <div ref={paypalButtonRef} />
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
