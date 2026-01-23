"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, BookOpen } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export function Hero() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)
      setCheckingAuth(false)
    }
    checkAuth()
  }, [])

  const handleStartFree = () => {
    if (isAuthenticated) {
      // User is logged in, go directly to create strategy
      router.push("/dashboard/estrategias/nueva")
    } else {
      // User is not logged in, show preview
      router.push("/preview/estrategia")
    }
  }

  return (
    <section className="pt-32 pb-20 px-4 bg-gradient-to-b from-primary/5 to-background">
      <div className="container mx-auto">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-medium">
            <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
            Orquestación automática de señales
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight text-balance">
            Biconnect — Orquestación entre TradingView y tus exchanges
          </h1>

          <p className="text-xl text-muted-foreground leading-relaxed text-pretty max-w-3xl mx-auto">
            Automatiza tu trading algorítmico conectando alertas de TradingView directamente a Binance y otros
            exchanges. Ejecución rápida, confiable y con control total de riesgo.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg h-14 px-8"
              onClick={handleStartFree}
              disabled={checkingAuth}
            >
              {checkingAuth ? "Cargando..." : "Comenzar gratis"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Link href="/docs">
              <Button size="lg" variant="outline" className="text-lg h-14 px-8 bg-transparent">
                <BookOpen className="mr-2 h-5 w-5" />
                Ver documentación
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-center gap-8 pt-4 flex-wrap">
            <div>
              <div className="text-3xl font-bold text-foreground">{"<"}1s</div>
              <div className="text-sm text-muted-foreground">Latencia promedio</div>
            </div>
            <div className="w-px h-12 bg-border hidden sm:block" />
            <div>
              <div className="text-3xl font-bold text-foreground">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div className="w-px h-12 bg-border hidden sm:block" />
            <div>
              <div className="text-3xl font-bold text-foreground">24/7</div>
              <div className="text-sm text-muted-foreground">Monitoreo</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
