#!/bin/bash

# Script para construir y subir la imagen manualmente a Artifact Registry
# Útil para testing local antes de usar Cloud Build

set -e  # Salir si hay errores

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  Build y Push Manual a GCP${NC}"
echo -e "${BLUE}=====================================${NC}"

# Configuración
PROJECT_ID="biconect"
REGION="southamerica-east1"
REPOSITORY="app-repo"
IMAGE_NAME="biconnect-frontend"
IMAGE_TAG="latest"
FULL_IMAGE_NAME="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}:${IMAGE_TAG}"

# Cargar variables de entorno desde .env.local si existe
if [ -f .env ]; then
  echo -e "${GREEN}Cargando variables desde .env.local...${NC}"
  export $(cat .env.local | grep -v '^#' | xargs)
else
  echo -e "${YELLOW}⚠️  No se encontró .env.local. Asegúrate de tener las variables configuradas.${NC}"
fi

# Validar variables requeridas
echo -e "\n${GREEN}1. Validando variables de entorno...${NC}"
REQUIRED_VARS=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "NEXT_PUBLIC_PAYPAL_CLIENT_ID"
  "NEXT_PUBLIC_PAYPAL_PLAN_MONTHLY"
  "NEXT_PUBLIC_PAYPAL_PLAN_ANNUAL"
  "NEXT_PUBLIC_SITE_URL"
  "PAYPAL_CLIENT_ID"
  "PAYPAL_CLIENT_SECRET"
  "PAYPAL_WEBHOOK_ID"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    MISSING_VARS+=("$var")
  fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
  echo -e "${RED}❌ Faltan las siguientes variables de entorno:${NC}"
  printf '%s\n' "${MISSING_VARS[@]}"
  echo -e "${YELLOW}Configúralas en .env.local o exportalas en tu terminal${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Todas las variables requeridas están configuradas${NC}"

# 2. Autenticar con Artifact Registry
echo -e "\n${GREEN}2. Configurando autenticación con Artifact Registry...${NC}"
gcloud auth configure-docker ${REGION}-docker.pkg.dev

# 3. Construir la imagen
echo -e "\n${GREEN}3. Construyendo la imagen Docker...${NC}"
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  --build-arg NEXT_PUBLIC_PAYPAL_CLIENT_ID="$NEXT_PUBLIC_PAYPAL_CLIENT_ID" \
  --build-arg NEXT_PUBLIC_PAYPAL_PLAN_MONTHLY="$NEXT_PUBLIC_PAYPAL_PLAN_MONTHLY" \
  --build-arg NEXT_PUBLIC_PAYPAL_PLAN_ANNUAL="$NEXT_PUBLIC_PAYPAL_PLAN_ANNUAL" \
  --build-arg NEXT_PUBLIC_SITE_URL="$NEXT_PUBLIC_SITE_URL" \
  --build-arg PAYPAL_CLIENT_ID="$PAYPAL_CLIENT_ID" \
  --build-arg PAYPAL_CLIENT_SECRET="$PAYPAL_CLIENT_SECRET" \
  --build-arg PAYPAL_WEBHOOK_ID="$PAYPAL_WEBHOOK_ID" \
  -t $FULL_IMAGE_NAME \
  .

echo -e "${GREEN}✅ Imagen construida exitosamente${NC}"

# 4. Pushear a Artifact Registry
echo -e "\n${GREEN}4. Subiendo imagen a Artifact Registry...${NC}"
docker push $FULL_IMAGE_NAME

echo -e "\n${GREEN}=====================================${NC}"
echo -e "${GREEN}✅ ¡Despliegue completado!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo -e "Imagen disponible en:"
echo -e "${BLUE}$FULL_IMAGE_NAME${NC}"
echo ""
echo -e "Para desplegar en Cloud Run:"
echo -e "${YELLOW}gcloud run deploy biconnect-frontend \\${NC}"
echo -e "${YELLOW}  --image $FULL_IMAGE_NAME \\${NC}"
echo -e "${YELLOW}  --platform managed \\${NC}"
echo -e "${YELLOW}  --region $REGION \\${NC}"
echo -e "${YELLOW}  --allow-unauthenticated${NC}"
