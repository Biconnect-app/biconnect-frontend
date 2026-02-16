# Build stage
FROM node:20 AS builder

# Install dependencies for native modules (Tailwind CSS v4 uses Rust)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Build arguments for Supabase
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

# Build arguments for PayPal
ARG NEXT_PUBLIC_PAYPAL_CLIENT_ID
ARG NEXT_PUBLIC_PAYPAL_PLAN_MONTHLY
ARG NEXT_PUBLIC_PAYPAL_PLAN_ANNUAL

# Set environment variables for build
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_PAYPAL_CLIENT_ID=$NEXT_PUBLIC_PAYPAL_CLIENT_ID
ENV NEXT_PUBLIC_PAYPAL_PLAN_MONTHLY=$NEXT_PUBLIC_PAYPAL_PLAN_MONTHLY
ENV NEXT_PUBLIC_PAYPAL_PLAN_ANNUAL=$NEXT_PUBLIC_PAYPAL_PLAN_ANNUAL

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

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start the application
CMD ["pnpm", "start"]
