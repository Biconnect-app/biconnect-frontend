export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Términos y Condiciones</h1>

        <div className="prose prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Aceptación de los Términos</h2>
            <p className="text-muted-foreground">
              Al acceder y utilizar Biconnect, aceptas estar sujeto a estos términos y condiciones de uso.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Descripción del Servicio</h2>
            <p className="text-muted-foreground">
              Biconnect es una plataforma que permite automatizar estrategias de trading mediante webhooks de
              TradingView.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Riesgos del Trading</h2>
            <p className="text-muted-foreground">
              El trading de criptomonedas conlleva riesgos significativos. Puedes perder parte o la totalidad de tu
              inversión. Solo debes operar con capital que puedas permitirte perder.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Responsabilidad del Usuario</h2>
            <p className="text-muted-foreground">
              Eres responsable de mantener la seguridad de tu cuenta y de todas las operaciones realizadas a través de
              tu cuenta.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Limitación de Responsabilidad</h2>
            <p className="text-muted-foreground">
              Biconnect no se hace responsable de pérdidas financieras resultantes del uso de la plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Modificaciones</h2>
            <p className="text-muted-foreground">
              Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigor
              inmediatamente después de su publicación.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
