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

# 3. Preparar variables de entorno
echo -e "\n${GREEN}3. Preparando variables de entorno...${NC}"
echo "Se usarán secretos desde Secret Manager definidos en cloudbuild.yaml"
echo ""

# 4. Ejecutar Cloud Build
echo -e "\n${GREEN}4. Iniciando Cloud Build...${NC}"
echo "Esto construirá y subirá la imagen a Artifact Registry"

gcloud builds submit \
  --config=cloudbuild.yaml \
  --region=$REGION

echo -e "\n${GREEN}✅ Build completado!${NC}"
echo -e "Imagen disponible en: ${BLUE}southamerica-east1-docker.pkg.dev/biconect/app-repo/biconnect-frontend:latest${NC}"
