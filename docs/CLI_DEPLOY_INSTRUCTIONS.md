# Vercel CLI 部署指令 - 解决GitHub访问问题

## 🎯 问题
Vercel Dashboard无法访问GitHub仓库 `Zesty-Studio/HongBao`

## ✅ 解决方案：使用CLI直接部署

### 方法1: 使用部署脚本（最简单）

```bash
cd /Users/ruolynnchen/Codebase/luckyPocket
./scripts/deploy-cli.sh
```

### 方法2: 手动CLI部署

#### 步骤1: 确保已登录Vercel
```bash
npx vercel whoami
# 应该显示: ruolynn-4247
```

如果未登录：
```bash
npx vercel login
```

#### 步骤2: 从项目根目录部署
```bash
cd /Users/ruolynnchen/Codebase/luckyPocket

# 创建新项目并部署（交互式）
npx vercel
```

**回答提示问题**：
1. `Set up and deploy "~/Codebase/luckyPocket"?` → **Yes**
2. `Which scope do you want to deploy to?` → **ruolynn-4247's projects**
3. `Link to existing project?` → **No** (创建新项目)
4. `What's your project's name?` → **lucky-pocket**
5. `In which directory is your code located?` → **apps/web**
6. `Want to override the settings?` → **Yes**
7. `Which settings would you like to override?` → 选择所有选项
8. `Build Command?` → **pnpm install && pnpm --filter @luckypocket/web build**
9. `Output Directory?` → **.next**
10. `Install Command?` → **pnpm install**
11. `Development Command?` → **next dev**

#### 步骤3: 部署到生产环境
```bash
npx vercel --prod
```

---

## 🔧 如果遇到问题

### 问题1: "Cannot find module '@luckypocket/config'"

**解决**: 确保从项目根目录运行，不是从apps/web目录

```bash
# ✅ 正确
cd /Users/ruolynnchen/Codebase/luckyPocket
npx vercel

# ❌ 错误
cd /Users/ruolynnchen/Codebase/luckyPocket/apps/web
npx vercel
```

### 问题2: 构建命令失败

**解决**: 确保pnpm已安装并可用

```bash
# 检查pnpm
pnpm --version

# 如果未安装
npm install -g pnpm
```

### 问题3: 项目已存在

**解决**: 使用现有项目或删除.vercel目录

```bash
# 选项1: 使用现有项目
npx vercel link

# 选项2: 删除配置重新开始
rm -rf .vercel
npx vercel
```

---

## 📋 部署后配置

### 1. 设置环境变量

在Vercel Dashboard中：
- 进入项目设置 → Environment Variables
- 添加以下变量：

```
NEXT_PUBLIC_API_URL=<你的API地址>
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=<项目ID>
NEXT_PUBLIC_RED_PACKET_CONTRACT_ADDRESS=<合约地址>
NEXT_PUBLIC_CHAIN_ID=8453
NEXT_PUBLIC_MOCK_WALLET=false
```

### 2. 重新部署（应用环境变量）

```bash
npx vercel --prod
```

或在Dashboard中点击"Redeploy"

---

## 🚀 快速命令参考

```bash
# 部署到预览环境
npx vercel

# 部署到生产环境
npx vercel --prod

# 查看部署列表
npx vercel ls

# 查看项目信息
npx vercel inspect

# 查看日志
npx vercel logs
```

---

## ✅ 验证部署

部署成功后：

1. **访问部署URL**
   - CLI会显示部署URL
   - 或在Vercel Dashboard查看

2. **测试功能**
   - ✅ 页面加载
   - ✅ 钱包连接
   - ✅ API调用

---

## 📝 注意事项

1. **Monorepo配置**: 确保从项目根目录运行，vercel.json已配置正确
2. **构建时间**: 首次构建可能需要5-10分钟
3. **环境变量**: 部署后记得在Dashboard中配置环境变量
4. **自动部署**: 部署成功后，可以后续在Dashboard中配置Git集成

---

**需要帮助?** 查看: `docs/VERCEL_ACCESS_FIX.md`

