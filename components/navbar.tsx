"use client"

import type React from "react"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Menu, X } from "lucide-react"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"

export function Navbar() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault()
    setMobileMenuOpen(false)

    // Handle home page navigation
    if (path === "/") {
      if (pathname === "/") {
        window.scrollTo({ top: 0, behavior: "smooth" })
      } else {
        router.push("/")
      }
      return
    }

    // Handle section links (with #)
    if (path.startsWith("/#")) {
      const sectionId = path.substring(2) // Remove "/#"
      if (pathname === "/") {
        const element = document.getElementById(sectionId)
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      } else {
        sessionStorage.setItem("scrollToSection", sectionId)
        router.push("/")
      }
      return
    }

    // Handle regular page navigation
    router.push(path)
  }

  useEffect(() => {
    if (pathname === "/") {
      const scrollTarget = sessionStorage.getItem("scrollToSection")
      if (scrollTarget) {
        sessionStorage.removeItem("scrollToSection")
        setTimeout(() => {
          const element = document.getElementById(scrollTarget)
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" })
          }
        }, 100)
      }
    }
  }, [pathname])

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">C</span>
            </div>
            <span className="text-xl font-bold text-foreground">Cuanted</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="/"
              onClick={(e) => handleNavClick(e, "/")}
              className="text-sm font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
            >
              Inicio
            </a>
            <a
              href="/#como-funciona"
              onClick={(e) => handleNavClick(e, "/#como-funciona")}
              className="text-sm font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
            >
              Cómo funciona
            </a>
            <a
              href="/#integraciones"
              onClick={(e) => handleNavClick(e, "/#integraciones")}
              className="text-sm font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
            >
              Integraciones
            </a>
            <a
              href="/#precios"
              onClick={(e) => handleNavClick(e, "/#precios")}
              className="text-sm font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
            >
              Precios
            </a>
            <a
              href="/docs"
              onClick={(e) => handleNavClick(e, "/docs")}
              className="text-sm font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
            >
              Documentación
            </a>
            <a
              href="/#faq"
              onClick={(e) => handleNavClick(e, "/#faq")}
              className="text-sm font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
            >
              Soporte
            </a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="Cambiar tema"
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            )}
            <Link href="/login">
              <Button variant="outline" size="default" className="font-semibold bg-transparent">
                Iniciar sesión
              </Button>
            </Link>
            <Link href="/registro">
              <Button
                size="default"
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold shadow-md"
              >
                Registrarse
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="Cambiar tema"
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menú">
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              <a
                href="/"
                onClick={(e) => handleNavClick(e, "/")}
                className="text-sm font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
              >
                Inicio
              </a>
              <a
                href="/#como-funciona"
                onClick={(e) => handleNavClick(e, "/#como-funciona")}
                className="text-sm font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
              >
                Cómo funciona
              </a>
              <a
                href="/#integraciones"
                onClick={(e) => handleNavClick(e, "/#integraciones")}
                className="text-sm font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
              >
                Integraciones
              </a>
              <a
                href="/#precios"
                onClick={(e) => handleNavClick(e, "/#precios")}
                className="text-sm font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
              >
                Precios
              </a>
              <a
                href="/docs"
                onClick={(e) => handleNavClick(e, "/docs")}
                className="text-sm font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
              >
                Documentación
              </a>
              <a
                href="/#faq"
                onClick={(e) => handleNavClick(e, "/#faq")}
                className="text-sm font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
              >
                Soporte
              </a>
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full font-semibold bg-transparent">
                    Iniciar sesión
                  </Button>
                </Link>
                <Link href="/registro" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold shadow-md">
                    Registrarse
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
