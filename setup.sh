#!/bin/bash
set -e

GREEN='\033[0;32m'
GOLD='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${GOLD}  🎰 LuckVault Casino — Setup Script${NC}"
echo "  ======================================"
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
  echo -e "${RED}❌ Docker não encontrado. Instale em https://docs.docker.com/get-docker/${NC}"
  exit 1
fi

if ! command -v docker-compose &> /dev/null; then
  echo -e "${RED}❌ Docker Compose não encontrado.${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Docker encontrado: $(docker --version)${NC}"

# Copy env files
if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
  echo -e "${GREEN}✅ backend/.env criado a partir do .env.example${NC}"
fi

if [ ! -f frontend/.env ]; then
  cp frontend/.env.example frontend/.env
  echo -e "${GREEN}✅ frontend/.env criado a partir do .env.example${NC}"
fi

echo ""
echo -e "${GOLD}🚀 Iniciando containers...${NC}"
echo ""

docker-compose up --build -d

echo ""
echo -e "${GREEN}✅ Plataforma iniciada com sucesso!${NC}"
echo ""
echo "  📍 Frontend:    http://localhost:3000"
echo "  📍 Backend API: http://localhost:3001/api"
echo "  📍 PostgreSQL:  localhost:5432"
echo "  📍 Redis:       localhost:6379"
echo ""
echo -e "  ${GOLD}🎁 Novos usuários recebem R\$ 1.000 de bônus!${NC}"
echo ""
echo "  Para parar: docker-compose down"
echo "  Para logs:  docker-compose logs -f backend"
echo ""
