import Link from "next/link"
import { Twitter, Linkedin, Github, Mail } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                <span className="text-accent-foreground font-bold text-lg">C</span>
              </div>
              <span className="text-xl font-bold">Cuanted</span>
            </div>
            <p className="text-sm text-primary-foreground/80">
              Plataforma segura y profesional para comprar y vender criptomonedas.
            </p>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/terminos"
                  className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                >
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link
                  href="/privacidad"
                  className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                >
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link
                  href="/tarifas"
                  className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                >
                  Tarifas
                </Link>
              </li>
            </ul>
          </div>

          {/* Recursos */}
          <div>
            <h3 className="font-semibold mb-4">Recursos</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/api"
                  className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                >
                  API
                </Link>
              </li>
              <li>
                <Link
                  href="/prensa"
                  className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                >
                  Prensa
                </Link>
              </li>
              <li>
                <Link
                  href="/contacto"
                  className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                >
                  Contacto
                </Link>
              </li>
              <li>
                <Link
                  href="/soporte"
                  className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                >
                  Soporte
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-semibold mb-4">Síguenos</h3>
            <div className="flex gap-4">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="mailto:contacto@cuanted.com"
                className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-primary-foreground/20 text-center">
          <p className="text-sm text-primary-foreground/80">
            © {currentYear} Cuanted. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
