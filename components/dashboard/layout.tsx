"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Layers, FileText, Plug, Settings, LogOut, Menu, X, Moon, Sun, Lock, CreditCard } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useTheme } from "next-themes"
import { useUserPlan } from "@/hooks/use-user-plan"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { needsSubscription, loading: planLoading } = useUserPlan()
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch by only rendering theme-dependent content after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const checkSessionExpiration = async () => {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        // Store login timestamp in localStorage when session is first detected
        const loginTimestamp = localStorage.getItem("login_timestamp")

        if (!loginTimestamp) {
          // First time detecting this session, store the current time
          localStorage.setItem("login_timestamp", Date.now().toString())
        } else {
          // Check if session is older than 24 hours
          const twentyFourHours = 24 * 60 * 60 * 1000
          const sessionAge = Date.now() - Number.parseInt(loginTimestamp)

          if (sessionAge > twentyFourHours) {
            // Session expired, sign out
            localStorage.removeItem("login_timestamp")
            await supabase.auth.signOut()
            router.push("/login?expired=true")
          }
        }
      }
    }

    checkSessionExpiration()

    // Check every 5 minutes
    const interval = setInterval(checkSessionExpiration, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [router, pathname, sidebarOpen])

  const handleLogout = async () => {
    try {
      const supabase = createClient()

      // Remove login timestamp
      localStorage.removeItem("login_timestamp")

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error("Error al cerrar sesión:", error)
        throw error
      }

      // Redirect to login
      router.push("/login")
      router.refresh()
    } catch (error) {
      console.error("Error en handleLogout:", error)
      // Even if there's an error, try to redirect to login
      router.push("/login")
      router.refresh()
    }
  }

  const menuItems = [
    { icon: Layers, label: "Estrategias", href: "/dashboard/estrategias", locked: false },
    { icon: FileText, label: "Órdenes", href: "/dashboard/ordenes", locked: false },
    { icon: Plug, label: "Integraciones", href: "/dashboard/integraciones", locked: false },
    { icon: CreditCard, label: "Suscripción", href: "/dashboard/suscripcion", locked: false },
    { icon: Settings, label: "Configuración", href: "/dashboard/configuracion", locked: false },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold">B</span>
          </div>
          <span className="text-xl font-bold text-foreground">Biconnect</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-64 bg-card border-r border-border z-40 transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center gap-2 px-6 border-b border-border">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold">B</span>
            </div>
            <span className="text-xl font-bold text-foreground">Biconnect</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const isLocked = item.locked && needsSubscription && !planLoading
              const isActive = pathname === item.href

              if (isLocked) {
                return (
                  <div key={item.href} className="relative" title="Disponible solo en Plan Pro">
                    <Button
                      variant="ghost"
                      className="w-full justify-start opacity-50 cursor-not-allowed"
                      size="lg"
                      disabled
                    >
                      <item.icon className="h-5 w-5 mr-3" />
                      {item.label}
                      <Lock className="h-4 w-4 ml-auto text-muted-foreground" />
                    </Button>
                  </div>
                )
              }

              return (
                <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start hover:bg-accent/10 hover:text-accent ${
                      isActive ? "bg-accent/10 text-accent" : ""
                    }`}
                    size="lg"
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </nav>

          {/* Footer Actions */}
          <div className="p-4 border-t border-border space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start"
              size="lg"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {mounted && theme === "dark" ? <Sun className="h-5 w-5 mr-3" /> : <Moon className="h-5 w-5 mr-3" />}
              {mounted && theme === "dark" ? "Modo claro" : "Modo oscuro"}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              size="lg"
              onClick={() => {
                setShowLogoutDialog(true)
              }}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Salir
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0">
        <div className="container mx-auto px-4 py-8">{children}</div>
      </main>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro que quieres cerrar sesión? Tendrás que volver a iniciar sesión para acceder a tu cuenta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowLogoutDialog(false)
                handleLogout()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cerrar sesión
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
