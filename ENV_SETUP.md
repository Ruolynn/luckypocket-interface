# 环境变量配置指南

本文档说明如何配置 HongBao 项目的环境变量。

## 目录结构

```
HongBao/
├── .env.example                    # Docker Compose 环境变量示例
├── apps/
│   ├── api/
│   │   └── .env.example           # API 后端环境变量示例
│   └── web/
│       └── .env.example            # Web 前端环境变量示例
└── docker-compose.yml              # Docker Compose 配置
```

## 快速开始

### 1. 复制环境变量文件

```bash
# 在项目根目录
cp .env.example .env

# 在 apps/api 目录
cd apps/api
cp .env.example .env

# 在 apps/web 目录
cd ../web
cp .env.example .env
```

### 2. 配置 Docker Compose 环境变量

编辑根目录的 `.env` 文件（用于 docker-compose）：

```bash
# PostgreSQL
POSTGRES_USER=hongbao
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=hongbao
POSTGRES_PORT=5432

# Redis
REDIS_PASSWORD=your_redis_password  # 留空则不使用密码
REDIS_PORT=6379
```

### 3. 配置 API 后端环境变量

编辑 `apps/api/.env` 文件：

**必需配置：**

```bash
# 数据库连接（与 docker-compose 配置一致）
DATABASE_URL=postgresql://hongbao:your_secure_password@localhost:5432/hongbao

# Redis 连接（与 docker-compose 配置一致）
# 如果 Redis 有密码：
REDIS_URL=redis://:your_redis_password@localhost:6379
# 如果 Redis 无密码：
REDIS_URL=redis://localhost:6379

# JWT 密钥（生产环境必须更改）
JWT_SECRET=your_very_long_and_secure_secret_key_min_32_chars

# 区块链 RPC URL
ETHEREUM_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY

# 合约地址
DEGIFT_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

**可选配置：**

```bash
# SIWE 配置
SIWE_DOMAIN=localhost
SIWE_STATEMENT=Sign in to HongBao dApp

# 代理钱包私钥（用于代理领取）
PROXY_WALLET_PRIVATE_KEY=0xYourPrivateKey

# ERC-4337 Paymaster（可选）
ENABLE_ERC4337_PAYMASTER=false

# Sentry 错误追踪（可选）
SENTRY_DSN=your_sentry_dsn

# Linear 集成（可选）
LINEAR_API_KEY=your_linear_api_key
LINEAR_TEAM_KEY=your_team_key
```

### 4. 配置 Web 前端环境变量

编辑 `apps/web/.env` 文件：

```bash
# API 地址
NEXT_PUBLIC_API_URL=http://localhost:3001

# WebSocket 地址
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

## 环境变量说明

### API 后端环境变量

| 变量名 | 必需 | 说明 | 默认值 |
|--------|------|------|--------|
| `NODE_ENV` | 否 | 运行环境 | `development` |
| `PORT` | 否 | API 端口 | `3001` |
| `DATABASE_URL` | 是 | PostgreSQL 连接字符串 | - |
| `REDIS_URL` | 是 | Redis 连接字符串 | `redis://localhost:6379` |
| `JWT_SECRET` | 是 | JWT 签名密钥 | - |
| `JWT_EXPIRES_IN` | 否 | JWT 过期时间 | `7d` |
| `SIWE_DOMAIN` | 是 | SIWE 域名 | `localhost` |
| `SIWE_STATEMENT` | 否 | SIWE 声明文本 | `Sign in to HongBao dApp` |
| `ETHEREUM_RPC_URL` | 是 | 以太坊 RPC 节点 URL | - |
| `DEGIFT_CONTRACT_ADDRESS` | 是 | DeGift 合约地址 | - |
| `RED_PACKET_CONTRACT_ADDRESS` | 否 | Red Packet 合约地址（兼容性） | - |
| `PROXY_WALLET_PRIVATE_KEY` | 否 | 代理钱包私钥 | - |
| `ENABLE_ERC4337_PAYMASTER` | 否 | 启用 ERC-4337 Paymaster | `false` |
| `TOKEN_BLACKLIST` | 否 | 代币黑名单（逗号分隔） | - |
| `SYNC_FROM_BLOCK` | 否 | 事件同步起始区块 | - |
| `WEB_URL` | 否 | Web 前端 URL | `http://localhost:3000` |
| `SENTRY_DSN` | 否 | Sentry DSN | - |
| `LINEAR_API_KEY` | 否 | Linear API 密钥 | - |
| `LINEAR_TEAM_KEY` | 否 | Linear 团队标识 | - |

### Web 前端环境变量

| 变量名 | 必需 | 说明 | 默认值 |
|--------|------|------|--------|
| `NEXT_PUBLIC_API_URL` | 是 | API 后端地址 | `http://localhost:3001` |
| `NEXT_PUBLIC_SOCKET_URL` | 是 | WebSocket 地址 | `http://localhost:3001` |

### Docker Compose 环境变量

| 变量名 | 必需 | 说明 | 默认值 |
|--------|------|------|--------|
| `POSTGRES_USER` | 否 | PostgreSQL 用户名 | `hongbao` |
| `POSTGRES_PASSWORD` | 否 | PostgreSQL 密码 | `hongbao_dev` |
| `POSTGRES_DB` | 否 | PostgreSQL 数据库名 | `hongbao` |
| `POSTGRES_PORT` | 否 | PostgreSQL 端口 | `5432` |
| `REDIS_PASSWORD` | 否 | Redis 密码（留空则不使用） | - |
| `REDIS_PORT` | 否 | Redis 端口 | `6379` |

## 安全注意事项

1. **永远不要提交 `.env` 文件到版本控制**
   - `.env` 文件已在 `.gitignore` 中
   - 只提交 `.env.example` 文件

2. **生产环境必须更改的变量：**
   - `JWT_SECRET`: 使用强随机密钥（至少 32 字符）
   - `POSTGRES_PASSWORD`: 使用强密码
   - `REDIS_PASSWORD`: 使用强密码（如果启用）
   - `PROXY_WALLET_PRIVATE_KEY`: 确保私钥安全

3. **API 密钥安全：**
   - 不要在代码中硬编码 API 密钥
   - 使用环境变量或密钥管理服务
   - 定期轮换密钥

## 验证配置

### 检查 Docker Compose 配置

```bash
# 启动服务
docker compose up -d

# 检查服务状态
docker compose ps

# 查看日志
docker compose logs postgres
docker compose logs redis
```

### 检查 API 配置

```bash
cd apps/api

# 检查环境变量
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL)"

# 测试数据库连接
pnpm prisma db pull

# 启动 API
pnpm dev
```

### 检查 Web 配置

```bash
cd apps/web

# 启动开发服务器
pnpm dev
```

## 常见问题

### 1. 数据库连接失败

- 检查 `DATABASE_URL` 格式是否正确
- 确认 PostgreSQL 服务已启动
- 检查用户名、密码、数据库名是否匹配

### 2. Redis 连接失败

- 检查 `REDIS_URL` 格式是否正确
- 确认 Redis 服务已启动
- 如果设置了密码，确保 URL 中包含密码

### 3. 区块链 RPC 连接失败

- 检查 `ETHEREUM_RPC_URL` 是否正确
- 确认 API 密钥有效
- 检查网络连接

### 4. JWT 验证失败

- 确认 `JWT_SECRET` 已设置且足够长（至少 32 字符）
- 生产环境必须更改默认密钥

## 更新日志

- 2024-01-XX: 初始版本，包含所有必需和可选环境变量

