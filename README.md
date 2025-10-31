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

## 📝 License

MIT
