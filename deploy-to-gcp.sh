#!/bin/bash

# Script para desplegar a Google Cloud usando Cloud Build
# Asegúrate de tener gcloud CLI instalado y autenticado

set -e  # Salir si hay errores

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  Desplegando a Google Cloud${NC}"
echo -e "${BLUE}=====================================${NC}"

# Configuración del proyecto
PROJECT_ID="biconect"
REGION="southamerica-east1"

# 1. Autenticarse (si es necesario)
echo -e "\n${GREEN}1. Verificando autenticación...${NC}"
gcloud config set project $PROJECT_ID

# 2. Habilitar APIs necesarias (ejecutar solo la primera vez)
# echo -e "\n${GREEN}2. Habilitando APIs necesarias...${NC}"
# gcloud services enable cloudbuild.googleapis.com
# gcloud services enable artifactregistry.googleapis.com

set -a
source .env
set +a

# 3. Configurar variables de sustitución
echo -e "\n${GREEN}3. Preparando variables de entorno...${NC}"
echo "⚠️  IMPORTANTE: Configura estas variables en el Trigger de Cloud Build:"
echo "   - _NEXT_PUBLIC_FIREBASE_API_KEY"
echo "   - _NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
echo "   - _NEXT_PUBLIC_FIREBASE_PROJECT_ID"
echo "   - _NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
echo "   - _NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
echo "   - _NEXT_PUBLIC_FIREBASE_APP_ID"
echo "   - _NEXT_PUBLIC_PAYPAL_CLIENT_ID"
echo "   - _NEXT_PUBLIC_PAYPAL_PLAN_MONTHLY"
echo "   - _NEXT_PUBLIC_PAYPAL_PLAN_ANNUAL"
echo "   - _NEXT_PUBLIC_SITE_URL"
echo "   - _DATABASE_URL"
echo "   - _FIREBASE_PROJECT_ID"
echo "   - _FIREBASE_CLIENT_EMAIL"
echo "   - _FIREBASE_PRIVATE_KEY"
echo "   - _PAYPAL_API_URL"
echo "   - _PAYPAL_CLIENT_ID"
echo "   - _PAYPAL_CLIENT_SECRET"
echo "   - _PAYPAL_WEBHOOK_ID"
echo ""

# 4. Ejecutar Cloud Build
echo -e "\n${GREEN}4. Iniciando Cloud Build...${NC}"
echo "Esto construirá y subirá la imagen a Artifact Registry"

# Opción A: Submit con variables desde línea de comando
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=\
_NEXT_PUBLIC_FIREBASE_API_KEY="$NEXT_PUBLIC_FIREBASE_API_KEY",\
_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",\
_NEXT_PUBLIC_FIREBASE_PROJECT_ID="$NEXT_PUBLIC_FIREBASE_PROJECT_ID",\
_NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",\
_NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",\
_NEXT_PUBLIC_FIREBASE_APP_ID="$NEXT_PUBLIC_FIREBASE_APP_ID",\
_NEXT_PUBLIC_PAYPAL_CLIENT_ID="$NEXT_PUBLIC_PAYPAL_CLIENT_ID",\
_NEXT_PUBLIC_PAYPAL_PLAN_MONTHLY="$NEXT_PUBLIC_PAYPAL_PLAN_MONTHLY",\
_NEXT_PUBLIC_PAYPAL_PLAN_ANNUAL="$NEXT_PUBLIC_PAYPAL_PLAN_ANNUAL",\
_NEXT_PUBLIC_SITE_URL="$NEXT_PUBLIC_SITE_URL",\
_DATABASE_URL="$DATABASE_URL",\
_FIREBASE_PROJECT_ID="$FIREBASE_PROJECT_ID",\
_FIREBASE_CLIENT_EMAIL="$FIREBASE_CLIENT_EMAIL",\
_FIREBASE_PRIVATE_KEY="$FIREBASE_PRIVATE_KEY",\
_PAYPAL_API_URL="$PAYPAL_API_URL",\
_PAYPAL_CLIENT_ID="$PAYPAL_CLIENT_ID",\
_PAYPAL_CLIENT_SECRET="$PAYPAL_CLIENT_SECRET",\
_PAYPAL_WEBHOOK_ID="$PAYPAL_WEBHOOK_ID" \
  --region=$REGION

echo -e "\n${GREEN}✅ Build completado!${NC}"
echo -e "Imagen disponible en: ${BLUE}southamerica-east1-docker.pkg.dev/biconect/app-repo/biconnect-frontend:latest${NC}"
