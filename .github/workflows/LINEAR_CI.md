# Linear CI 集成文档

本文档说明如何在 CI 中使用 Linear 同步功能。

## 工作流说明

### 1. Linear Sync (`linear-sync.yml`)

**功能**: 将任务从 JSON 文件同步到 Linear

**触发方式**:
- **手动触发** (workflow_dispatch): 在 GitHub Actions 中手动运行
- **自动触发** (push): 当 `tasks.linear.json` 文件变更时自动检查

**使用步骤**:

1. **检查 Linear 团队**:
   - 在 GitHub Actions 中选择 "Linear Sync" 工作流
   - 设置 `check_only` 为 `true`
   - 点击 "Run workflow"
   - 查看可用的团队列表

2. **同步任务**:
   - 在 GitHub Actions 中选择 "Linear Sync" 工作流
   - 设置 `check_only` 为 `false`
   - 设置 `team_key` (例如: `ZES`)
   - 可选: 设置 `team_id` (如果知道 UUID)
   - 可选: 设置 `project_id` (如果需要关联到项目)
   - 可选: 设置 `tasks_file` (默认: `apps/api/scripts/tasks.linear.json`)
   - 点击 "Run workflow"

3. **自动同步**:
   - 当 `apps/api/scripts/tasks.linear.json` 文件变更并推送到 `main` 分支时
   - 如果提交信息包含 `[linear-sync]`，将自动同步任务

### 2. Linear CI Integration (`linear-ci.yml`)

**功能**: 在 PR 中自动检测和更新 Linear issues

**触发方式**:
- PR 创建/更新: 检测 PR 标题和内容中的 Linear issue IDs
- PR 合并: 自动将关联的 Linear issues 更新为 "Done" 状态

**使用方式**:

1. **在 PR 中关联 Linear issues**:
   - 在 PR 标题或内容中包含 Linear issue ID (例如: `ZES-123`)
   - 工作流会自动检测并在 PR 中评论显示关联的 issues

2. **自动更新状态**:
   - 当 PR 合并到 `main` 或 `develop` 分支时
   - 工作流会自动将关联的 Linear issues 更新为 "Done" 状态

**示例 PR 标题**:
```
feat: 实现 Frame 领取功能 (ZES-172)
```

**示例 PR 内容**:
```
## 变更说明

实现了 Frame 领取功能，包括：
- Farcaster Hub 集成
- 幂等性处理
- 分布式锁

关联的 Linear issues:
- ZES-172: 完成 Frame 领取
- ZES-173: 完善 Frame UI
```

### 3. Linear Update (`linear-update.yml`)

**功能**: 手动更新 Linear issue 状态

**触发方式**: 手动触发 (workflow_dispatch)

**使用步骤**:

1. 在 GitHub Actions 中选择 "Linear Update" 工作流
2. 设置 `updates` (格式: `ZES-172=Done,ZES-174=Done`)
3. 设置 `team_key` (例如: `ZES`)
4. 点击 "Run workflow"

## 环境变量配置

在 GitHub Repository Settings > Secrets and variables > Actions 中配置：

- `LINEAR_API_KEY`: Linear API 密钥 (必需)
- `LINEAR_TEAM_KEY`: Linear 团队标识 (可选，默认: `ZES`)

## 任务文件格式

`apps/api/scripts/tasks.linear.json` 文件格式：

```json
[
  {
    "title": "任务标题",
    "description": "任务描述（可选）"
  },
  {
    "title": "另一个任务",
    "description": "详细描述"
  }
]
```

## 常见问题

### 1. 工作流执行失败

**检查**:
- `LINEAR_API_KEY` 是否正确配置
- API 密钥是否有足够的权限
- 团队标识 (`LINEAR_TEAM_KEY`) 是否正确

### 2. 无法找到团队

**解决方案**:
- 使用 `linear-sync.yml` 的 `check_only` 模式查看可用团队
- 确认 API 密钥有权限访问该团队

### 3. PR 中未检测到 Linear issues

**检查**:
- PR 标题或内容中是否包含 Linear issue ID (格式: `ZES-123`)
- Issue ID 格式是否正确 (团队标识-数字)

### 4. 状态更新失败

**检查**:
- 状态名称是否正确 (例如: `Done`, `In Progress`, `Todo`)
- 团队的工作流状态配置
- API 密钥权限

## 最佳实践

1. **PR 标题格式**:
   ```
   type: 简短描述 (ZES-123)
   ```

2. **任务文件管理**:
   - 定期更新 `tasks.linear.json`
   - 同步后检查 `tasks.linear.result.json` 确认结果

3. **状态管理**:
   - 使用 PR 合并自动更新状态
   - 或手动使用 `linear-update.yml` 工作流

4. **权限管理**:
   - 使用最小权限的 API 密钥
   - 定期轮换 API 密钥

