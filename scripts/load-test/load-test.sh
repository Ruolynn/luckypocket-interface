#!/bin/bash

# 压力测试启动脚本

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

API_URL="${API_URL:-http://localhost:3001}"
SOCKET_URL="${SOCKET_URL:-http://localhost:3001}"

echo -e "${BLUE}🚀 HongBao 压力测试套件${NC}\n"

# 检查 k6 是否安装
if ! command -v k6 &> /dev/null; then
    echo -e "${RED}❌ k6 未安装${NC}"
    echo -e "${YELLOW}安装 k6: https://k6.io/docs/getting-started/installation/${NC}"
    exit 1
fi

echo -e "${GREEN}✅ k6 已安装${NC}\n"

# 检查 API 是否运行
echo -e "${YELLOW}🔍 检查 API 服务...${NC}"
if curl -s "${API_URL}/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API 服务正在运行${NC}\n"
else
    echo -e "${RED}❌ API 服务未运行${NC}"
    echo -e "${YELLOW}请先启动 API 服务: cd apps/api && pnpm dev${NC}"
    exit 1
fi

# 选择测试类型
echo -e "${BLUE}选择测试类型:${NC}"
echo -e "1. API 压力测试"
echo -e "2. WebSocket 压力测试"
echo -e "3. 完整测试套件"
echo -e ""
read -p "请选择 (1-3): " choice

case $choice in
    1)
        echo -e "\n${GREEN}开始 API 压力测试...${NC}\n"
        k6 run --env API_URL="${API_URL}" scripts/load-test/k6-api-test.js
        ;;
    2)
        echo -e "\n${GREEN}开始 WebSocket 压力测试...${NC}\n"
        k6 run --env SOCKET_URL="${SOCKET_URL}" scripts/load-test/k6-websocket-test.js
        ;;
    3)
        echo -e "\n${GREEN}开始完整测试套件...${NC}\n"
        echo -e "${YELLOW}1. API 压力测试${NC}"
        k6 run --env API_URL="${API_URL}" scripts/load-test/k6-api-test.js
        echo -e "\n${YELLOW}2. WebSocket 压力测试${NC}"
        k6 run --env SOCKET_URL="${SOCKET_URL}" scripts/load-test/k6-websocket-test.js
        ;;
    *)
        echo -e "${RED}无效选择${NC}"
        exit 1
        ;;
esac

echo -e "\n${GREEN}✅ 测试完成${NC}"

