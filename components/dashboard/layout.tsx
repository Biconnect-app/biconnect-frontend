"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Layers,
  Activity,
  FileText,
  ScrollText,
  Shield,
  Plug,
  Settings,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  Lock,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useTheme } from "next-themes"
import { useUserPlan } from "@/hooks/use-user-plan"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isFree, loading: planLoading } = useUserPlan()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  const menuItems = [
    { icon: Layers, label: "Estrategias", href: "/app/estrategias", locked: false },
    { icon: Plug, label: "Integraciones", href: "/app/integraciones", locked: false },
    { icon: LayoutDashboard, label: "Dashboard", href: "/app", locked: true },
    { icon: Activity, label: "Ejecución", href: "/app/ejecucion", locked: true },
    { icon: FileText, label: "Órdenes", href: "/app/ordenes", locked: true },
    { icon: ScrollText, label: "Logs", href: "/app/logs", locked: true },
    { icon: Shield, label: "Riesgo", href: "/app/riesgo", locked: true },
    { icon: Settings, label: "Configuración", href: "/app/configuracion", locked: false },
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
              const isLocked = item.locked && isFree && !planLoading
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
              {theme === "dark" ? <Sun className="h-5 w-5 mr-3" /> : <Moon className="h-5 w-5 mr-3" />}
              {theme === "dark" ? "Modo claro" : "Modo oscuro"}
            </Button>
            <Button variant="ghost" className="w-full justify-start text-destructive" size="lg" onClick={handleLogout}>
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
    </div>
  )
}
