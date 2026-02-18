# Biconnect Frontend

Aplicación web para la gestión de estrategias y suscripciones de trading, construida con Next.js, React y Supabase. Incluye autenticación, recuperación de contraseña, panel de usuario y gestión de integraciones.

## Descripción

Esta aplicación permite a los usuarios:
- Registrarse, iniciar sesión y recuperar su contraseña mediante Supabase Auth.
- Gestionar estrategias de trading y suscripciones desde un dashboard seguro.
- Integrar cuentas de exchanges y servicios de pago.
- Visualizar y administrar configuraciones personales.

No incluye landing page pública ni mercado en vivo. El foco está en la experiencia autenticada y la gestión de usuario.

## Estructura del Proyecto

```
app/
  ├── login/                  # Login de usuario
  ├── registro/               # Registro de usuario
  ├── recuperar/              # Recuperación y reseteo de contraseña
  │     └── nueva-contrasena/ # Seteo de nueva contraseña
  ├── dashboard/              # Panel principal (protegido)
  │     ├── estrategias/      # Gestión de estrategias
  │     ├── integraciones/    # Integraciones de exchanges
  │     ├── ordenes/          # Historial de órdenes
  │     ├── suscripcion/      # Gestión de suscripción
  │     └── configuracion/    # Configuración de usuario
  ├── precios/                # Página de precios (estática)
  ├── docs/                   # Documentación
  ├── privacidad/             # Política de privacidad
  ├── terminos/               # Términos y condiciones
components/
  ├── navbar.tsx              # Navegación principal
  ├── footer.tsx              # Footer
  ├── dashboard/              # Componentes del dashboard
  ├── sections/               # Secciones informativas
  └── ui/                     # Componentes reutilizables
lib/
  ├── supabase/               # Integración con Supabase (auth, client, server)
  └── utils.ts                # Utilidades generales
public/                       # Imágenes y assets
scripts/                      # Scripts SQL y de migración (ignorado en git)
```

## Variables de Entorno

Configura un archivo `.env`:
- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`: credenciales públicas de Supabase
- `NEXT_PUBLIC_SITE_URL`: URL base del frontend
- Variables de PayPal si usas pagos

## Instalación y uso

```bash
npm install
npm run dev
# o
pnpm install
pnpm dev
```

Accede a la app en [http://localhost:3000](http://localhost:3000)

## Despliegue

El despliegue recomendado es en Google Cloud Run usando Cloud Build y Artifact Registry. Usa los scripts `deploy-to-gcp.sh` y `deploy-manual.sh` para automatizar el proceso. Consulta `.env` para las variables necesarias.

## Seguridad
- Todas las operaciones sensibles usan Supabase Auth y RLS.
- No se exponen claves secretas en el frontend.
- El flujo de recuperación de contraseña es seguro y robusto.

## Soporte
Para dudas o problemas, abre un issue en el repositorio.

---

Desarrollado por el equipo de Biconnect.
