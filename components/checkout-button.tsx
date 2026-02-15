"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { STRIPE_PRICES } from "@/lib/stripe/config"
import { Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

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
  const router = useRouter()

  const handleCheckout = async () => {
    try {
      setLoading(true)

      // Check if user is logged in
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        // Redirect to login with return URL
        router.push("/login?redirect=/precios&plan=pro")
        return
      }

      // Get the appropriate price ID
      // Create checkout session
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceType,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al crear la sesión de pago")
      }

      // Redirect to Stripe Checkout (URL is always returned by the API)
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error("No se recibió URL de checkout")
      }
    } catch (error) {
      console.error("Checkout error:", error)
      alert("Error al procesar el pago. Por favor, intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
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
  )
}
