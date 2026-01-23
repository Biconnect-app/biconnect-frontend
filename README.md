# Biconnect - Plataforma de Criptomonedas

Plataforma moderna y segura para comprar y vender criptomonedas, construida con Next.js 15, React 19, y Tailwind CSS v4.

## Características

- 🏠 **Landing Page completa** con hero, características, precios, seguridad y FAQ
- 💰 **Página de precios** con comparación detallada de planes
- 🔐 **Sistema de autenticación** (login, registro, recuperación de contraseña)
- 📊 **Dashboard** con portfolio, activos, y mercado en vivo
- 🌓 **Dark mode** con toggle
- 📱 **Responsive** en todos los dispositivos
- ♿ **Accesible** con ARIA labels y navegación por teclado

## Tecnologías

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19
- **Estilos**: Tailwind CSS v4
- **Componentes**: shadcn/ui
- **Tipografía**: Geist Sans & Geist Mono
- **Iconos**: Lucide React

## Instalación

1. Clona el repositorio o descarga el ZIP
2. Instala las dependencias:

\`\`\`bash
npm install
\`\`\`

3. Ejecuta el servidor de desarrollo:

\`\`\`bash
npm run dev
\`\`\`

4. Abre [http://localhost:3000](http://localhost:3000) en tu navegador

## Estructura del Proyecto

\`\`\`
biconnect/
├── app/
│   ├── (pages)/
│   │   ├── page.tsx              # Landing page
│   │   ├── precios/              # Página de precios
│   │   ├── login/                # Inicio de sesión
│   │   ├── registro/             # Registro
│   │   ├── recuperar/            # Recuperación de contraseña
│   │   └── app/                  # Dashboard (protegido)
│   ├── layout.tsx                # Layout principal
│   └── globals.css               # Estilos globales
├── components/
│   ├── navbar.tsx                # Navegación principal
│   ├── footer.tsx                # Footer
│   ├── sections/                 # Secciones de landing
│   └── dashboard/                # Componentes del dashboard
├── lib/
│   └── auth.ts                   # Lógica de autenticación (simulada)
└── public/                       # Assets estáticos
\`\`\`

## Contenido Editable (Placeholders)

### Variables a Reemplazar

Busca y reemplaza estos placeholders en el código:

- **{{DESCRIPCION_EMPRESA}}**: Descripción completa de Biconnect (en `components/sections/about.tsx`)
- **{{VENTAJAS_GRATUITA}}**: Lista de beneficios del plan gratuito
- **{{VENTAJAS_PAGA}}**: Lista de beneficios del plan Pro
- **{{PRECIO_PRO}}**: Precio mensual del plan Pro (actualmente $29)
- **{{AÑO}}**: Año actual (se genera automáticamente)

### Imágenes y Assets

Reemplaza las imágenes placeholder en:

- `/public/` - Logo de Biconnect
- Hero section - Imagen de la plataforma de trading
- Favicon

### Enlaces de Redes Sociales

Actualiza los enlaces en `components/footer.tsx`:

- Twitter
- LinkedIn
- GitHub
- Email de contacto

## Integración con Backend

Este proyecto usa autenticación simulada en el frontend. Para producción:

### 1. Autenticación Real

Reemplaza `lib/auth.ts` con integración a tu backend:

\`\`\`typescript
// Ejemplo con API real
export async function login(email: string, password: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return response.json()
}
\`\`\`

### 2. Base de Datos

Integra una base de datos para:

- Usuarios y autenticación
- Transacciones y órdenes
- Portfolio y balances
- Historial de operaciones

Opciones recomendadas:

- Supabase (PostgreSQL)
- MongoDB Atlas
- PlanetScale (MySQL)

### 3. API de Precios

Integra una API de precios de criptomonedas:

- CoinGecko API
- CoinMarketCap API
- Binance API

### 4. Pasarela de Pago

Para el plan Pro, integra una pasarela de pago:

- Stripe
- PayPal
- Mercado Pago

El placeholder está en `app/registro/page.tsx` línea ~200.

### 5. KYC (Know Your Customer)

Integra un servicio de verificación de identidad:

- Onfido
- Jumio
- Veriff

## Seguridad

⚠️ **IMPORTANTE**: Este proyecto es un prototipo. Para producción:

1. **Nunca almacenes contraseñas en texto plano**
2. **Implementa autenticación JWT o sesiones seguras**
3. **Usa HTTPS en producción**
4. **Implementa rate limiting**
5. **Valida todas las entradas en el servidor**
6. **Implementa 2FA (autenticación de dos factores)**
7. **Usa variables de entorno para secrets**

## Despliegue

### Google Cloud Run (Recomendado)

1. Configura Cloud Build con el archivo `cloudbuild.yaml`
2. Configura las variables de entorno en Cloud Run
3. Despliega automáticamente con cada push

### Otros Proveedores

- AWS Amplify
- Railway
- Render

## Licencia

Este proyecto es un template de código abierto. Úsalo libremente para tus proyectos.

## Soporte

Para preguntas o problemas, abre un issue en el repositorio.

---

**Desarrollado con ❤️ para la comunidad cripto**
