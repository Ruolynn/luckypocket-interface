#!/bin/bash

# HongBao 本地开发环境启动脚本

set -e

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 启动 HongBao 本地开发环境${NC}\n"

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker 未运行，请先启动 Docker${NC}"
    exit 1
fi

# 检查 Docker Compose 服务
echo -e "${YELLOW}📦 检查 Docker 服务...${NC}"
if ! docker compose ps | grep -q "hongbao-postgres.*Up"; then
    echo -e "${YELLOW}⚠️  PostgreSQL 未运行，正在启动...${NC}"
    docker compose up -d postgres
    echo -e "${GREEN}✅ PostgreSQL 已启动${NC}"
else
    echo -e "${GREEN}✅ PostgreSQL 正在运行${NC}"
fi

if ! docker compose ps | grep -q "hongbao-redis.*Up"; then
    echo -e "${YELLOW}⚠️  Redis 未运行，正在启动...${NC}"
    docker compose up -d redis
    echo -e "${GREEN}✅ Redis 已启动${NC}"
else
    echo -e "${GREEN}✅ Redis 正在运行${NC}"
fi

# 等待服务就绪
echo -e "\n${YELLOW}⏳ 等待服务就绪...${NC}"
sleep 2

# 检查数据库连接
echo -e "${YELLOW}🔍 检查数据库连接...${NC}"
if docker compose exec -T postgres psql -U hongbao -d hongbao -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 数据库连接正常${NC}"
else
    echo -e "${RED}❌ 数据库连接失败${NC}"
    exit 1
fi

# 检查 Redis 连接
echo -e "${YELLOW}🔍 检查 Redis 连接...${NC}"
if docker compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Redis 连接正常${NC}"
else
    echo -e "${RED}❌ Redis 连接失败${NC}"
    exit 1
fi

# 检查 API 环境变量
echo -e "\n${YELLOW}🔍 检查 API 环境变量...${NC}"
if [ ! -f "apps/api/.env" ]; then
    echo -e "${YELLOW}⚠️  apps/api/.env 不存在${NC}"
    echo -e "${YELLOW}   请创建 .env 文件并配置必需的环境变量${NC}"
    echo -e "${YELLOW}   参考: apps/api/.env.example 或 ENV_SETUP.md${NC}"
    exit 1
else
    echo -e "${GREEN}✅ API .env 文件存在${NC}"
fi

# 检查 Web 环境变量
echo -e "${YELLOW}🔍 检查 Web 环境变量...${NC}"
if [ ! -f "apps/web/.env.local" ] && [ ! -f "apps/web/.env" ]; then
    echo -e "${YELLOW}⚠️  apps/web/.env.local 不存在${NC}"
    echo -e "${YELLOW}   将使用默认配置${NC}"
else
    echo -e "${GREEN}✅ Web 环境变量文件存在${NC}"
fi

# 检查依赖
echo -e "\n${YELLOW}📦 检查依赖...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  依赖未安装，正在安装...${NC}"
    pnpm install
    echo -e "${GREEN}✅ 依赖安装完成${NC}"
else
    echo -e "${GREEN}✅ 依赖已安装${NC}"
fi

# 检查 Prisma Client
echo -e "\n${YELLOW}🔍 检查 Prisma Client...${NC}"
cd apps/api
if [ ! -d "node_modules/.prisma" ]; then
    echo -e "${YELLOW}⚠️  Prisma Client 未生成，正在生成...${NC}"
    pnpm prisma:generate
    echo -e "${GREEN}✅ Prisma Client 已生成${NC}"
else
    echo -e "${GREEN}✅ Prisma Client 已生成${NC}"
fi

cd ../..

echo -e "\n${GREEN}✅ 所有检查通过！${NC}\n"

echo -e "${YELLOW}📝 启动说明：${NC}"
echo -e "1. 启动 API 后端："
echo -e "   ${GREEN}cd apps/api && pnpm dev${NC}"
echo -e ""
echo -e "2. 启动 Web 前端（新终端）："
echo -e "   ${GREEN}cd apps/web && pnpm dev${NC}"
echo -e ""
echo -e "3. 访问应用："
echo -e "   ${GREEN}API: http://localhost:3001${NC}"
echo -e "   ${GREEN}Web: http://localhost:9000${NC}"
echo -e ""
echo -e "4. 健康检查："
echo -e "   ${GREEN}curl http://localhost:3001/health${NC}"
echo -e ""

