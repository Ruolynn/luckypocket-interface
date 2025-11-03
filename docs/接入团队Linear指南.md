# 接入团队 Linear 指南

## 📋 前提条件

1. 您已被邀请加入团队的 Linear 工作区
2. 您有访问团队项目的权限
3. 您可以创建 API 密钥（或团队管理员提供）

---

## 🔑 步骤 1：获取团队 Linear API 密钥

### 选项 A：向团队管理员索要 API 密钥（推荐）

如果您的团队已经有共享的 API 密钥：

```
1. 联系团队管理员
2. 请求获取 Linear API 密钥
3. 获得密钥后，跳到步骤 2
```

**优点**：统一管理，权限清晰

### 选项 B：创建自己的 API 密钥

如果您有权限，可以自己创建：

1. **登录团队的 Linear**
   - 访问：https://linear.app
   - 使用您的团队账号登录

2. **进入 API 设置**
   - 点击右上角头像/设置图标
   - 选择 **Settings**（设置）
   - 在左侧菜单找到 **API**

3. **创建 Personal API Key**
   - 点击 **Personal API keys** 部分的 **Create key**
   - 名称建议：`HongBao Project API`
   - 点击创建

4. **复制密钥**
   - ⚠️ 密钥只显示一次，立即复制保存
   - 格式：`lin_api_xxxxxxxxxxxxxxxxxxxxx`

---

## 🔧 步骤 2：更新项目配置

### 更新环境变量

```bash
cd /Users/lushengqi/工作间/Github/HongBao/apps/api

# 备份当前配置（可选）
cp .env .env.backup

# 更新 API 密钥
# 方式 1：使用命令行
sed -i '' 's/LINEAR_API_KEY=.*/LINEAR_API_KEY=你的新密钥/' .env

# 方式 2：手动编辑
nano .env
# 或
vim .env
# 或
code .env
```

在 `.env` 文件中修改这一行：
```bash
LINEAR_API_KEY=lin_api_你的团队密钥
```

保存文件。

---

## 🎯 步骤 3：获取团队信息

### 重启 API 服务

```bash
cd /Users/lushengqi/工作间/Github/HongBao/apps/api

# 停止当前服务（如果在运行）
# Ctrl + C 或
pkill -f "tsx watch"

# 重新启动
pnpm dev
```

### 获取团队列表

```bash
curl http://localhost:3001/api/linear/teams | jq
```

**示例输出**：
```json
[
  {
    "id": "team-uuid-1",
    "name": "Engineering",
    "key": "ENG"
  },
  {
    "id": "team-uuid-2",
    "name": "Product",
    "key": "PROD"
  },
  {
    "id": "team-uuid-3",
    "name": "Design",
    "key": "DES"
  }
]
```

**记录您需要使用的团队 ID** 📝

---

## 📝 步骤 4：测试团队集成

### 1. 查看团队状态

使用您的团队 ID：

```bash
TEAM_ID="你的团队ID"

curl "http://localhost:3001/api/linear/teams/$TEAM_ID/states" | jq
```

### 2. 创建测试 Issue

```bash
TEAM_ID="你的团队ID"

curl -X POST http://localhost:3001/api/linear/issues \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"测试：HongBao API 集成\",
    \"description\": \"这是测试团队 Linear 集成的 Issue\",
    \"teamId\": \"$TEAM_ID\",
    \"priority\": 3
  }" | jq
```

### 3. 在 Linear 中验证

创建成功后：
1. 访问返回的 URL 链接
2. 或在团队的 Linear 工作区中查看新创建的 Issue
3. 确认 Issue 出现在正确的团队中

---

## 🎨 步骤 5：配置常用团队 ID（可选）

为了方便使用，可以将常用的团队 ID 保存到环境变量：

编辑 `.env` 文件，添加：

```bash
# Linear 团队配置
LINEAR_DEFAULT_TEAM_ID=你的默认团队ID
LINEAR_ENG_TEAM_ID=工程团队ID
LINEAR_PROD_TEAM_ID=产品团队ID
```

---

## 🔄 多团队场景

如果您的组织有多个团队，可以：

### 在代码中动态选择团队

```typescript
import { getLinearService } from './services/linear.service'

async function createIssueForTeam(teamName: string, issueData: any) {
  const linearService = getLinearService()
  
  // 获取所有团队
  const teams = await linearService.getTeams()
  
  // 查找特定团队
  const team = teams.find(t => t.name === teamName || t.key === teamName)
  
  if (!team) {
    throw new Error(`Team ${teamName} not found`)
  }
  
  // 为该团队创建 Issue
  return await linearService.createIssue({
    ...issueData,
    teamId: team.id
  })
}

// 使用示例
await createIssueForTeam('Engineering', {
  title: 'Bug: 用户登录问题',
  priority: 1
})
```

