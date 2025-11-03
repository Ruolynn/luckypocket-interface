#!/bin/bash

# Linear API 测试脚本
# 使用方法: ./scripts/test-linear.sh

API_URL="http://localhost:3001"
TEAM_ID="" # 从 /api/linear/teams 获取后填入

echo "=========================================="
echo "Linear API 集成测试"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. 测试获取团队列表
echo -e "${YELLOW}1. 测试获取团队列表${NC}"
echo "GET $API_URL/api/linear/teams"
echo ""
curl -s "$API_URL/api/linear/teams" | jq '.'
echo ""
echo ""

# 提示用户输入 Team ID
if [ -z "$TEAM_ID" ]; then
  echo -e "${YELLOW}请从上面的结果中复制一个 Team ID，然后输入：${NC}"
  read -p "Team ID: " TEAM_ID
  echo ""
fi

# 2. 测试获取团队状态
echo -e "${YELLOW}2. 测试获取团队状态${NC}"
echo "GET $API_URL/api/linear/teams/$TEAM_ID/states"
echo ""
curl -s "$API_URL/api/linear/teams/$TEAM_ID/states" | jq '.'
echo ""
echo ""

# 3. 测试创建 Issue（不需要认证的情况）
echo -e "${YELLOW}3. 测试创建 Issue${NC}"
echo "POST $API_URL/api/linear/issues"
echo ""

RESPONSE=$(curl -s -X POST "$API_URL/api/linear/issues" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"测试 Issue - $(date '+%Y-%m-%d %H:%M:%S')\",
    \"description\": \"这是通过测试脚本创建的 Issue\",
    \"teamId\": \"$TEAM_ID\",
    \"priority\": 2
  }")

echo "$RESPONSE" | jq '.'
echo ""

# 提取 Issue ID 和 URL
ISSUE_ID=$(echo "$RESPONSE" | jq -r '.id // empty')
ISSUE_URL=$(echo "$RESPONSE" | jq -r '.url // empty')

if [ -n "$ISSUE_ID" ]; then
  echo -e "${GREEN}✓ Issue 创建成功！${NC}"
  echo "Issue ID: $ISSUE_ID"
  echo "Issue URL: $ISSUE_URL"
  echo ""
  
  # 4. 测试获取 Issue 详情
  echo -e "${YELLOW}4. 测试获取 Issue 详情${NC}"
  echo "GET $API_URL/api/linear/issues/$ISSUE_ID"
  echo ""
  curl -s "$API_URL/api/linear/issues/$ISSUE_ID" | jq '.'
  echo ""
  echo ""
  
  # 5. 测试搜索 Issue
  echo -e "${YELLOW}5. 测试搜索 Issue${NC}"
  echo "GET $API_URL/api/linear/issues?query=测试&teamId=$TEAM_ID"
  echo ""
  curl -s "$API_URL/api/linear/issues?query=测试&teamId=$TEAM_ID" | jq '.'
  echo ""
  
else
  echo -e "${RED}✗ Issue 创建失败${NC}"
  echo "请检查："
  echo "1. API 服务是否正常运行"
  echo "2. LINEAR_API_KEY 环境变量是否正确配置"
  echo "3. Team ID 是否有效"
fi

echo ""
echo "=========================================="
echo "测试完成"
echo "=========================================="

