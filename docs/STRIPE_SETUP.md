# Integración de Stripe para BiConnect

Esta guía explica cómo configurar la integración de Stripe para el cobro del Plan Pro con 30 días de prueba gratis.

## Configuración

### 1. Crear cuenta en Stripe

1. Ve a [Stripe Dashboard](https://dashboard.stripe.com) y crea una cuenta
2. Activa tu cuenta para producción cuando estés listo

### 2. Crear Producto y Precio en Stripe

1. Ve a **Products** en el Dashboard de Stripe
2. Crea un nuevo producto llamado "Plan Pro" o "BiConnect Pro"
3. Añade un precio:
   - **Precio**: $29.00 USD
   - **Tipo**: Recurrente
   - **Período**: Mensual
4. Copia el **Price ID** (empieza con `price_`)

### 3. Configurar Variables de Entorno

Añade las siguientes variables a tu archivo `.env.local`:

\`\`\`bash
# Stripe Keys (obtén estos de https://dashboard.stripe.com/apikeys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx

# Stripe Webhook Secret (se genera al crear el webhook)
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Stripe Price IDs (obtén estos de Products > Prices)
STRIPE_PRICE_PRO_MONTHLY=price_xxxxx

# Supabase Service Role Key (para webhooks)
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx
\`\`\`

### 4. Configurar Webhook en Stripe

1. Ve a **Developers > Webhooks** en el Dashboard
2. Crea un nuevo endpoint:
   - **URL**: `https://tu-dominio.com/api/stripe/webhook`
   - **Eventos a escuchar**:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
     - `invoice.payment_succeeded`
3. Copia el **Signing Secret** y añádelo como `STRIPE_WEBHOOK_SECRET`

### 5. Desarrollo Local con Stripe CLI

Para probar webhooks localmente:

\`\`\`bash
# Instalar Stripe CLI
brew install stripe/stripe-cli/stripe

# Autenticarse
stripe login

# Reenviar webhooks a tu servidor local
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Copiar el webhook signing secret que aparece y añadirlo a .env.local
\`\`\`

### 6. Ejecutar Migración de Base de Datos

Ejecuta el script SQL para añadir las columnas necesarias a la tabla `profiles`:

\`\`\`sql
-- Archivo: scripts/add_stripe_columns.sql
-- Ejecutar en Supabase SQL Editor
\`\`\`

Este script añade:
- `stripe_customer_id`: ID del cliente en Stripe
- `stripe_subscription_id`: ID de la suscripción activa
- `stripe_subscription_status`: Estado de la suscripción
- `stripe_current_period_end`: Fin del período actual de facturación
- `trial_ends_at`: Fecha de fin del período de prueba

## Flujo de Pago

1. Usuario hace clic en "Comenzar prueba gratis" en `/precios`
2. Si no está logueado, se redirige a `/login`
3. Se crea una sesión de Stripe Checkout con 30 días de trial
4. Usuario completa el checkout en Stripe
5. Webhook recibe `checkout.session.completed`
6. Se actualiza el perfil del usuario a Plan Pro
7. Usuario es redirigido a `/dashboard?checkout=success`

## Gestión de Suscripción

Los usuarios Pro pueden gestionar su suscripción desde:
- `/dashboard/configuracion` → Sección "Suscripción"
- Botón "Gestionar suscripción" abre el Stripe Customer Portal

## Archivos Creados

\`\`\`
lib/stripe/
├── client.ts       # Cliente Stripe para el navegador
├── server.ts       # Cliente Stripe para el servidor
└── config.ts       # Configuración y Price IDs

app/api/stripe/
├── checkout/route.ts  # Crear sesión de checkout
├── portal/route.ts    # Acceder al Customer Portal
└── webhook/route.ts   # Manejar webhooks de Stripe

components/
├── checkout-button.tsx          # Botón para iniciar checkout
└── manage-subscription-button.tsx # Botón para gestionar suscripción

scripts/
└── add_stripe_columns.sql       # Migración de base de datos
\`\`\`

## Testing

Para probar en modo test:

1. Usa las API keys de test (empiezan con `pk_test_` y `sk_test_`)
2. Usa [tarjetas de prueba de Stripe](https://stripe.com/docs/testing):
   - **Éxito**: `4242 4242 4242 4242`
   - **Rechazada**: `4000 0000 0000 0002`
   - **Requiere autenticación**: `4000 0025 0000 3155`

## Producción

Antes de ir a producción:

1. Activa tu cuenta Stripe para modo live
2. Reemplaza las API keys de test por las de producción
3. Crea el webhook en modo live con la URL de producción
4. Verifica que el Customer Portal esté configurado en Stripe
