# Linear 集成设置指南

## 第一步：获取 Linear API 密钥

1. 访问 [Linear](https://linear.app) 并登录您的账号

2. 点击右上角的头像或设置图标

3. 选择 **Settings** (设置)

4. 在左侧菜单中找到 **API** 选项

5. 点击 **Personal API keys** 部分的 **Create key** 按钮

6. 给密钥起一个描述性的名称，例如：`HongBao API Integration`

7. 复制生成的 API 密钥（格式类似：`lin_api_xxxxxxxxxxxxxxxxxxxxxxxxxx`）

⚠️ **重要**：这个密钥只会显示一次，请妥善保存！

## 第二步：配置环境变量

在您的 API 项目根目录下创建或编辑 `.env` 文件：

```bash
cd /Users/lushengqi/工作间/Github/HongBao/apps/api
```

添加或更新以下环境变量：

```bash
LINEAR_API_KEY=lin_api_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 第三步：获取 Team ID

在使用 Linear API 创建 Issue 之前，您需要知道 Team ID。有两种方法：

### 方法 1：使用 API 查询（推荐）

启动您的 API 服务器：

```bash
cd /Users/lushengqi/工作间/Github/HongBao/apps/api
pnpm dev
```

然后使用以下命令获取所有团队信息：

```bash
curl http://localhost:3001/api/linear/teams
```

您会看到类似这样的响应：

```json
[
  {
    "id": "e8c8e7d8-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "name": "Engineering",
    "key": "ENG"
  },
  {
    "id": "a1b2c3d4-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "name": "Product",
    "key": "PROD"
  }
]
```

记下您想要使用的团队的 `id`。

### 方法 2：从 Linear Web 界面获取

1. 在 Linear 中打开任意一个 Issue
2. 查看浏览器地址栏，URL 格式类似：`https://linear.app/your-workspace/issue/ENG-123/...`
3. 其中 `ENG` 就是 Team Key
4. 使用上面的 API 查询找到对应的 Team ID

## 第四步：测试集成

### 1. 测试获取团队列表

```bash
curl http://localhost:3001/api/linear/teams
```

### 2. 测试获取团队状态

使用您获取的 Team ID：

```bash
curl http://localhost:3001/api/linear/teams/YOUR_TEAM_ID/states
```

您会看到状态列表，例如：

```json
[
  {
    "id": "state-id-1",
    "name": "Backlog",
    "type": "backlog"
  },
  {
    "id": "state-id-2",
    "name": "Todo",
    "type": "unstarted"
  },
  {
    "id": "state-id-3",
    "name": "In Progress",
    "type": "started"
  },
  {
    "id": "state-id-4",
    "name": "Done",
    "type": "completed"
  }
]
```

### 3. 测试创建 Issue

如果您的 API 需要认证，请先获取 JWT token。然后：

```bash
curl -X POST http://localhost:3001/api/linear/issues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "测试 Issue - 来自 HongBao API",
    "description": "这是通过 API 创建的测试 Issue",
    "teamId": "YOUR_TEAM_ID",
    "priority": 2
  }'
```

**优先级说明**：
- 0 = 无优先级
- 1 = 紧急 (Urgent)
- 2 = 高 (High)
- 3 = 中 (Medium)
- 4 = 低 (Low)

如果不需要认证（测试环境），可以去掉 Authorization 头：

```bash
curl -X POST http://localhost:3001/api/linear/issues \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试 Issue",
    "description": "这是一个测试",
    "teamId": "YOUR_TEAM_ID"
  }'
```

成功后会返回创建的 Issue 信息，包括：
- Issue ID
- Issue URL（可以直接在浏览器中打开）
- Issue 标识符（如 ENG-123）

### 4. 测试搜索 Issue

```bash
curl "http://localhost:3001/api/linear/issues?query=测试&teamId=YOUR_TEAM_ID"
```

### 5. 测试更新 Issue

```bash
curl -X PATCH http://localhost:3001/api/linear/issues/ISSUE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "更新后的标题",
    "priority": 1
  }'
```

## 常见问题

### Q: API 返回 "LINEAR_API_KEY environment variable is not set"

**A**: 请确保：
1. 在 `.env` 文件中添加了 `LINEAR_API_KEY`
2. 重启了开发服务器（`pnpm dev`）
3. `.env` 文件在正确的位置（`apps/api/.env`）

### Q: API 返回 "Linear API error: ..."

**A**: 可能的原因：
1. API 密钥无效或已过期 - 请在 Linear 中检查
2. Team ID 不存在 - 请使用 `/api/linear/teams` 获取正确的 Team ID
3. 权限不足 - 检查您的 Linear 账号权限

### Q: 创建 Issue 需要认证吗？

**A**: 根据您的 `routes/linear.ts` 配置，创建和更新 Issue 的端点包含了认证中间件：
```typescript
preHandler: (app as any).authenticate ? [app.authenticate as any] : undefined
```

如果您的项目配置了 JWT 认证，则需要提供有效的 token。

### Q: 如何在代码中使用 Linear Service？

**A**: 在您的服务或路由中：

```typescript
import { getLinearService } from './services/linear.service'

// 在异步函数中使用
async function createTaskInLinear() {
  const linearService = getLinearService()
  
  const issue = await linearService.createIssue({
    title: '新任务',
    description: '任务描述',
    teamId: 'your-team-id',
    priority: 2
  })
  
  console.log('Issue created:', issue.url)
  return issue
}
```

## 下一步

集成成功后，您可以：

1. 在红包相关的业务逻辑中自动创建 Linear Issue
2. 当用户报告问题时，自动记录到 Linear
3. 将应用中的任务管理与 Linear 同步
4. 设置 webhook 监听 Linear 的变化（需要额外开发）

## 更多资源

- [Linear API 文档](https://developers.linear.app/docs/graphql/working-with-the-graphql-api)
- [Linear GraphQL Schema](https://studio.apollographql.com/public/Linear-API/home)

