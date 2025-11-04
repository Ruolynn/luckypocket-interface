#!/bin/bash
# Vercel CLI直接部署脚本（绕过GitHub集成问题）

set -e

echo "🚀 使用Vercel CLI部署Lucky Pocket..."
echo ""

# 检查是否在项目根目录
if [ ! -f "vercel.json" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 检查是否已登录
if ! npx vercel whoami &>/dev/null; then
    echo "📝 需要登录Vercel..."
    npx vercel login
fi

echo "✅ 已登录Vercel"
echo ""

# 检查是否已有.vercel项目配置
if [ -d ".vercel" ]; then
    echo "📋 发现现有项目配置"
    read -p "是否使用现有配置? (y/n): " use_existing
    if [ "$use_existing" != "y" ]; then
        echo "🗑️  删除现有配置..."
        rm -rf .vercel
    fi
fi

echo ""
echo "📦 开始部署配置..."
echo ""
echo "⚠️  以下配置将用于部署:"
echo "   - 项目名称: lucky-pocket"
echo "   - 根目录: apps/web"
echo "   - 框架: Next.js"
echo "   - 构建命令: pnpm install && pnpm --filter @luckypocket/web build"
echo ""

# 从项目根目录部署，但指定apps/web为根目录
echo "🔨 执行部署..."
echo ""

# 使用vercel命令，它会读取vercel.json配置
npx vercel --prod --yes

echo ""
echo "✅ 部署完成!"
echo ""
echo "📋 下一步:"
echo "1. 在Vercel Dashboard中配置环境变量"
echo "2. 访问部署URL测试功能"
echo "3. 查看部署日志确认构建成功"
echo ""
echo "环境变量列表请查看: docs/VERCEL_DEPLOYMENT.md"

