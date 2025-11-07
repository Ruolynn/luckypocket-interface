#!/bin/bash
# Quick script to show DeGift project status summary

echo "================================================================================"
echo "           DeGift 项目状态快速查看"
echo "================================================================================"
echo ""
echo "报告文件位置:"
echo "• Markdown 详细报告: /Users/lushengqi/工作间/Github/HongBao/degift-project-status-report.md"
echo "• JSON 摘要: /Users/lushengqi/工作间/Github/HongBao/degift-project-status-summary.json"
echo ""
echo "================================================================================"
echo "任务快速列表 (从 tasks.linear.json):"
echo "================================================================================"
echo ""

cd "$(dirname "$0")"

if [ -f "tasks.linear.json" ]; then
  node -e "
    const tasks = require('./tasks.linear.json');
    tasks.forEach((task, i) => {
      console.log(\`\${i+1}. \${task.title}\`);
      console.log(\`   📝 \${task.description}\`);
      console.log('');
    });
  "
else
  echo "❌ tasks.linear.json not found"
fi

echo "================================================================================"
echo "已创建的 Linear Issues (从 tasks.linear.result.json):"
echo "================================================================================"
echo ""

if [ -f "tasks.linear.result.json" ]; then
  node -e "
    const results = require('./tasks.linear.result.json');
    results.forEach((result, i) => {
      console.log(\`\${i+1}. \${result.title}\`);
      console.log(\`   🔗 \${result.url}\`);
      console.log('');
    });
    console.log(\`总计: \${results.length} 个 issues 已创建\`);
  "
else
  echo "ℹ️  tasks.linear.result.json not found (issues 尚未同步到 Linear)"
fi

echo ""
echo "================================================================================"
echo "更新 Linear API 状态的步骤:"
echo "================================================================================"
echo ""
echo "1. 生成新的 API key:"
echo "   https://linear.app/settings/api"
echo ""
echo "2. 更新环境变量:"
echo "   编辑 apps/api/.env 文件"
echo "   LINEAR_API_KEY=lin_api_YOUR_NEW_KEY"
echo ""
echo "3. 更新 GitHub Secrets (用于 CI/CD):"
echo "   https://github.com/YOUR_REPO/settings/secrets/actions"
echo ""
echo "4. 获取实时项目状态:"
echo "   cd apps/api"
echo "   npx tsx scripts/get-project-status.ts 90e7347d4faa"
echo ""
echo "================================================================================"
