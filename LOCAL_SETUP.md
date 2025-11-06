# 本地开发环境启动指南

本文档说明如何在本地启动 HongBao 项目的完整开发环境。

## 前置要求

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose
- PostgreSQL 客户端（可选，用于直接连接数据库）
- Redis 客户端（可选，用于直接连接 Redis）

## 快速启动步骤

### 1. 启动 Docker 服务（PostgreSQL + Redis）

```bash
# 在项目根目录
docker compose up -d

# 检查服务状态
docker compose ps

# 查看日志
docker compose logs -f
```

### 2. 配置环境变量

#### 2.1 配置 API 后端

在 `apps/api` 目录创建 `.env` 文件：

```bash
cd apps/api
cp .env.example .env  # 如果存在
```

编辑 `.env` 文件，至少配置以下必需变量：

```bash
# 数据库连接（与 docker-compose 配置一致）
DATABASE_URL=postgresql://hongbao:hongbao_dev@localhost:5432/hongbao

# Redis 连接（如果 Redis 没有密码）
REDIS_URL=redis://localhost:6379

# JWT 密钥（必须更改）
JWT_SECRET=your_very_long_and_secure_secret_key_min_32_chars

# 区块链 RPC
ETHEREUM_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY

# 合约地址
DEGIFT_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

#### 2.2 配置 Web 前端

在 `apps/web` 目录创建 `.env.local` 文件：

```bash
cd ../web
```

创建 `.env.local` 文件：

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

### 3. 安装依赖

```bash
# 在项目根目录
pnpm install
```

### 4. 初始化数据库

```bash
# 进入 API 目录
cd apps/api

# 生成 Prisma Client
pnpm prisma:generate

# 运行数据库迁移
pnpm prisma:migrate

# 或者使用 db push（开发环境）
pnpm prisma db push
```

### 5. 启动服务

#### 5.1 启动 API 后端

```bash
# 在 apps/api 目录
pnpm dev
```

API 将在 `http://localhost:3001` 启动。

验证 API 是否正常运行：

```bash
curl http://localhost:3001/health
```

应该返回：
```json
{"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}
```

#### 5.2 启动 Web 前端

打开新的终端窗口：

```bash
# 在 apps/web 目录
cd apps/web
pnpm dev
```

Web 应用将在 `http://localhost:9000` 启动。

### 6. 验证服务

1. **检查 Docker 服务**
   ```bash
   docker compose ps
   ```
   应该看到 `hongbao-postgres` 和 `hongbao-redis` 都在运行。

2. **检查 API 健康状态**
   ```bash
   curl http://localhost:3001/health
   ```

3. **检查数据库连接**
   ```bash
   cd apps/api
   pnpm prisma db pull
   ```

4. **检查 Redis 连接**
   ```bash
   redis-cli ping
   # 或
   docker compose exec redis redis-cli ping
   ```

## 测试创建和领取红包流程

### 1. 准备测试钱包

- 确保测试钱包有足够的 Sepolia ETH
- 确保测试钱包已连接到前端应用

### 2. 创建红包

1. 打开 `http://localhost:9000`
2. 连接钱包
3. 进入创建页面
4. 填写红包信息：
   - 接收者地址
   - 代币类型（ETH 或 ERC20）
   - 金额
   - 过期时间
   - 祝福语（可选）
5. 提交交易
6. 等待交易确认

### 3. 领取红包

1. 使用接收者钱包连接
2. 访问红包详情页：`http://localhost:9000/packet/{giftId}`
3. 点击"领取"按钮
4. 确认交易
5. 等待交易确认

### 4. 验证数据

检查数据库中的记录：

```bash
cd apps/api
pnpm prisma studio
```

这将打开 Prisma Studio，可以在浏览器中查看数据库记录。

## 常见问题排查

### 问题 1: Docker 服务无法启动

**症状：** `docker compose up -d` 失败

