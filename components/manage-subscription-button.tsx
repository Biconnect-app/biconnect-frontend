"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useRouter } from "next/navigation"

interface ManageSubscriptionButtonProps {
  className?: string
  children?: React.ReactNode
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
}

export function ManageSubscriptionButton({
  className,
  children = "Cancelar suscripcion",
  variant = "outline",
  size = "default",
}: ManageSubscriptionButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleCancelSubscription = async () => {
    try {
      setLoading(true)

      const response = await fetch("/api/paypal/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al cancelar la suscripcion")
      }

      router.refresh()
      window.location.reload()
    } catch (error) {
      console.error("Cancel error:", error)
      alert("Error al cancelar la suscripcion. Por favor, intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
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
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancelar suscripcion</AlertDialogTitle>
          <AlertDialogDescription>
            Al cancelar tu suscripcion, perderas acceso a las funciones Pro al final del periodo actual. Tus estrategias dejaran de ejecutarse. Esta accion no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Mantener suscripcion</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancelSubscription}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Confirmar cancelacion
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
