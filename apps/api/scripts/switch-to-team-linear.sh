#!/bin/bash

# 切换到团队 Linear 配置脚本

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  接入团队 Linear 配置向导"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API_DIR="/Users/lushengqi/工作间/Github/HongBao/apps/api"
ENV_FILE="$API_DIR/.env"

# 步骤 1：获取 API 密钥
echo -e "${BLUE}步骤 1/4: 获取团队 Linear API 密钥${NC}"
echo ""
echo "请选择获取方式："
echo "  1) 我已有团队提供的 API 密钥"
echo "  2) 我需要自己创建 API 密钥"
echo ""
read -p "请选择 (1 或 2): " choice
echo ""

if [ "$choice" = "2" ]; then
  echo -e "${YELLOW}创建 API 密钥步骤：${NC}"
  echo "1. 访问: https://linear.app"
  echo "2. 登录您的团队账号"
  echo "3. 点击右上角设置 → Settings → API"
  echo "4. 点击 'Create key'"
  echo "5. 命名为: HongBao Project API"
  echo "6. 复制生成的密钥"
  echo ""
fi

echo -e "${YELLOW}请输入您的团队 Linear API 密钥：${NC}"
read -p "API Key: " NEW_API_KEY
echo ""

# 验证密钥格式
if [[ ! $NEW_API_KEY =~ ^lin_api_ ]]; then
  echo -e "${RED}❌ 错误：API 密钥应该以 'lin_api_' 开头${NC}"
  exit 1
fi

# 步骤 2：备份并更新配置
echo -e "${BLUE}步骤 2/4: 更新配置${NC}"
echo ""

# 备份当前 .env
if [ -f "$ENV_FILE" ]; then
  cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
  echo -e "${GREEN}✓ 已备份当前配置${NC}"
fi

# 更新 API 密钥
if grep -q "LINEAR_API_KEY=" "$ENV_FILE" 2>/dev/null; then
  # 如果存在，替换
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/LINEAR_API_KEY=.*/LINEAR_API_KEY=$NEW_API_KEY/" "$ENV_FILE"
  else
    sed -i "s/LINEAR_API_KEY=.*/LINEAR_API_KEY=$NEW_API_KEY/" "$ENV_FILE"
  fi
  echo -e "${GREEN}✓ 已更新 LINEAR_API_KEY${NC}"
else
  # 如果不存在，添加
  echo "LINEAR_API_KEY=$NEW_API_KEY" >> "$ENV_FILE"
  echo -e "${GREEN}✓ 已添加 LINEAR_API_KEY${NC}"
fi

echo ""

# 步骤 3：重启服务
echo -e "${BLUE}步骤 3/4: 重启 API 服务${NC}"
echo ""

# 停止旧服务
pkill -f "tsx watch" 2>/dev/null
sleep 2

# 启动服务
cd "$API_DIR"
pnpm dev > /tmp/hongbao-api.log 2>&1 &
sleep 5

# 检查服务状态
if curl -s http://localhost:3001/health > /dev/null; then
  echo -e "${GREEN}✓ API 服务启动成功${NC}"
else
  echo -e "${RED}❌ API 服务启动失败，请检查日志：${NC}"
  echo "   tail -f /tmp/hongbao-api.log"
  exit 1
fi

echo ""

# 步骤 4：获取团队信息
echo -e "${BLUE}步骤 4/4: 获取团队信息${NC}"
echo ""

echo "正在获取您的团队列表..."
echo ""