---

## 🎯 实际应用场景

### 场景 1：不同类型的问题创建到不同团队

```typescript
async function reportIssue(type: 'bug' | 'feature' | 'design', details: any) {
  const linearService = getLinearService()
  
  // 根据类型选择团队
  const teamMapping = {
    bug: process.env.LINEAR_ENG_TEAM_ID,
    feature: process.env.LINEAR_PROD_TEAM_ID,
    design: process.env.LINEAR_DESIGN_TEAM_ID,
  }
  
  const teamId = teamMapping[type]
  
  return await linearService.createIssue({
    title: `[${type.toUpperCase()}] ${details.title}`,
    description: details.description,
    teamId: teamId!,
    priority: type === 'bug' ? 1 : 2
  })
}
```

### 场景 2：红包相关问题自动创建到工程团队

```typescript
// 在红包创建失败时
async function handlePacketCreationError(error: Error, packetData: any) {
  const linearService = getLinearService()
  
  const issue = await linearService.createIssue({
    title: `红包创建失败: ${error.message}`,
    description: `
      错误详情: ${error.stack}
      
      红包数据:
      - Token: ${packetData.token}
      - Amount: ${packetData.amount}
      - Count: ${packetData.count}
      
      时间: ${new Date().toISOString()}
    `,
    teamId: process.env.LINEAR_ENG_TEAM_ID!,
    priority: 1,
    labelIds: ['bug', 'urgent'] // 如果有标签 ID
  })
  
  console.log('Issue created:', issue.url)
  return issue
}
```

---

## 🔐 权限说明

### Personal API Key 权限

使用 Personal API Key 时：
- ✅ 可以访问您有权限的所有团队
- ✅ 可以创建、读取、更新 Issues
- ✅ 继承您的用户权限
- ⚠️ 密钥泄露会暴露您的所有权限

### 建议的权限管理

1. **开发/测试环境**：使用个人 API Key
2. **生产环境**：使用团队管理员创建的服务账号 API Key
3. **定期轮换**：每 3-6 个月更换一次 API 密钥
4. **最小权限**：只给予必需的权限

---

## ✅ 验证清单

完成配置后，请确认：

- [ ] 已获取团队的 API 密钥
- [ ] 已更新 `.env` 文件中的 `LINEAR_API_KEY`
- [ ] 已重启 API 服务
- [ ] 能成功获取团队列表
- [ ] 能在正确的团队中创建测试 Issue
- [ ] 在团队的 Linear 工作区能看到测试 Issue
- [ ] 团队成员也能看到这个 Issue

---

## 🚨 常见问题

### Q1: 获取团队列表时没有看到我的团队？

**可能原因**：
1. API 密钥不正确
2. 您没有被邀请到该团队
3. 您的账号权限不足

**解决方案**：
- 确认您已登录正确的 Linear 账号
- 检查是否收到团队邀请邮件并已接受
- 联系团队管理员确认权限

### Q2: 创建 Issue 时返回权限错误？

**解决方案**：
- 确认您在该团队中有创建 Issue 的权限
- 尝试在 Linear 网站手动创建一个 Issue
- 如果手动也不行，联系管理员

### Q3: 团队有多个项目(Project)，如何选择？

**方案**：
```bash
# 创建 Issue 时指定 projectId
curl -X POST http://localhost:3001/api/linear/issues \
  -H "Content-Type: application/json" \
  -d '{
    "title": "新功能",
    "teamId": "team-id",
    "projectId": "project-id"
  }'
```

### Q4: 如何获取项目 ID？

Linear API 暂不直接提供项目列表端点，需要：
1. 在 Linear 网站打开项目
2. 从 URL 中获取项目 ID
3. 或通过 GraphQL API 查询

---

## 📚 相关资源

- **Linear API 文档**: https://developers.linear.app/docs
- **团队管理**: https://linear.app/settings/teams
- **API 密钥管理**: https://linear.app/settings/api

---

## 💡 下一步

配置完成后，您可以：

1. **集成到 CI/CD**：自动创建部署问题
2. **监控告警**：系统异常自动创建 Issue
3. **用户反馈**：用户问题直接进入 Linear
4. **项目管理**：代码提交关联 Linear Issue

示例代码见项目中的 `services/linear.service.ts`。

---

**需要帮助？** 查看 `LINEAR-快速开始.md` 或询问团队管理员。

