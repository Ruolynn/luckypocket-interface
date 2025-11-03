# @hongbao/api

运行指南（本地）

1. 环境变量
- NODE_ENV=development
- PORT=3001
- DATABASE_URL=postgresql://postgres:password@localhost:5432/hongbao
- REDIS_URL=redis://localhost:6379
- JWT_SECRET=replace_with_strong_secret
- SIWE_DOMAIN=localhost
- SIWE_STATEMENT=Sign in to HongBao dApp
- RATE_LIMIT_WINDOW_MS=60000
- RATE_LIMIT_MAX=120
- CHAIN_ID=11155111
- RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your_key
- LINEAR_API_KEY=lin_api_xxxxx (Linear API密钥，用于Linear集成)

2. 安装与生成
```bash
pnpm install
pnpm prisma:generate
```

3. 数据库迁移
```bash
pnpm prisma:migrate
```

4. 开发启动
```bash
pnpm dev
```

5. 生产构建与启动
```bash
pnpm build
pnpm start
```

## Linear集成

本项目已集成Linear API，可以通过以下API端点与Linear交互：

### API端点

- `POST /api/linear/issues` - 创建Issue
- `GET /api/linear/issues` - 搜索Issues (需要query参数)
- `GET /api/linear/issues/:issueId` - 获取Issue详情
- `PATCH /api/linear/issues/:issueId` - 更新Issue
- `GET /api/linear/teams` - 获取所有团队
- `GET /api/linear/teams/:teamId/states` - 获取团队的状态列表

### 获取Linear API密钥

1. 登录Linear
2. 进入 Settings > API
3. 创建新的Personal API Key
4. 将密钥添加到环境变量 `LINEAR_API_KEY`

### 示例：创建Issue

```bash
curl -X POST http://localhost:3001/api/linear/issues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_jwt_token>" \
  -d '{
    "title": "新功能需求",
    "description": "这是一个示例Issue",
    "teamId": "<team_id>",
    "priority": 2
  }'
```
