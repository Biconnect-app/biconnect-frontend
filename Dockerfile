# Build stage
FROM node:20 AS builder

# Install dependencies for native modules (Tailwind CSS v4 uses Rust)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Build arguments for Firebase (public)
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID
ARG NEXT_PUBLIC_SITE_URL

# Build arguments for PayPal (public)
ARG NEXT_PUBLIC_PAYPAL_CLIENT_ID
ARG NEXT_PUBLIC_PAYPAL_PLAN_MONTHLY
ARG NEXT_PUBLIC_PAYPAL_PLAN_ANNUAL

# Build arguments for PayPal (server-side only)
ARG PAYPAL_CLIENT_ID
ARG PAYPAL_CLIENT_SECRET
ARG PAYPAL_WEBHOOK_ID

# Set environment variables for build
ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ENV NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_PAYPAL_CLIENT_ID=$NEXT_PUBLIC_PAYPAL_CLIENT_ID
ENV NEXT_PUBLIC_PAYPAL_PLAN_MONTHLY=$NEXT_PUBLIC_PAYPAL_PLAN_MONTHLY
ENV NEXT_PUBLIC_PAYPAL_PLAN_ANNUAL=$NEXT_PUBLIC_PAYPAL_PLAN_ANNUAL

# Set server-side only variables (not embedded in client bundle)
ENV PAYPAL_CLIENT_ID=$PAYPAL_CLIENT_ID
ENV PAYPAL_CLIENT_SECRET=$PAYPAL_CLIENT_SECRET
ENV PAYPAL_WEBHOOK_ID=$PAYPAL_WEBHOOK_ID

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies with verbose output
RUN pnpm install --frozen-lockfile --shamefully-hoist

# Debug: Check that tailwindcss is properly installed
RUN ls -la node_modules/.bin/ | grep -E "(tailwind|postcss)" || echo "No tailwind/postcss binaries"
RUN pnpm list tailwindcss @tailwindcss/postcss postcss || echo "Package list failed"

# Copy all source code
COPY tsconfig.json next.config.mjs postcss.config.mjs tailwind.config.ts ./
COPY middleware.ts ./
COPY components.json ./
COPY public ./public
COPY styles ./styles
COPY app ./app
COPY components ./components
COPY lib ./lib
COPY hooks ./hooks

# Build the Next.js application with verbose output
RUN echo "=== Starting build ===" && \
    cat app/globals.css && \
    echo "=== Building ===" && \
    NODE_ENV=production pnpm run build && \
    echo "=== Build complete ==="

# Debug: show CSS files generated
RUN echo "=== Checking .next/static structure ===" && \
    ls -laR .next/static/ | head -100
RUN echo "=== Finding all CSS files ===" && \
    find .next -name "*.css" -type f 2>/dev/null
RUN echo "=== Checking build manifest ===" && \
    cat .next/build-manifest.json | head -50 || echo "No manifest"

# Production stage
FROM node:20-alpine

WORKDIR /app

# Runtime arguments for server-side variables
ARG PAYPAL_CLIENT_ID
ARG PAYPAL_CLIENT_SECRET
ARG PAYPAL_WEBHOOK_ID
ARG PAYPAL_API_URL
ARG FIREBASE_PROJECT_ID
ARG FIREBASE_CLIENT_EMAIL
ARG FIREBASE_PRIVATE_KEY
ARG DATABASE_URL
ARG NEXT_PUBLIC_SITE_URL

# Install pnpm
RUN npm install -g pnpm

# Copy package files and install ALL dependencies (needed for Next.js to serve CSS)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy the built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/postcss.config.mjs ./

# Set environment variables (NODE_ENV and PORT)
ENV NODE_ENV=production
ENV PORT=3000

# Set server-side only runtime variables
ENV PAYPAL_CLIENT_ID=$PAYPAL_CLIENT_ID
ENV PAYPAL_CLIENT_SECRET=$PAYPAL_CLIENT_SECRET
ENV PAYPAL_WEBHOOK_ID=$PAYPAL_WEBHOOK_ID
ENV PAYPAL_API_URL=$PAYPAL_API_URL
ENV FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID
ENV FIREBASE_CLIENT_EMAIL=$FIREBASE_CLIENT_EMAIL
ENV FIREBASE_PRIVATE_KEY=$FIREBASE_PRIVATE_KEY
ENV DATABASE_URL=$DATABASE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

# Expose port
EXPOSE 3000

# Start the application
CMD ["pnpm", "start"]
