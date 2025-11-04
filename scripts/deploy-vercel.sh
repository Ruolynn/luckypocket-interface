#!/bin/bash
# Vercel部署脚本

set -e

echo "🚀 开始部署Lucky Pocket到Vercel..."

# 检查是否在项目根目录
if [ ! -f "vercel.json" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 检查是否已登录Vercel
if ! npx vercel whoami &>/dev/null; then
    echo "📝 需要登录Vercel..."
    npx vercel login
fi

echo "📦 开始部署..."
echo ""
echo "配置说明:"
echo "- 项目名称: lucky-pocket"
echo "- 根目录: apps/web"
echo "- 框架: Next.js"
echo ""

# 部署到生产环境
npx vercel --prod

echo ""
echo "✅ 部署完成!"
echo ""
echo "📋 下一步:"
echo "1. 在Vercel Dashboard中配置环境变量"
echo "2. 检查部署日志"
echo "3. 访问部署URL测试功能"
echo ""
echo "环境变量列表请查看: docs/VERCEL_DEPLOYMENT.md"

