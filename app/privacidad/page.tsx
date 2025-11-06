export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Política de Privacidad</h1>

        <div className="prose prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Información que Recopilamos</h2>
            <p className="text-muted-foreground">
              Recopilamos información que nos proporcionas directamente, incluyendo:
            </p>
            <ul className="list-disc list-inside text-muted-foreground ml-4">
              <li>Nombre y apellido</li>
              <li>Dirección de correo electrónico</li>
              <li>Información de estrategias de trading</li>
              <li>Datos de uso de la plataforma</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Uso de la Información</h2>
            <p className="text-muted-foreground">Utilizamos la información recopilada para:</p>
            <ul className="list-disc list-inside text-muted-foreground ml-4">
              <li>Proporcionar y mantener nuestros servicios</li>
              <li>Procesar tus estrategias de trading</li>
              <li>Comunicarnos contigo sobre actualizaciones y cambios</li>
              <li>Mejorar la experiencia del usuario</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Seguridad de los Datos</h2>
            <p className="text-muted-foreground">
              Implementamos medidas de seguridad para proteger tu información personal. Sin embargo, ningún método de
              transmisión por Internet es 100% seguro.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Compartir Información</h2>
            <p className="text-muted-foreground">
              No vendemos ni compartimos tu información personal con terceros, excepto cuando sea necesario para:
            </p>
            <ul className="list-disc list-inside text-muted-foreground ml-4">
              <li>Cumplir con obligaciones legales</li>
              <li>Proteger nuestros derechos y seguridad</li>
              <li>Proporcionar servicios esenciales (como procesamiento de pagos)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Cookies</h2>
            <p className="text-muted-foreground">
              Utilizamos cookies y tecnologías similares para mejorar tu experiencia en la plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Tus Derechos</h2>
            <p className="text-muted-foreground">
              Tienes derecho a acceder, corregir o eliminar tu información personal en cualquier momento.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Contacto</h2>
            <p className="text-muted-foreground">
              Si tienes preguntas sobre esta política de privacidad, contáctanos a través de nuestro sitio web.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
