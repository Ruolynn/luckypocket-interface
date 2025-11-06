#!/bin/bash

# 服务状态检查脚本

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 检查 HongBao 服务状态${NC}\n"

# 检查 Docker
echo -e "${YELLOW}1. Docker 服务${NC}"
if docker info > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Docker 正在运行${NC}"
else
    echo -e "   ${RED}❌ Docker 未运行${NC}"
    exit 1
fi

# 检查 Docker Compose 服务
echo -e "\n${YELLOW}2. Docker Compose 服务${NC}"
if docker compose ps | grep -q "hongbao-postgres.*Up"; then
    echo -e "   ${GREEN}✅ PostgreSQL 正在运行${NC}"
    # 测试连接
    if docker compose exec -T postgres psql -U hongbao -d hongbao -c "SELECT 1;" > /dev/null 2>&1; then
        echo -e "   ${GREEN}   ✅ 数据库连接正常${NC}"
    else
        echo -e "   ${RED}   ❌ 数据库连接失败${NC}"
    fi
else
    echo -e "   ${RED}❌ PostgreSQL 未运行${NC}"
fi

if docker compose ps | grep -q "hongbao-redis.*Up"; then
    echo -e "   ${GREEN}✅ Redis 正在运行${NC}"
    # 测试连接
    if docker compose exec -T redis redis-cli --no-auth-warning ping > /dev/null 2>&1; then
        echo -e "   ${GREEN}   ✅ Redis 连接正常${NC}"
    else
        echo -e "   ${YELLOW}   ⚠️  Redis 可能需要密码或连接失败${NC}"
    fi
else
    echo -e "   ${RED}❌ Redis 未运行${NC}"
fi

# 检查 API 服务
echo -e "\n${YELLOW}3. API 服务${NC}"
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ API 正在运行 (http://localhost:3001)${NC}"
    health=$(curl -s http://localhost:3001/health)
    echo -e "   ${GREEN}   响应: $health${NC}"
else
    echo -e "   ${RED}❌ API 未运行或无法访问${NC}"
    echo -e "   ${YELLOW}   提示: 运行 'cd apps/api && pnpm dev' 启动 API${NC}"
fi

# 检查 Web 服务
echo -e "\n${YELLOW}4. Web 服务${NC}"
if curl -s http://localhost:9000 > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Web 正在运行 (http://localhost:9000)${NC}"
else
    echo -e "   ${RED}❌ Web 未运行或无法访问${NC}"
    echo -e "   ${YELLOW}   提示: 运行 'cd apps/web && pnpm dev' 启动 Web${NC}"
fi

# 检查环境变量
echo -e "\n${YELLOW}5. 环境变量${NC}"
if [ -f "apps/api/.env" ]; then
    echo -e "   ${GREEN}✅ API .env 文件存在${NC}"
else
    echo -e "   ${RED}❌ API .env 文件不存在${NC}"
    echo -e "   ${YELLOW}   提示: 创建 apps/api/.env 文件${NC}"
fi

if [ -f "apps/web/.env.local" ] || [ -f "apps/web/.env" ]; then
    echo -e "   ${GREEN}✅ Web 环境变量文件存在${NC}"
else
    echo -e "   ${YELLOW}⚠️  Web 环境变量文件不存在（将使用默认值）${NC}"
fi

# 检查 Prisma Client
echo -e "\n${YELLOW}6. Prisma Client${NC}"
if [ -d "apps/api/node_modules/.prisma" ]; then
    echo -e "   ${GREEN}✅ Prisma Client 已生成${NC}"
else
    echo -e "   ${RED}❌ Prisma Client 未生成${NC}"
    echo -e "   ${YELLOW}   提示: 运行 'cd apps/api && pnpm prisma:generate'${NC}"
fi

echo -e "\n${BLUE}📝 总结${NC}"
echo -e "   - Docker 服务: $(docker compose ps --format json | jq -r 'length' 2>/dev/null || echo '?') 个容器"
echo -e "   - API 状态: $(curl -s http://localhost:3001/health > /dev/null 2>&1 && echo '运行中' || echo '未运行')"
echo -e "   - Web 状态: $(curl -s http://localhost:9000 > /dev/null 2>&1 && echo '运行中' || echo '未运行')"
echo -e ""

