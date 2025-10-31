# 🧧 HongBao dApp

Base 链上的社交红包 dApp - 支持固定金额和随机金额红包，集成 Farcaster Frames。

## 📋 项目结构

```
HongBao/
├── apps/
│   ├── api/          # Fastify 后端 API
│   └── web/          # Next.js 前端应用
├── packages/
│   └── contracts/    # Solidity 智能合约（Foundry）
└── docs/             # 项目文档
```

## 🚀 快速开始

### 前置要求

- Node.js 20+
- pnpm 8+
- PostgreSQL 14+
- Redis 7+
- Foundry (for contracts)

### 环境配置

1. 复制环境变量示例文件：
```bash
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local
```

2. 配置环境变量（见 `.env.example`）

### 安装依赖

```bash
pnpm install
```

### 数据库初始化

```bash
cd apps/api
pnpm prisma migrate dev
pnpm prisma generate
```

### 启动开发服务

**后端 API：**
```bash
cd apps/api
pnpm dev
```

**前端 Web：**
```bash
cd apps/web
pnpm dev
```

访问 http://localhost:3000

## 📦 部署

### 智能合约

```bash
cd packages/contracts
forge build
forge script script/Deploy.s.sol:DeployScript --rpc-url $ETHEREUM_RPC_URL --broadcast --verify
```

**VRF 配置说明（随机红包）**:
- 当前版本使用开发态占位实现（`fulfillRandomForPacket` 函数，Owner 手动回填）
- 现已接入 Chainlink VRF（合约层），生产环境需要：
  - 在目标链创建 VRF Subscription 并为其充值
  - 部署时配置环境变量：`VRF_COORDINATOR`, `VRF_KEY_HASH`, `VRF_SUBSCRIPTION_ID`, `DEV_MODE`
  - 合约在 `createPacket` 时请求随机，`fulfillRandomWords` 回填拆分数组；`DEV_MODE=true` 时仍支持 Owner 手动回填（开发态）

### Docker Compose

```bash
docker-compose up -d
```

## 🧪 测试

**后端测试：**
```bash
cd apps/api
pnpm test
```

**合约测试：**
```bash
cd packages/contracts
forge test
```

## 📚 文档

- [PRD 文档](./docs/红包dApp-PRD.md)
- [技术落地方案](./docs/技术落地方案-模块接口与伪代码.md)
- [开发规范](./docs/开发规范-Cursor开发指南.md)

## 🛠️ 技术栈

### 后端
- Fastify 4
- Prisma ORM
- PostgreSQL
- Redis
- Socket.IO
- SIWE (Sign-In with Ethereum)
- Viem

### 前端
- Next.js 14
- React 18
- Wagmi v2
- RainbowKit
- Tailwind CSS
- Socket.IO Client

### 合约
- Solidity 0.8.20
- Foundry
- OpenZeppelin
- Chainlink VRF（随机红包，当前为占位实现）

## 📝 License

MIT

## 📡 监控（Sentry）

后端支持可选的 Sentry 接入：

- 设置环境变量 `SENTRY_DSN`（可选 `SENTRY_TRACES_SAMPLE_RATE`，默认 0.1）
- 未安装 `@sentry/node` 或未配置 DSN 时自动跳过，不影响构建和运行
- 已接入全局错误捕获与基础请求标签，测试环境无需配置也可运行
