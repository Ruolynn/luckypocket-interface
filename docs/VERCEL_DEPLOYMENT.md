# Vercel 部署指南

## 项目信息

- **项目名称**: Lucky Pocket
- **框架**: Next.js 14
- **包管理器**: pnpm
- **Monorepo结构**: 是 (apps/web)

## 部署方式

### 方式1: 通过Vercel Dashboard (推荐)

1. **访问Vercel Dashboard**
   - 打开 https://vercel.com
   - 登录你的账户

2. **导入项目**
   - 点击 "Add New..." → "Project"
   - 选择 "Import Git Repository"
   - 选择 `Zesty-Studio/HongBao` 仓库

3. **配置项目**
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `pnpm install && pnpm --filter @luckypocket/web build`
   - **Output Directory**: `.next` (默认)
   - **Install Command**: `pnpm install`

4. **环境变量配置**
   在Vercel Dashboard中添加以下环境变量：
   ```
   NEXT_PUBLIC_API_URL=<你的后端API地址>
   NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=<你的WalletConnect项目ID>
   NEXT_PUBLIC_RED_PACKET_CONTRACT_ADDRESS=<合约地址>
   NEXT_PUBLIC_CHAIN_ID=8453
   NEXT_PUBLIC_MOCK_WALLET=false
   ```

5. **部署**
   - 点击 "Deploy"
   - 等待构建完成

---

### 方式2: 使用Vercel CLI

1. **安装Vercel CLI**
```bash
npm i -g vercel
```

2. **登录Vercel**
```bash
vercel login
```

3. **部署项目**
```bash
cd /Users/ruolynnchen/Codebase/luckyPocket

# 首次部署（会提示配置）
vercel

# 生产环境部署
vercel --prod
```

4. **配置项目设置**
   在首次部署时，Vercel会询问：
   - **Set up and deploy?** → Yes
   - **Which scope?** → 选择你的团队
   - **Link to existing project?** → No (创建新项目)
   - **Project name?** → `lucky-pocket`
   - **Directory?** → `apps/web`
   - **Override settings?** → Yes
   - **Build Command?** → `pnpm install && pnpm --filter @luckypocket/web build`
   - **Output Directory?** → `.next`
   - **Install Command?** → `pnpm install`
   - **Development Command?** → `pnpm --filter @luckypocket/web dev`

---

### 方式3: GitHub集成（自动部署）

1. **在Vercel Dashboard中启用Git集成**
   - 项目设置 → Git
   - 连接GitHub仓库
   - 选择分支（main）

2. **配置自动部署**
   - 每次推送到main分支会自动触发部署
   - 可以通过PR创建预览部署

---

## 配置文件

已创建的 `vercel.json` 配置文件：

```json
{
  "buildCommand": "pnpm install && pnpm --filter @luckypocket/web build",
  "outputDirectory": "apps/web/.next",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "rootDirectory": "apps/web"
}
```

---

## 环境变量

### 必需的环境变量

| 变量名 | 描述 | 示例值 |
|--------|------|--------|
| `NEXT_PUBLIC_API_URL` | 后端API地址 | `https://api.luckypocket.com` |
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | WalletConnect项目ID | `your-project-id` |
| `NEXT_PUBLIC_RED_PACKET_CONTRACT_ADDRESS` | 智能合约地址 | `0x...` |

### 可选的环境变量

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| `NEXT_PUBLIC_CHAIN_ID` | 链ID | `8453` (Base Mainnet) |
| `NEXT_PUBLIC_MOCK_WALLET` | 启用Mock钱包 | `false` |

### 在Vercel中设置环境变量

1. 进入项目设置 → Environment Variables
2. 添加每个变量
3. 选择环境（Production, Preview, Development）
4. 保存

---

## 构建配置

### Monorepo配置

由于这是一个pnpm monorepo，需要特殊配置：

- **Root Directory**: `apps/web` - 告诉Vercel项目根目录
- **Build Command**: `pnpm install && pnpm --filter @luckypocket/web build` - 使用pnpm workspace过滤器
- **Install Command**: `pnpm install` - 从根目录安装依赖

### 依赖安装

Vercel会自动：
1. 检测到 `pnpm-lock.yaml`
2. 使用 `pnpm install` 安装依赖
3. 从根目录安装所有workspace依赖

---

## 常见问题

### 1. 构建失败：找不到模块

**问题**: `Cannot find module '@luckypocket/config'`

**解决方案**:
- 确保 `vercel.json` 中 `rootDirectory` 设置为 `apps/web`
- 确保 `buildCommand` 从根目录运行
- 检查 `pnpm-workspace.yaml` 配置正确

### 2. 构建超时

**问题**: 构建时间超过最大限制

**解决方案**:
- 优化构建命令，减少不必要的步骤
- 使用 `.vercelignore` 排除不需要的文件
- 考虑使用Vercel的缓存功能

### 3. 环境变量未生效

**问题**: 环境变量在构建时未加载

**解决方案**:
- 确保变量名以 `NEXT_PUBLIC_` 开头（Next.js要求）
- 在Vercel Dashboard中重新设置环境变量
- 重新部署项目

---

## 部署后检查

1. **检查部署状态**
   - 访问 Vercel Dashboard
   - 查看最新部署日志

2. **测试功能**
   - 钱包连接
   - API调用
   - 页面加载

3. **检查域名**
   - 默认域名: `lucky-pocket-*.vercel.app`
   - 可以配置自定义域名

---

## 自定义域名

1. 在Vercel Dashboard中：
   - Settings → Domains
   - 添加自定义域名
   - 按照提示配置DNS

---

## 监控和日志

- **实时日志**: Vercel Dashboard → Deployments → 选择部署 → Logs
- **性能监控**: Analytics标签
- **错误追踪**: 可以集成Sentry

---

## 更新部署

### 自动更新
- 推送到main分支 → 自动触发生产部署
- 创建PR → 自动创建预览部署

### 手动更新
```bash
vercel --prod
```

---

## 回滚部署

1. 在Vercel Dashboard中
2. 进入Deployments页面
3. 找到要回滚的版本
4. 点击 "..." → "Promote to Production"

---

**最后更新**: 2025-11-04

