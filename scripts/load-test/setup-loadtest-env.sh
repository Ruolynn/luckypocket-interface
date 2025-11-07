#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
API_DIR="$ROOT_DIR/apps/api"
ENV_FILE="$API_DIR/.env.loadtest"

info()  { printf "\033[1;34m[INFO]\033[0m %s\n" "$*"; }
success(){ printf "\033[1;32m[SUCCESS]\033[0m %s\n" "$*"; }
warn()   { printf "\033[1;33m[WARN]\033[0m %s\n" "$*"; }
error()  { printf "\033[1;31m[ERROR]\033[0m %s\n" "$*"; }

require() {
  if ! command -v "$1" >/dev/null 2>&1; then
    error "未找到依赖: $1"
    exit 1
  fi
}

info "检查依赖..."
require docker
require pnpm

if [ ! -f "$ENV_FILE" ]; then
  error "未找到 $ENV_FILE，请先创建 .env.loadtest 文件"
  exit 1
fi

info "启动数据库与 Redis (docker compose)..."
cd "$ROOT_DIR"
DOCKER_COMPOSE_CMD="docker compose"
if ! $DOCKER_COMPOSE_CMD up -d postgres redis; then
  error "启动 postgres/redis 失败"
  exit 1
fi

POSTGRES_CONTAINER=$(docker ps --filter "name=postgres" --format "{{.ID}}" | head -n1)
if [ -n "$POSTGRES_CONTAINER" ]; then
  info "等待 PostgreSQL 就绪..."
  for _ in {1..30}; do
    if docker exec "$POSTGRES_CONTAINER" pg_isready >/dev/null 2>&1; then
      success "PostgreSQL 已就绪"
      break
    fi
    sleep 1
  done
else
  warn "未检测到 postgres 容器，跳过可用性检查"
fi

REDIS_CONTAINER=$(docker ps --filter "name=redis" --format "{{.ID}}" | head -n1)
if [ -n "$REDIS_CONTAINER" ]; then
  info "等待 Redis 就绪..."
  for _ in {1..30}; do
    if docker exec "$REDIS_CONTAINER" redis-cli ping >/dev/null 2>&1; then
      success "Redis 已就绪"
      break
    fi
    sleep 1
  done
else
  warn "未检测到 redis 容器，跳过可用性检查"
fi

info "安装依赖..."
pnpm install --filter @luckypocket/api

info "运行 prisma migrate deploy..."
cd "$API_DIR"
if command -v dotenv >/dev/null 2>&1; then
  dotenv -e .env.loadtest pnpm prisma migrate deploy
else
  warn "未检测到 dotenv-cli，将直接加载 .env.loadtest"
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
  pnpm prisma migrate deploy
fi

info "执行种子数据 (若已配置)..."
set +e
if command -v dotenv >/dev/null 2>&1; then
  dotenv -e .env.loadtest pnpm prisma db seed
else
  pnpm prisma db seed
fi
SEED_EXIT=$?
set -e
if [ $SEED_EXIT -ne 0 ]; then
  warn "Prisma seed 未配置或执行失败，已跳过"
fi

success "Loadtest 环境初始化完成！"
echo "下一步："
echo " 1. 启动 API： (cd apps/api && DISABLE_RATE_LIMIT=true pnpm dev --env-file=.env.loadtest)"
echo " 2. 启动前端或 Socket 服务"
echo " 3. 运行 scripts/load-test/run-load-test.sh 或自定义 k6 脚本"
