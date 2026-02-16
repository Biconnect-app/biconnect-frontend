import { Shield, Lock, Eye, FileCheck } from "lucide-react"

export function Security() {
  return (
    <section id="seguridad" className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
              Seguridad y cumplimiento
            </h2>
            <p className="text-xl text-gray-300 text-pretty">Tu seguridad es nuestra prioridad número uno</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Custodia Segura</h3>
              <p className="text-muted-foreground leading-relaxed">
                El 95% de los fondos se almacenan en cold wallets offline, protegidos con múltiples capas de seguridad
                física y digital.
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Encriptación de Nivel Bancario</h3>
              <p className="text-muted-foreground leading-relaxed">
                Todas las comunicaciones y datos están protegidos con encriptación AES-256 y TLS 1.3, el mismo estándar
                usado por instituciones financieras.
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Eye className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Autenticación 2FA</h3>
              <p className="text-muted-foreground leading-relaxed">
                Protege tu cuenta con autenticación de dos factores mediante aplicaciones como Google Authenticator o
                SMS.
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <FileCheck className="h-6 w-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Auditorías Regulares</h3>
              <p className="text-muted-foreground leading-relaxed">
                Nuestros sistemas son auditados trimestralmente por firmas de seguridad independientes para garantizar
                los más altos estándares.
              </p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <p className="text-lg text-muted-foreground leading-relaxed">
              Cumplimos con todas las regulaciones locales e internacionales, incluyendo políticas KYC (Know Your
              Customer) y AML (Anti-Money Laundering). Nuestro equipo de cumplimiento trabaja constantemente para
              mantener los más altos estándares de la industria y proteger a nuestros usuarios.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
