#!/bin/bash

# 压力测试启动脚本 - 自动禁用速率限制

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

API_URL="${API_URL:-http://localhost:3001}"

echo -e "${BLUE}🚀 启动压力测试${NC}\n"

# 检查 API 服务
echo -e "${YELLOW}🔍 检查 API 服务...${NC}"
if curl -s "${API_URL}/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API 服务正在运行${NC}\n"
else
    echo -e "${RED}❌ API 服务未运行${NC}"
    echo -e "${YELLOW}请先启动 API 服务:${NC}"
    echo -e "  cd apps/api"
    echo -e "  DISABLE_RATE_LIMIT=true pnpm dev"
    exit 1
fi

# 提示用户禁用速率限制
echo -e "${YELLOW}⚠️  重要提示:${NC}"
echo -e "为了获得准确的测试结果，建议在启动 API 服务时禁用速率限制:"
echo -e "  ${BLUE}DISABLE_RATE_LIMIT=true pnpm dev${NC}"
echo -e ""
read -p "是否已禁用速率限制？(y/n): " confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo -e "${YELLOW}⚠️  建议先禁用速率限制，否则测试结果可能不准确${NC}"
    echo -e "按 Enter 继续，或 Ctrl+C 取消..."
    read
fi

echo ""
echo -e "${GREEN}请选择要执行的压测场景：${NC}"
echo -e "  1) API 基线 (k6-api-test.js)"
echo -e "  2) WebSocket 通道 (k6-websocket-test.js)"
echo -e "  3) 创建礼物业务链路 (k6-create-gift.js)"
echo -e "  4) 领取礼物业务链路 (k6-claim-gift.js)"
echo -e "  5) Frame 领取链路 (k6-frame-claim.js)"
echo -e "  6) 全部依次执行"
echo -e "  0) 退出"

read -p "请输入选项编号: " choice

run_k6() {
  local script="$1"
  shift
  echo -e "\n${BLUE}▶️  运行 ${script}${NC}"
  k6 run --env API_URL="${API_URL}" "$@" "${script}"
}

case "$choice" in
  1)
    run_k6 scripts/load-test/k6-api-test.js
    ;;
  2)
    run_k6 scripts/load-test/k6-websocket-test.js
    ;;
  3)
    echo -e "${YELLOW}提示：需提前配置 JWT_SECRET/SENDER_USER_ID/SENDER_ADDRESS 等变量${NC}"
    run_k6 scripts/load-test/k6-create-gift.js
    ;;
  4)
    echo -e "${YELLOW}提示：需提前准备待领取的礼物与对应用户信息${NC}"
    run_k6 scripts/load-test/k6-claim-gift.js
    ;;
  5)
    echo -e "${YELLOW}提示：需在 FRAME_TARGETS 中配置 packetId:fid 列表${NC}"
    run_k6 scripts/load-test/k6-frame-claim.js
    ;;
  6)
    run_k6 scripts/load-test/k6-api-test.js
    run_k6 scripts/load-test/k6-websocket-test.js
    run_k6 scripts/load-test/k6-create-gift.js
    run_k6 scripts/load-test/k6-claim-gift.js
    run_k6 scripts/load-test/k6-frame-claim.js
    ;;
  0)
    echo -e "${YELLOW}已取消压测${NC}"
    exit 0
    ;;
  *)
    echo -e "${RED}无效的选项${NC}"
    exit 1
    ;;
esac

echo -e "\n${GREEN}✅ 测试完成${NC}"

