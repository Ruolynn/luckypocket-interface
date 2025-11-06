#!/bin/bash

# API 健康检查测试脚本

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

API_URL="${API_URL:-http://localhost:3001}"

echo -e "${YELLOW}🔍 测试 API 健康状态...${NC}\n"

# 测试健康检查端点
echo -e "${YELLOW}1. 测试 /health 端点...${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_URL}/health" || echo -e "\n000")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ 健康检查通过${NC}"
    echo -e "   响应: $body"
else
    echo -e "${RED}❌ 健康检查失败 (HTTP $http_code)${NC}"
    if [ "$http_code" = "000" ]; then
        echo -e "   ${RED}API 服务可能未启动${NC}"
    fi
    exit 1
fi

echo -e "\n${YELLOW}2. 测试 API 端点...${NC}"

# 测试获取 nonce
echo -e "${YELLOW}   - GET /api/v1/auth/nonce${NC}"
nonce_response=$(curl -s -w "\n%{http_code}" "${API_URL}/api/v1/auth/nonce" || echo -e "\n000")
nonce_code=$(echo "$nonce_response" | tail -n1)
if [ "$nonce_code" = "200" ]; then
    echo -e "   ${GREEN}✅ Nonce 端点正常${NC}"
else
    echo -e "   ${RED}❌ Nonce 端点失败 (HTTP $nonce_code)${NC}"
fi

# 测试获取统计信息
echo -e "${YELLOW}   - GET /api/v1/stats${NC}"
stats_response=$(curl -s -w "\n%{http_code}" "${API_URL}/api/v1/stats" || echo -e "\n000")
stats_code=$(echo "$stats_response" | tail -n1)
if [ "$stats_code" = "200" ]; then
    echo -e "   ${GREEN}✅ Stats 端点正常${NC}"
else
    echo -e "   ${YELLOW}⚠️  Stats 端点返回 HTTP $stats_code${NC}"
fi

echo -e "\n${GREEN}✅ API 测试完成${NC}\n"

