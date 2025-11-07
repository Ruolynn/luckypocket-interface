# Vercel 部署完整指南

## 📋 快速开始

### 方法 1: 使用 Vercel CLI (推荐)

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录 Vercel
vercel login

# 3. 从项目根目录部署
cd /Users/lushengqi/工作间/Github/HongBao
vercel

# 4. 按提示操作:
# - Set up and deploy? Yes
# - Which scope? 选择你的账户
# - Link to existing project? No
# - What's your project's name? lucky-pocket (或其他名称)
# - In which directory is your code located? apps/web
# - Want to override the settings? Yes
#   - Build Command: pnpm install && pnpm --filter @luckypocket/web build
#   - Output Directory: .next
#   - Development Command: pnpm dev

# 5. 部署到生产环境
vercel --prod
```

### 方法 2: 使用 Vercel Dashboard

1. **访问 Vercel Dashboard**
   - 登录 https://vercel.com
   - 点击 "Add New" → "Project"

2. **导入 GitHub 仓库**
   - 选择 "Import Git Repository"
   - 连接到 GitHub 账户
   - 选择 `Zesty-Studio/HongBao` 仓库

3. **配置项目设置**
   ```
   Framework Preset: Next.js
   Root Directory: apps/web
   Build Command: pnpm install && pnpm --filter @luckypocket/web build
   Output Directory: .next
   Install Command: pnpm install
   Node.js Version: 20.x
   ```

4. **配置环境变量** (点击 "Environment Variables")
   ```
   NEXT_PUBLIC_API_URL=https://your-api-domain.com
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
   NEXT_PUBLIC_RED_PACKET_CONTRACT_ADDRESS=0x40064c042f10bbc9c019589db8de7e52e1fb8460
   NEXT_PUBLIC_DEGIFT_CONTRACT_ADDRESS=0x40064c042f10bbc9c019589db8de7e52e1fb8460
   NEXT_PUBLIC_CHAIN_ID=11155111
   NEXT_PUBLIC_MOCK_WALLET=false
   ```

5. **部署**
   - 点击 "Deploy"
   - 等待构建完成

---

## 🔧 环境变量配置详解

### 必需环境变量

#### 1. NEXT_PUBLIC_API_URL
- **说明**: 后端 API 地址
- **开发环境**: `http://localhost:3001`
- **生产环境**:
  - 如果后端部署在 Railway: `https://your-app.railway.app`
  - 如果后端部署在 Render: `https://your-app.onrender.com`
  - 如果使用独立服务器: `https://api.yourdomain.com`

#### 2. NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
- **说明**: WalletConnect 项目 ID
- **获取方式**:
  1. 访问 https://cloud.walletconnect.com
  2. 创建新项目
  3. 复制 Project ID
- **示例**: `c4f79cc821944d9680842e34466bfbd`

#### 3. NEXT_PUBLIC_DEGIFT_CONTRACT_ADDRESS
- **说明**: DeGift 智能合约地址
- **当前部署**: `0x40064c042f10bbc9c019589db8de7e52e1fb8460` (Base Sepolia)
- **主网部署**: 待部署后更新

#### 4. NEXT_PUBLIC_CHAIN_ID
- **说明**: 区块链网络 ID
- **Sepolia Testnet**: `11155111`
- **Base Sepolia**: `84532`
- **Base Mainnet**: `8453`
- **默认**: `11155111` (Sepolia)

### 可选环境变量

#### NEXT_PUBLIC_MOCK_WALLET
- **说明**: 开发模式下启用模拟钱包
- **开发环境**: `true`
- **生产环境**: `false`

---

## 🚀 部署后检查清单

### 1. 验证部署状态
```bash
# 访问 Vercel 项目 URL
https://your-project.vercel.app

# 检查以下页面:
- [ ] 首页加载正常
- [ ] 钱包连接功能正常
- [ ] API 连接正常（检查浏览器控制台）
```

### 2. 检查环境变量
```bash
# 在浏览器控制台运行:
console.log({
  API_URL: process.env.NEXT_PUBLIC_API_URL,
  CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
  CONTRACT: process.env.NEXT_PUBLIC_DEGIFT_CONTRACT_ADDRESS
});
```