TEAMS=$(curl -s http://localhost:3001/api/linear/teams)

if echo "$TEAMS" | jq empty 2>/dev/null; then
  echo -e "${GREEN}✓ 成功连接到团队 Linear！${NC}"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo -e "${YELLOW}您的团队列表：${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  
  echo "$TEAMS" | jq -r '.[] | "团队名称: \(.name)\nTeam Key: \(.key)\nTeam ID:  \(.id)\n---"'
  
  # 保存团队信息到文件
  TEAM_INFO_FILE="$API_DIR/.linear-teams.json"
  echo "$TEAMS" | jq '.' > "$TEAM_INFO_FILE"
  echo ""
  echo -e "${GREEN}团队信息已保存到: .linear-teams.json${NC}"
  echo ""
  
  # 提示用户选择默认团队
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  read -p "是否要设置默认团队？(y/n): " set_default
  
  if [ "$set_default" = "y" ] || [ "$set_default" = "Y" ]; then
    echo ""
    echo "请从上面的列表中复制 Team ID："
    read -p "Team ID: " DEFAULT_TEAM_ID
    
    # 验证 Team ID
    if echo "$TEAMS" | jq -e --arg id "$DEFAULT_TEAM_ID" '.[] | select(.id == $id)' > /dev/null; then
      # 添加到 .env
      if grep -q "LINEAR_DEFAULT_TEAM_ID=" "$ENV_FILE" 2>/dev/null; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
          sed -i '' "s/LINEAR_DEFAULT_TEAM_ID=.*/LINEAR_DEFAULT_TEAM_ID=$DEFAULT_TEAM_ID/" "$ENV_FILE"
        else
          sed -i "s/LINEAR_DEFAULT_TEAM_ID=.*/LINEAR_DEFAULT_TEAM_ID=$DEFAULT_TEAM_ID/" "$ENV_FILE"
        fi
      else
        echo "LINEAR_DEFAULT_TEAM_ID=$DEFAULT_TEAM_ID" >> "$ENV_FILE"
      fi
      echo ""
      echo -e "${GREEN}✓ 默认团队已设置${NC}"
      
      TEAM_NAME=$(echo "$TEAMS" | jq -r --arg id "$DEFAULT_TEAM_ID" '.[] | select(.id == $id) | .name')
      echo -e "  默认团队: ${YELLOW}$TEAM_NAME${NC}"
    else
      echo -e "${RED}❌ 无效的 Team ID${NC}"
    fi
  fi
  
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo -e "${GREEN}🎉 团队 Linear 接入完成！${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  
  # 创建测试 Issue（可选）
  read -p "是否创建一个测试 Issue 验证集成？(y/n): " create_test
  
  if [ "$create_test" = "y" ] || [ "$create_test" = "Y" ]; then
    echo ""
    echo "请输入要创建测试 Issue 的 Team ID（按回车使用默认团队）："
    read -p "Team ID: " TEST_TEAM_ID
    
    if [ -z "$TEST_TEAM_ID" ] && [ ! -z "$DEFAULT_TEAM_ID" ]; then
      TEST_TEAM_ID="$DEFAULT_TEAM_ID"
    fi
    
    if [ ! -z "$TEST_TEAM_ID" ]; then
      echo ""
      echo "正在创建测试 Issue..."
      
      RESULT=$(curl -s -X POST http://localhost:3001/api/linear/issues \
        -H "Content-Type: application/json" \
        -d "{
          \"title\": \"✅ 团队 Linear 集成测试 - $(date '+%Y-%m-%d %H:%M:%S')\",
          \"description\": \"这是团队 Linear 集成的测试 Issue，由 HongBao API 自动创建。\",
          \"teamId\": \"$TEST_TEAM_ID\",
          \"priority\": 3
        }")
      
      if echo "$RESULT" | jq empty 2>/dev/null; then
        ISSUE_URL=$(echo "$RESULT" | jq -r '.url')
        ISSUE_ID=$(echo "$RESULT" | jq -r '.identifier')
        
        echo ""
        echo -e "${GREEN}✓ 测试 Issue 创建成功！${NC}"
        echo ""
        echo -e "Issue 编号: ${YELLOW}$ISSUE_ID${NC}"
        echo -e "访问链接: ${BLUE}$ISSUE_URL${NC}"
        echo ""
        echo "请访问上述链接或在团队 Linear 中查看此 Issue"
      else
        echo -e "${RED}❌ 创建测试 Issue 失败${NC}"
        echo "$RESULT" | jq '.'
      fi
    fi
  fi
  
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo -e "${BLUE}下一步：${NC}"
  echo ""
  echo "1. 访问您的团队 Linear 查看测试 Issue"
  echo "2. 查看文档: docs/接入团队Linear指南.md"
  echo "3. 开始在代码中使用 Linear API"
  echo ""
  echo "示例代码："
  echo '  import { getLinearService } from "./services/linear.service"'
  echo '  const linear = getLinearService()'
  echo '  await linear.createIssue({ title: "...", teamId: "..." })'
  echo ""
  
else
  echo -e "${RED}❌ 获取团队信息失败${NC}"
  echo ""
  echo "可能的原因："
  echo "1. API 密钥无效或已过期"
  echo "2. 您没有访问团队的权限"
  echo "3. 网络连接问题"
  echo ""
  echo "响应内容："
  echo "$TEAMS" | jq '.' 2>/dev/null || echo "$TEAMS"
  exit 1
fi