**解决方案：**
1. 检查 Docker 是否运行：`docker ps`
2. 检查端口是否被占用：
   ```bash
   lsof -i :5432  # PostgreSQL
   lsof -i :6379  # Redis
   ```
3. 查看详细错误：`docker compose logs`

### 问题 2: 数据库连接失败

**症状：** API 启动时报错 "Can't reach database server"

**解决方案：**
1. 确认 PostgreSQL 容器运行：`docker compose ps postgres`
2. 检查 `DATABASE_URL` 是否正确
3. 测试连接：
   ```bash
   docker compose exec postgres psql -U hongbao -d hongbao -c "SELECT 1;"
   ```

### 问题 3: Redis 连接失败

**症状：** API 启动时报错 "Redis connection failed"

**解决方案：**
1. 确认 Redis 容器运行：`docker compose ps redis`
2. 检查 `REDIS_URL` 是否正确
3. 如果设置了密码，确保 URL 中包含密码
4. 测试连接：
   ```bash
   docker compose exec redis redis-cli ping
   ```

### 问题 4: Prisma 迁移失败

**症状：** `pnpm prisma:migrate` 报错

**解决方案：**
1. 确认数据库服务已启动
2. 检查 `DATABASE_URL` 是否正确
3. 尝试重置数据库（**注意：会删除所有数据**）：
   ```bash
   pnpm prisma migrate reset
   ```

### 问题 5: API 启动失败

**症状：** `pnpm dev` 报错

**解决方案：**
1. 检查所有必需的环境变量是否已设置
2. 检查端口 3001 是否被占用：`lsof -i :3001`
3. 查看详细错误日志
4. 确认依赖已安装：`pnpm install`

### 问题 6: Web 前端无法连接 API

**症状：** 前端显示 "Failed to fetch"

**解决方案：**
1. 确认 API 服务已启动：`curl http://localhost:3001/health`
2. 检查 `NEXT_PUBLIC_API_URL` 是否正确
3. 检查 CORS 配置（API 应该允许前端域名）
4. 检查浏览器控制台的错误信息

### 问题 7: 区块链交易失败

**症状：** 创建或领取红包时交易失败

**解决方案：**
1. 确认 `ETHEREUM_RPC_URL` 正确且可访问
2. 确认钱包有足够的 ETH（用于 gas）
3. 确认合约地址正确
4. 检查 Sepolia 网络是否可用
5. 查看交易详情（使用 Etherscan Sepolia）

## 开发工作流

### 热重载

- **API**: 使用 `tsx watch`，代码更改会自动重启
- **Web**: Next.js 自动热重载

### 数据库变更

1. 修改 `apps/api/prisma/schema.prisma`
2. 创建迁移：`pnpm prisma:migrate dev --name your_migration_name`
3. 或使用 `pnpm prisma db push`（开发环境，不创建迁移文件）

### 查看日志

- **API**: 查看终端输出
- **Docker**: `docker compose logs -f [service_name]`
- **数据库**: `docker compose logs -f postgres`
- **Redis**: `docker compose logs -f redis`

## 停止服务

```bash
# 停止 API 和 Web（Ctrl+C）

# 停止 Docker 服务
docker compose down

# 停止并删除数据卷（**注意：会删除所有数据**）
docker compose down -v
```

## 重置开发环境

如果需要完全重置：

```bash
# 1. 停止所有服务
docker compose down -v

# 2. 删除 node_modules（可选）
rm -rf node_modules apps/*/node_modules

# 3. 重新安装依赖
pnpm install

# 4. 重新启动 Docker
docker compose up -d

# 5. 重新初始化数据库
cd apps/api
pnpm prisma:generate
pnpm prisma:migrate

# 6. 重新启动服务
pnpm dev  # API
# 新终端
cd apps/web
pnpm dev  # Web
```

## 下一步

- 查看 [API 文档](./apps/api/README.md)
- 查看 [环境变量配置](./ENV_SETUP.md)
- 查看 [项目文档](./docs/)

