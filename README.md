# 🧧 LuckyPocket dApp

Web3 Lucky Packet dApp on Base Chain - Supporting fixed and random amount packets with Farcaster Frames integration.

## 📋 Project Structure

```
luckyPocket/
├── apps/
│   ├── api/          # Fastify Backend API (Port 3001)
│   └── web/          # Next.js Frontend Application (Port 9000)
├── packages/
│   ├── contracts/    # Solidity Smart Contracts (Foundry)
│   ├── config/       # Shared Configurations (Tailwind, TypeScript)
│   └── ui/           # Shared UI Component Library
├── docs/             # Project Documentation
├── archive/          # Legacy Code Backups
└── design-refs/      # Design Reference Files
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose
- Foundry (for smart contracts)

### Quick Start (Recommended)

1. **启动 Docker 服务**
   ```bash
   docker compose up -d
   ```

2. **运行启动检查脚本**
   ```bash
   ./scripts/start-dev.sh
   ```

3. **启动服务**
   ```bash
   # 终端 1: 启动 API
   cd apps/api
   pnpm dev
   
   # 终端 2: 启动 Web
   cd apps/web
   pnpm dev
   ```

4. **访问应用**
   - Web: http://localhost:9000
   - API: http://localhost:3001

### Detailed Setup

详细的本地开发环境配置指南，请查看：
- [本地启动指南](./LOCAL_SETUP.md) - 完整的本地开发环境配置
- [环境变量配置](./ENV_SETUP.md) - 环境变量详细说明

### Manual Setup

**1. Environment Setup**

```bash
# 配置 API 环境变量
cd apps/api
# 创建 .env 文件（参考 ENV_SETUP.md）

# 配置 Web 环境变量
cd ../web
# 创建 .env.local 文件
```

**2. Install Dependencies**

```bash
pnpm install
```

**3. Database Initialization**

```bash
cd apps/api
pnpm prisma:generate
pnpm prisma:migrate
```

**4. Start Services**

Backend API:
```bash
cd apps/api
pnpm dev
# Running on http://localhost:3001
```

Frontend Web:
```bash
cd apps/web
pnpm dev
# Running on http://localhost:9000
```

## 📦 Deployment

### Smart Contracts

```bash
cd packages/contracts
forge build
forge script script/Deploy.s.sol:DeployScript --rpc-url $ETHEREUM_RPC_URL --broadcast --verify
```

**VRF Configuration (Random Packets)**:
- Current version uses development placeholder (`fulfillRandomForPacket` function, Owner manually fills)
- Production-ready Chainlink VRF integration available
- For production deployment:
  - Create VRF Subscription on target chain and fund it
  - Configure environment variables: `VRF_COORDINATOR`, `VRF_KEY_HASH`, `VRF_SUBSCRIPTION_ID`, `DEV_MODE`
  - Contract requests random number on `createPacket`, receives callback via `fulfillRandomWords`
  - Set `DEV_MODE=true` to enable Owner manual fallback (development)

### Docker Compose

```bash
docker-compose up -d
```

## 🧪 Testing

**Backend Tests:**
```bash
cd apps/api
pnpm test
```

**Smart Contract Tests:**
```bash
cd packages/contracts
forge test
```

**Frontend E2E Tests:**
```bash
cd apps/web
pnpm test:e2e
```

## 📚 Documentation

- [PRD Document](./docs/红包dApp-PRD.md)
- [Technical Implementation](./docs/技术落地方案-模块接口与伪代码.md)
- [Development Guidelines](./docs/开发规范-Cursor开发指南.md)

## 🎨 Frontend Features

### Completed Pages (12 Total)

**P0 Core Features:**
- ✅ Home Page (`/`)
- ✅ Create Lucky Packet (`/create`)
- ✅ Create Success Page (`/create/success`)
- ✅ Packet Details & Claim (`/packet/[id]`)
- ✅ User Dashboard (`/dashboard`)

**P1 Growth Features:**
- ✅ Leaderboards (`/leaderboards`)
- ✅ Settings (`/settings`)
- ✅ Notifications (`/notifications`)
- ✅ Invite System (`/invite`)
- ✅ Achievements (`/achievements`)
- ✅ Lucky Packet Rain (`/rain`)

### Design System
- **Primary Color**: `#FF4545`
- **Accent Color**: `#00B8D9`
- **Font**: Plus Jakarta Sans
- **Style**: Glassmorphism Design
- **Responsive**: Mobile-first approach

## 🛠️ Tech Stack

### Backend
- Fastify 4
- Prisma ORM
- PostgreSQL
- Redis
- Socket.IO
- SIWE (Sign-In with Ethereum)
- Viem

### Frontend
- Next.js 14 (App Router)
- React 18
- TypeScript
- Wagmi v2
- RainbowKit
- TanStack Query
- Zustand
- Tailwind CSS
- Framer Motion
- Socket.IO Client

### Smart Contracts
- Solidity 0.8.20
- Foundry
- OpenZeppelin
- Chainlink VRF (Random packets)

## 📡 Package Management

This is a pnpm workspace monorepo. All packages use `@luckypocket` scope:

- `@luckypocket/api` - Backend API application
- `@luckypocket/web` - Frontend web application
- `@luckypocket/config` - Shared configuration (Tailwind, TypeScript)
- `@luckypocket/ui` - Shared UI component library

## 🔧 Configuration

### Frontend (apps/web)
- **Port**: 9000
- **API URL**: http://localhost:3001
- **Mock Wallet Mode**: Enabled by default for development

### Backend (apps/api)
- **Port**: 3001
- **Database**: PostgreSQL (localhost:5432)
- **Redis**: localhost:6379

## 📝 Development Notes

### Mock Wallet Mode
The frontend includes a mock wallet mode for development without connecting an actual wallet:
- Set `NEXT_PUBLIC_MOCK_WALLET=true` in `apps/web/.env.local`
- Useful for UI development and testing

### API Integration
- Frontend is configured to connect to backend at `http://localhost:3001`
- WebSocket connection for real-time notifications
- SIWE authentication for wallet login

## 🔒 Security

### Environment Variables
- Never commit `.env` or `.env.local` files
- Always use `.env.example` as templates
- Store sensitive keys securely

### Smart Contracts
- Audited OpenZeppelin contracts
- Comprehensive test coverage
- Chainlink VRF for provably fair randomness

## 📊 Monitoring (Optional)

Backend supports optional Sentry integration:
- Set `SENTRY_DSN` environment variable
- Optional `SENTRY_TRACES_SAMPLE_RATE` (default: 0.1)
- Safe to run without Sentry configuration

## 🤝 Contributing

1. Create a feature branch from `main`
2. Follow existing code style and conventions
3. Write tests for new features
4. Update documentation as needed
5. Submit a pull request

## 📄 License

MIT

---

**Built with ❤️ by the LuckyPocket Team**
