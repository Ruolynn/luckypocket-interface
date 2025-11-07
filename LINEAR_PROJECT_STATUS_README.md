# Linear 项目状态查询指南

本文档说明如何查询和管理 DeGift 项目在 Linear 中的状态。

## 项目信息

- **项目名称**: DeGift - 去中心化礼物系统
- **项目 ID**: `90e7347d4faa`
- **团队**: Zesty Studio (ZES)
- **Linear 项目 URL**: https://linear.app/zesty-studio/project/degift-去中心化礼物系统-90e7347d4faa

## 已生成的报告文件

### 1. 详细报告 (Markdown)
**文件**: `/Users/lushengqi/工作间/Github/HongBao/degift-project-status-report.md`

包含完整的项目分析：
- 所有任务详情
- 优先级分析
- 技术风险评估
- 时间线估算
- 下一步行动建议

### 2. 结构化摘要 (JSON)
**文件**: `/Users/lushengqi/工作间/Github/HongBao/degift-project-status-summary.json`

机器可读格式，包含：
- 任务统计
- 优先级分布
- 技术栈信息
- 风险评估
- 监控指标

## 快速查看项目状态

运行以下命令快速查看项目摘要：

```bash
cd /Users/lushengqi/工作间/Github/HongBao/apps/api
./scripts/show-project-summary.sh
```

## 获取实时状态

### 前提条件

由于当前 Linear API key 已过期，需要先更新：

#### 步骤 1: 生成新的 API Key

1. 访问 Linear 设置: https://linear.app/settings/api
2. 点击 "Create new key"
3. 命名为 "DeGift Project Status"
4. 复制生成的 key (格式: `lin_api_xxxxx...`)

#### 步骤 2: 更新环境变量

```bash
cd /Users/lushengqi/工作间/Github/HongBao/apps/api
```

编辑 `.env` 文件：
```bash
LINEAR_API_KEY=lin_api_YOUR_NEW_KEY_HERE
```

#### 步骤 3: 更新 GitHub Secrets (可选，用于 CI/CD)

1. 访问仓库设置: https://github.com/YOUR_USERNAME/HongBao/settings/secrets/actions
2. 更新或创建 `LINEAR_API_KEY` secret

### 运行实时查询脚本

一旦 API key 更新，运行以下脚本获取实时状态：

```bash
cd /Users/lushengqi/工作间/Github/HongBao/apps/api
npx tsx scripts/get-project-status.ts 90e7347d4faa
```

这将：
- 从 Linear API 获取项目的最新数据
- 显示所有 issues 及其当前状态
- 生成统计报告
- 保存 JSON 报告到 `scripts/project-status-report.json`

## 可用的脚本

### 1. 获取项目状态
```bash
npx tsx scripts/get-project-status.ts <project-id>
```

**功能**: 获取指定项目的完整状态，包括所有 issues

### 2. 列出所有 Issues
```bash
npx tsx scripts/list-linear-issues.ts ZES 50
```

**功能**: 列出团队的 issues（参数：团队 key, 数量限制）

### 3. 获取单个 Issue 详情
```bash
npx tsx scripts/get-linear-issue.ts ZES-172
```

**功能**: 获取特定 issue 的详细信息

### 4. 同步任务到 Linear
```bash
node scripts/linear-sync.cjs tasks.linear.json
```

**功能**: 将 JSON 文件中的任务批量创建到 Linear

### 5. 检查 Linear 连接
```bash
node scripts/test-linear-api.cjs 90e7347d4faa
```

**功能**: 测试 API 连接并获取项目信息

### 6. 查看项目摘要
```bash
./scripts/show-project-summary.sh
```

**功能**: 快速查看任务列表和已创建的 issues

## 项目任务概览

当前项目包含 **9 个核心任务**：

### P0 - 核心功能 (3个)
- **ZES-172**: Frame 领取 (Farcaster Hub + 幂等锁)
- **ZES-174**: proxyClaimPacket (ERC-4337 代付)
- **ZES-179**: 代币验证 (ERC20 + 黑名单)

### P1 - 重要功能 (3个)
- **ZES-176**: 事件同步 (PacketRandomReady + 一致性)
- **ZES-178**: 红包详情页 (Socket.IO 实时)
- **ZES-180**: Socket.IO 鉴权 (JWT + 权限)

### P2 - 优化增强 (2个)
- **ZES-173**: Frame UI 优化 (SSR + 性能)
- **ZES-177**: 排行榜优化 (格式化 + 群榜)

### P3 - 增长功能 (1个)
- **ZES-175**: 邀请奖励 ($2 USDC + 风控)

## 任务文件说明

### tasks.linear.json
定义要创建的任务列表，每个任务包含：
- `title`: 任务标题
- `description`: 任务描述

### tasks.linear.result.json
记录已创建到 Linear 的任务，包含：
- `title`: 任务标题
- `url`: Linear 中的 issue URL
- `id`: Linear issue ID

## GitHub Actions 集成

项目已配置 GitHub Actions 自动同步：

**工作流文件**: `.github/workflows/linear-sync.yml`

**触发方式**:
1. 手动触发 (workflow_dispatch)
2. 推送包含 `[linear-sync]` 的 commit 到 main 分支

**使用方法**:
```bash
git add apps/api/scripts/tasks.linear.json
git commit -m "Update tasks [linear-sync]"
git push
```

## 监控建议

建议定期检查以下指标：

### 进度指标
- 任务完成率
- Sprint 燃尽图
- 阻塞任务数量

### 质量指标
- 代码覆盖率
- Bug 数量
- 安全漏洞

### 性能指标
- API 响应时间
- 交易成功率
- Socket.IO 连接稳定性

## 故障排查

### 问题：401 Authentication Error

**原因**: API key 已过期或无效

**解决**:
1. 生成新的 API key (见上文)
2. 更新 `.env` 文件
3. 重启开发服务器

### 问题：找不到项目

**原因**: 项目 ID 错误或权限不足

**解决**:
1. 确认项目 ID: `90e7347d4faa`
2. 确认账号有访问权限
3. 在 Linear 中检查项目是否存在

### 问题：脚本运行失败

**检查清单**:
- [ ] 是否在正确的目录 (`apps/api`)
- [ ] `.env` 文件是否存在
- [ ] `LINEAR_API_KEY` 是否设置
- [ ] Node.js 版本是否正确 (v20+)
- [ ] 依赖是否安装 (`pnpm install`)

## 技术栈参考

本项目使用的主要技术：

**区块链**:
- ERC20 Tokens
- ERC-4337 Account Abstraction
- Smart Contract Events

**前端**:
- Farcaster Frame
- React/Next.js
- Socket.IO Client

**后端**:
- Fastify
- Socket.IO Server
- Redis (分布式锁)
- JWT Authentication

## 相关文档

- [Linear API 文档](https://developers.linear.app/docs)
- [Farcaster 文档](https://docs.farcaster.xyz)
- [ERC-4337 规范](https://eips.ethereum.org/EIPS/eip-4337)
- [Socket.IO 文档](https://socket.io/docs/)

## 联系与支持

如需帮助或报告问题：

1. 查看项目文档目录：`/Users/lushengqi/工作间/Github/HongBao/docs/`
2. 查看 Linear 集成指南：`docs/Linear集成设置指南.md`
3. 在 Linear 中创建 issue
4. 联系团队成员

---

**最后更新**: 2025-11-07
**维护者**: Zesty Studio Team