### 3. 测试核心功能
- [ ] 钱包连接/断开
- [ ] 创建礼物（如果后端已部署）
- [ ] 领取礼物
- [ ] 查看礼物详情

---

## 🐛 常见问题解决

### 问题 1: 构建失败 - "Cannot find module"
**原因**: pnpm workspace 依赖问题
**解决方案**:
```json
// 在 apps/web/package.json 中添加
"dependencies": {
  "@luckypocket/config": "workspace:*"
}
```

### 问题 2: 环境变量未生效
**原因**: 环境变量需要以 `NEXT_PUBLIC_` 开头才能在客户端访问
**解决方案**: 确保所有客户端变量都有 `NEXT_PUBLIC_` 前缀

### 问题 3: API 连接失败 (CORS)
**原因**: 后端未配置 CORS
**解决方案**: 在后端 API 添加 Vercel 域名到 CORS 白名单
```javascript
// apps/api/src/app.ts
fastify.register(cors, {
  origin: [
    'http://localhost:9000',
    'https://your-project.vercel.app',
    'https://*.vercel.app'  // 允许所有 Vercel 预览部署
  ]
});
```

### 问题 4: 构建时间过长
**原因**: Vercel 免费版有时间限制
**解决方案**:
1. 优化依赖项
2. 使用构建缓存
3. 考虑升级 Vercel Pro

---

## 📊 部署架构建议

### 推荐架构

```
┌─────────────────────────────────────┐
│  Frontend (Vercel)                  │
│  - Next.js App                      │
│  - Static Assets                    │
│  - Edge Functions                   │
└──────────────┬──────────────────────┘
               │
               │ HTTPS
               ▼
┌─────────────────────────────────────┐
│  Backend API (Railway/Render)       │
│  - Fastify Server                   │
│  - Socket.IO                        │
│  - Prisma ORM                       │
└──────────────┬──────────────────────┘
               │
      ┌────────┴────────┐
      │                 │
      ▼                 ▼
┌───────────┐    ┌──────────────┐
│ PostgreSQL│    │ Redis        │
│ (Supabase)│    │ (Railway)    │
└───────────┘    └──────────────┘
```

### 成本估算 (月费)

- **Vercel Hobby**: $0 (免费)
- **Railway Hobby**: $5
- **Supabase Free**: $0
- **总计**: ~$5/月

---

## 🔄 自动部署配置

### GitHub Actions (自动部署)

已配置文件: `.github/workflows/deploy.yml`

**触发条件**:
- Push to `main` 分支
- 创建 Pull Request

**配置 Secrets**:
在 GitHub 仓库设置中添加:
```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id
```

获取方式:
```bash
# 1. 生成 Vercel Token
# 访问 https://vercel.com/account/tokens

# 2. 获取 Org ID 和 Project ID
vercel link
# 查看 .vercel/project.json
```

---

## 📝 部署检查表

### 部署前
- [ ] 所有环境变量已准备
- [ ] WalletConnect Project ID 已创建
- [ ] 后端 API 已部署并可访问
- [ ] 智能合约已部署
- [ ] CORS 配置已更新

### 部署中
- [ ] Vercel 项目已创建
- [ ] Root Directory 设置为 `apps/web`
- [ ] Build Command 正确
- [ ] 环境变量已配置
- [ ] 首次部署成功

### 部署后
- [ ] 访问生产 URL 验证
- [ ] 检查所有页面加载
- [ ] 测试钱包连接
- [ ] 验证 API 通信
- [ ] 检查浏览器控制台无错误
- [ ] 配置自定义域名（可选）

---

## 🌐 自定义域名配置

1. **在 Vercel Dashboard 中**:
   - 进入项目设置
   - 点击 "Domains"
   - 添加自定义域名

2. **在域名提供商处**:
   - 添加 CNAME 记录
   - 指向 `cname.vercel-dns.com`

3. **等待 DNS 传播**:
   - 通常需要 5-30 分钟
   - 可以使用 `dig` 命令检查

```bash
dig your-domain.com
```

---

## 📞 获取帮助

- **Vercel 文档**: https://vercel.com/docs
- **Next.js 文档**: https://nextjs.org/docs
- **项目 Issues**: https://github.com/Zesty-Studio/HongBao/issues

---

**最后更新**: 2025-11-07
**维护者**: Arkel Lu
