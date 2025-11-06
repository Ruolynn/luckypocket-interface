#!/bin/bash

# Git 提交前检查脚本

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔍 Git 提交前检查${NC}\n"

# 检查是否有 .env 文件被跟踪
echo -e "${YELLOW}1. 检查敏感文件...${NC}"
ENV_FILES=$(git ls-files | grep -E "\.env$|\.env\." | grep -v ".env.example" || true)
if [ -n "$ENV_FILES" ]; then
    echo -e "${RED}❌ 发现 .env 文件被跟踪:${NC}"
    echo "$ENV_FILES"
    echo -e "${YELLOW}请从 git 中移除这些文件:${NC}"
    echo -e "  git rm --cached <file>"
    exit 1
else
    echo -e "${GREEN}✅ 没有 .env 文件被跟踪${NC}"
fi

# 检查是否有 node_modules 被跟踪
echo -e "\n${YELLOW}2. 检查 node_modules...${NC}"
NODE_MODULES=$(git ls-files | grep "node_modules" || true)
if [ -n "$NODE_MODULES" ]; then
    echo -e "${RED}❌ 发现 node_modules 被跟踪${NC}"
    echo -e "${YELLOW}请从 git 中移除:${NC}"
    echo -e "  git rm -r --cached node_modules"
    exit 1
else
    echo -e "${GREEN}✅ 没有 node_modules 被跟踪${NC}"
fi

# 检查是否有私钥文件
echo -e "\n${YELLOW}3. 检查私钥文件...${NC}"
PRIVATE_KEYS=$(git ls-files | grep -E "\.key$|\.pem$|\.p12$|\.pfx$" || true)
if [ -n "$PRIVATE_KEYS" ]; then
    echo -e "${RED}❌ 发现私钥文件被跟踪:${NC}"
    echo "$PRIVATE_KEYS"
    echo -e "${YELLOW}请从 git 中移除这些文件${NC}"
    exit 1
else
    echo -e "${GREEN}✅ 没有私钥文件被跟踪${NC}"
fi

# 检查是否有构建产物
echo -e "\n${YELLOW}4. 检查构建产物...${NC}"
BUILD_FILES=$(git ls-files | grep -E "^dist/|^build/|^out/|^\.next/" || true)
if [ -n "$BUILD_FILES" ]; then
    echo -e "${YELLOW}⚠️  发现构建产物被跟踪（通常应该被忽略）${NC}"
    echo "$BUILD_FILES" | head -5
    echo -e "${YELLOW}如果这些文件应该被忽略，请更新 .gitignore${NC}"
else
    echo -e "${GREEN}✅ 没有构建产物被跟踪${NC}"
fi

echo -e "\n${GREEN}✅ 所有检查通过${NC}\n"

