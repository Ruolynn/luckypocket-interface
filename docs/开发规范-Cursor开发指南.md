# 🎯 红包 dApp 开发规范 - Cursor 开发指南

> **目标**: 为企业级开发提供统一的代码规范和开发约束，确保 Cursor 等 AI 工具生成符合项目标准的代码。

---

## 📋 目录

- [核心原则](#核心原则)
- [代码风格规范](#代码风格规范)
- [架构与模块规范](#架构与模块规范)
- [命名规范](#命名规范)
- [错误处理规范](#错误处理规范)
- [类型安全规范](#类型安全规范)
- [测试规范](#测试规范)
- [Git 工作流规范](#git-工作流规范)
- [AI 工具提示词模板](#ai-工具提示词模板)
- [代码审查清单](#代码审查清单)

---

## 核心原则

> **重要**: 以下两条是项目的最高指导原则，所有开发决策都应围绕这两条原则展开。

### 原则 0.1: 勇于重构，优先代码质量而非兼容性

**核心理念**: 代码是写给人看的，质量永远比兼容性更重要。

- ✅ **必须**: 发现更优实现时，立即重构旧代码，不要顾虑兼容性问题
- ✅ **必须**: 重构时彻底改进，不要为了保持旧接口而留下技术债务
- ✅ **推荐**: 遇到以下情况，毫不犹豫进行重构：
  - 代码结构混乱，难以维护
  - 存在明显的设计缺陷或性能问题
  - 有更好的实现方案
  - 命名不当或职责不清

**示例**:
```typescript
// ❌ 错误: 为了兼容旧代码而保留废弃实现
function createPacket(params: any) {
  // 新实现
  if (isNewFormat(params)) {
    return createPacketV2(params)
  }
  // ❌ 保留旧实现，导致代码复杂度增加
  return createPacketLegacy(params)
}

// ✅ 正确: 直接重构，彻底改进
function createPacket(params: CreatePacketParams) {
  // 统一的新实现，代码简洁清晰
  return newPacketService.create(params)
}
```

**注意**: 重构时确保有完整测试覆盖，并且重构是一次性完成的，避免渐进式改造导致的不一致状态。

---

### 原则 0.2: 解决根本问题，而非表面症状

**核心理念**: 找到问题的根源，从根本上解决问题，而不是修修补补。

- ✅ **必须**: 遇到 Bug 或问题时，先定位根本原因，再设计解决方案
- ✅ **必须**: 避免"治标不治本"的临时方案（除非是紧急修复，但需标记为技术债务）
- ✅ **禁止**: 通过增加条件判断、特殊处理等方式掩盖问题
- ✅ **推荐**: 使用"5 Why"分析法，连续追问为什么，直到找到根本原因

**问题分析流程**:
1. **现象**: 问题的外在表现是什么？
2. **定位**: 问题发生在哪个模块、哪个环节？
3. **原因**: 为什么会发生这个问题？（继续追问 5 个为什么）
4. **方案**: 如何从根本上解决？而不是如何快速绕过？

**示例**:
```typescript
// ❌ 错误: 治标不治本，通过特殊判断掩盖问题
function claimPacket(packetId: string, userId: string) {
  // 发现某个用户总是报错，加特殊判断
  if (userId === 'user-123') {
    await wait(1000)  // ❌ 临时延迟，没有解决根本问题
  }
  return doClaim(packetId, userId)
}

// ✅ 正确: 定位根本原因并彻底解决
function claimPacket(packetId: string, userId: string) {
  // 发现问题是竞态条件导致的
  // 根本解决方案：添加分布式锁
  return withLock(`claim:${packetId}:${userId}`, async () => {
    return doClaim(packetId, userId)
  })
}
```

**技术债务处理**:
- 如果确实需要临时方案（如紧急 Bug 修复），必须：
  1. 在代码中标记 `TODO(FIXME): [原因]` 并关联 Issue
  2. 在 Issue 中记录根本原因和完整解决方案
  3. 在下一个迭代周期中安排重构

---

### 1. 类型安全优先
- ✅ **必须**: 所有代码必须是 TypeScript，禁止使用 `any`
- ✅ **必须**: 使用 `zod` 进行运行时类型校验
- ✅ **推荐**: 充分利用 TypeScript 的类型推断，减少冗余类型注解

### 2. 错误处理统一
- ✅ **必须**: 使用统一的错误码体系
- ✅ **必须**: 所有异步操作必须有错误处理
- ✅ **禁止**: 使用空的 `catch` 块

### 3. 可维护性
- ✅ **必须**: 函数单一职责，单函数不超过 50 行
- ✅ **必须**: 模块化设计，避免循环依赖
- ✅ **推荐**: 添加必要的 JSDoc 注释

### 4. 性能考虑
- ✅ **必须**: 数据库查询使用索引字段
- ✅ **必须**: 避免 N+1 查询问题
- ✅ **推荐**: 使用 Redis 缓存热点数据

---

## 代码风格规范

### TypeScript 配置

```typescript
// ✅ 正确: 明确类型，充分利用推断
const userId: string = req.user.userId
const packet = await prisma.packet.findUnique({ where: { id: packetId } })

// ❌ 错误: 使用 any
const data: any = await fetchData()

// ❌ 错误: 不必要的类型注解
const count: number = 10  // number 可推断
```

### 函数定义规范

```typescript
// ✅ 正确: 单一职责，明确类型，有错误处理
async function createPacket(params: CreatePacketParams): Promise<Packet> {
  try {
    // 业务逻辑
    return packet
  } catch (error) {
    logger.error({ error, params }, 'Failed to create packet')
    throw new AppError('PACKET_CREATE_FAILED', error)
  }
}

// ❌ 错误: 函数职责过多，没有错误处理
async function handlePacket(req, res) {
  // 验证、创建、发送通知、更新缓存... 太多职责
}
```

### 异步操作规范

```typescript
// ✅ 正确: 使用 async/await，统一错误处理
async function processPacket(packetId: string) {
  try {
    const packet = await getPacket(packetId)
    await updateStatus(packetId)
    await notifyUsers(packetId)
  } catch (error) {
    logger.error({ error, packetId }, 'Process packet failed')
    throw error
  }
}

// ❌ 错误: Promise 链式调用，难以追踪错误
function processPacket(packetId: string) {
  getPacket(packetId)
    .then(packet => updateStatus(packetId))
    .then(() => notifyUsers(packetId))
    .catch(err => console.log(err))  // 空的错误处理
}
```

### 导入顺序规范

```typescript
// ✅ 正确: 标准导入顺序
// 1. 外部库
import Fastify from 'fastify'
import { z } from 'zod'

// 2. 内部模块（按层级）
import { prisma } from '@/plugins/prisma'
import { redis } from '@/plugins/redis'
import { createPacket } from笔画 '@/services/packet.service'

// 3. 类型导入
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { CreatePacketParams } from '@/types'

// ❌ 错误: 混乱的导入顺序
import { createPacket } from '@/services/packet.service'
import Fastify from 'fastify'
import type { FastifyRequest } from 'fastify'
```

---

## 架构与模块规范

### 后端模块结构

```
apps/api/src/
├── index.ts                 # 入口文件（只负责启动）
├── plugins/                 # Fastify 插件
│   ├── prisma.ts           # Prisma Client 单例
│   ├── redis.ts            # Redis 客户端\.ts 单例
│   ├── jwt.ts              # JWT 插件封装
│   └── swagger.ts          # API 文档（可选）
├── routes/                  # 路由层（只负责定义端点）
│   ├── auth.ts
│   ├── packets.ts
│   └── growth/
│       ├── invite.ts
│       └── leaderboard.ts
├── services/                # 业务逻辑层
│   ├── packet.service.ts   # 红包业务逻辑
│   ├── chain.service.ts    # 链上交互
│   └── notification.service.ts
├── middleware/              # 中间件
│   ├── auth.middleware.ts
│   ├── error-handler.ts
│   ├── idempotency.ts
│   └── rate-limit.ts
├── utils/                   # 工具函数
│   ├── logger.ts
│   ├── errors.ts
│   └── locks.ts
├── types/                   # 类型定义
│   └── index.ts
└── websocket/              # WebSocket 相关
    └── io.ts
```

### 模块职责边界

#### 路由层 (routes/)
```typescript
// ✅ 正确: 路由只负责接收请求、调用服务、返回响应
app.post('/packets', async (req, reply) => {
  // 1. 参数校验（Zod）
  const input = CreatePacketSchema.parse(req.body)
  
  // 2. 调用服务层
  const packet = await packetService.create(input, req.user.userId)
  
  // 3. 返回响应
  return reply.code(201).send({ success: true, data: packet })
})

// ❌ 错误: 路由层包含业务逻辑
app.post('/packets', async (req, reply) => {
  // ❌ 不应该在这里写业务逻辑
  const packet = await prisma.packet.create({ ... })
  await redis.set(`packet:${packet.id}`, packet)
  await sendNotification(...)
})
```

#### 服务层 (services/)
```typescript
// ✅ 正确: 服务层包含所有业务逻辑
export async function createPacket(
  params: CreatePacketParams,
  userId: John
): Promise<Packet> {
  // 1. 业务校验
  await validatePacketParams(params)
  
  // 2. 数据库操作
  const packet = await prisma.packet.create({ ... })
  
  // 3. 缓存更新
  await redis.set(`packet:${packet.id}`, packet, 'EX', 3600)
  
  // 4. 触发事件
  await notifyPacketCreated(packet)
  
  return packet
}
```

#### 工具层 (utils/)
```typescript
// ✅ 正确: 工具函数应该是纯函数或简单封装
export function formatAmount(amount: string, decimals = 6): string {
  const value = BigInt(amount)
  return (Number(value) / Math.pow(10, decimals)).toFixed(2)
}

export async function withLock<T>(
  key: string,
  ttl: number,
  fn: () => Promise<T>
): Promise<T> {
  const locked = await redis.set(`lock:${key}`, '1', 'EX', ttl, 'NX')
  if (locked !== 'OK') throw new Error('LOCKED')
  try {
    return await fn()
  } finally {
    await redis.del(`lock:${key}`)
  }
}
```

---

## 命名规范

### 文件命名
- **路由文件**: `kebab-case.ts` (如: `packet-claim.ts`)
- **服务文件**: `kebab-case.service.ts` (如: `packet.service.ts`)
- **类型文件**: `kebab-case.type.ts` (如: `packet.type.ts`)
- **测试文件**: `*.test.ts` 或 `*.spec.ts`

### 变量命名
```typescript
// ✅ 正确
const packetId: string = '0x123...'
const totalAmount: bigint = 1000000n
const isRandom: boolean = true
const userPackets: Packet[] = []

// ❌ 错误
const packet_id: string  // 应使用 camelCase
const total_amount: bigint
const IsRandom: boolean  // 不应使用 PascalCase
```

### 函数命名
```typescript
// ✅ 正确: 动词开头，清晰表达意图
function createPacket() {}
function validatePacketParams() {}
function getPacketById() {}
function hasUserClaimed() {}

// ❌ 错误
function packet() {}  // 缺少动词
function doSomething() {}  // 不够具体
function packetCreate() {}  // 顺序不当
```

### 类型/接口命名
```typescript
// ✅ 正确: PascalCase，描述性名称
interface CreatePacketParams {
  amount: string
  count: number
  isRandom: boolean
}

type PacketStatus = 'pending' | 'active' | 'expired' | 'refunded'

// ❌ 错误
interface params {}  // 首字母小写
type status = string  // 不够具体
```

### 常量命名
```typescript
// ✅ 正确: UPPER_SNAKE_CASE
const MAX_PACKET_COUNT = 200
const DEFAULT_EXPIRY_HOURS = 24
const REDIS_KEY_PREFIX = 'packet:'

// ❌ 错误
const maxPacketCount = 200  // 应使用常量命名
```

---

## 错误处理规范

### 错误码体系

```typescript
// ✅ 正确: 统一的错误码定义
export enum ErrorCode {
  // 通用错误 (1xxx)
  VALIDATION_ERROR = '1000',
  UNAUTHORIZED = '1001',
  FORBIDDEN = '1002',
  NOT_FOUND = '1003',
  RATE_LIMIT_EXCEEDED = '1004',
  
  // 红包相关 (2xxx)
  PACKET_NOT_FOUND = '2001',
  PACKET_EXPIRED = '2002',
  PACKET_ALREADY_CLAIMED = '2003',
  PACKET_EMPTY = '2004',
  INVALID_PACKET_AMOUNT = '2005',
  
  // 链上相关 (3xxx)
  CHAIN_TX_FAILED = '3001',
  CHAIN_TX_TIMEOUT = '3002',
  CONTRACT_ERROR = '3003',
}

// ✅ 正确: 自定义错误类
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 400,
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'
  }
}
```

### 错误处理模式

```typescript
// ✅ 正确: 服务层抛出 AppError
export async function claimPacket(packetId: string, userId: string) {
  const packet = await prisma.packet.findUnique({ where: { id: packetId } })
  if (!packet) {
    throw new AppError(ErrorCode.PACKET_NOT_FOUND, 'Packet not found', 404)
  }
  
  if (packet.expireTime < new Date()) {
    throw new AppError(ErrorCode.PACKET_EXPIRED, 'Packet expired', 400)
  }
  
  // ...
}

// ✅ 正确: 路由层捕获并格式化错误
app.post('/packets/:id/claim', async (req, reply) => {
  try {
    const packet = await packetService.claimPacket(req.params.id, req.user.userId)
    return { success: true, data: packet }
  } catch (error) {
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({
        error: error.code,
        message: error.message,
        details: error.details
      })
    }
    // 未知错误
    logger.error({ error }, 'Unexpected error in claim packet')
    return reply.code(500).send({
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    })
  }
})
```

---

## 类型安全规范

### Zod Schema 定义

```typescript
// ✅ 正确: 使用 Zod 定义运行时校验
import { z } from 'zod'

export const CreatePacketSchema = z.object({
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid tx hash'),
  packetId: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid packet ID'),
  message: z.string().max(200).optional(),
  amount: z.string().regex(/^\d+$/, 'Amount must be numeric string'),
  count: z.number().int().min(1).max(200),
  isRandom: z.boolean(),
})

export type CreatePacketInput = z.infer<typeof CreatePacketSchema>

// ✅ 正确: 在路由中使用
app.post('/packets', async (req, reply) => {
  const input = CreatePacketSchema.parse(req.body)  // 自动校验和类型推断
  // input 类型为 CreatePacketInput
})
```

### Prisma 类型使用

```typescript
// ✅ 正确: 使用 Prisma 生成的类型
import type { Packet, Claim, User } from '@prisma/client'
import type { Prisma } from '@prisma/client'

// 扩展现有类型
type PacketWithCreator = Packet & {
  creator: User
}

type PacketWithClaims = Packet & {
  claims: Claim[]
}

// 使用 Prisma 的 select 类型
type PacketSummary = Prisma.PacketGetPayload<{
  select: {
    id: true
    packetId: true
    totalAmount: true
    remainingCount: true
  }
}>
```

### 禁止使用 any

```typescript
// ❌ 错误: 使用 any
function processData(data: any) {
  return data.someProperty
}

// ✅ 正确: 定义具体类型或使用 unknown
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null && 'someProperty' in data) {
    return (data as { someProperty: string }).someProperty
  }
  throw new Error('Invalid data')
}

// ✅ 或者使用类型守卫
function isPacketData(data: unknown): data is PacketData {
  return typeof data === 'object' && data !== null && 'id' in data
}
```

---

## 测试规范

### 测试文件结构

```typescript
// ✅ 正确: 测试文件组织
describe('PacketService', () => {
  describe('createPacket', () => {
    it('should create packet with valid params', async () => {
      // Arrange
      const params = { ... }
      const userId = 'user-123'
      
      // Act
      const packet = await packetService.createPacket(params, userId)
      
      // Assert
      expect(packet).toBeDefined()
      expect(packet.creatorId).toBe(userId)
    })
    
    it('should throw error when amount is invalid', async () => {
      // Arrange
      const params = { amount: '-100', ... }
      
      // Act & Assert
      await expect(
        packetService.createPacket(params, 'user-123')
      ).rejects.toThrow(AppError)
    })
  })
})
```

### 测试覆盖率要求

- **单元测试**: 服务层和工具函数覆盖率 ≥ 80%
- **集成测试**: 关键 API 端点必须覆盖
- **E2E 测试**: 核心用户流程必须覆盖

### 测试数据管理

```typescript
// ✅ 正确: 使用工厂函数创建测试数据
export function createMockPacket(overrides?: Partial<Packet>): Packet {
  return {
    id: 'test-id',
    packetId: '0x123...',
    creatorId: 'user-123',
    totalAmount: '1000000',
    count: 10,
    remainingCount: 10,
    isRandom: true,
    expireTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    refunded: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}
```

---

## Git 工作流规范

### 分支命名

```
main          # 生产环境
develop       # 开发主分支
feature/*     # 功能分支 (如: feature/packet-claim)
bugfix/*      # 修复分支 (如: bugfix/packet-expiry)
hotfix/*      # 紧急修复 (如: hotfix/security-patch)
```

### 提交消息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型 (type)**:
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具相关

**示例**:
```
feat(packets): add packet claim endpoint

- Add POST /api/packets/:id/claim route
- Implement claim validation logic
- Add unit tests for claim service

Closes #123
```

### PR 规范

- ✅ PR 标题清晰描述改动
- ✅ PR 描述包含: 改动原因、测试方法、截图（如有 UI）
- ✅ 代码必须通过 lint 和测试
- ✅ 至少一名 reviewer 同意后才能 merge

---

## AI 工具提示词模板

### 通用开发提示词

```
请按照以下规范实现 [功能描述]:

1. **代码风格**:
   - 使用 TypeScript，禁止使用 any
   - 函数单一职责，不超过 50 行
   - 使用 Zod 进行参数校验
   - 使用统一的错误处理（AppError）

2. **模块结构**:
   - 路由层: 只负责接收请求、调用服务、返回响应
   - 服务层: 包含所有业务逻辑
   - 类型定义: 在 types/ 目录下

3. **命名规范**:
   - 文件: kebab-case
   - 函数/变量: camelCase
   - 类型/接口: PascalCase
   - 常量: UPPER_SNAKE_CASE

4. **错误处理**:
   - 使用 ErrorCode 枚举
   - 抛出 AppError
   - 记录日志

5. **测试**:
   - 编写单元测试
   - 测试覆盖率 ≥ 80%

请确保生成的代码符合项目开发规范。
```

### 具体功能开发提示词

```
实现 [具体功能]，要求:

**输入/输出**:
- 输入类型: [描述]
- 输出类型: [描述]
- 错误情况: [列出可能的错误]

**业务逻辑**:
1. [步骤 1]
2. [步骤 2]
3. [步骤 3]

**技术约束**:
- 使用 Prisma 进行数据库操作
- 使用 Redis 进行缓存（如适用）
- 需要幂等性保护（如适用）
- 需要分布式锁（如适用）

**测试要求**:
- 成功场景测试
- 边界条件测试
- 错误场景测试

请按照项目规范实现，并添加必要的注释。
```

---

## 代码审查清单

### 功能完整性
- [ ] 实现符合需求文档
- [ ] 错误处理完整
- [ ] 边界条件已考虑

### 代码质量
- [ ] 无 TypeScript 错误和警告
- [ ] 遵循命名规范
- [ ] 函数职责单一，长度合理
- [ ] 无重复代码

### 安全性
- [ ] 输入验证完整（Zod）
- [ ] SQL 注入防护（Prisma）
- [ ] 认证授权正确
- [ ] 敏感信息未泄露

### 性能
- [ ] 数据库查询使用索引
- [ ] 避免 N+1 查询
- [ ] 合理使用缓存
- [ ] 异步操作正确处理

### 测试
- [ ] 单元测试覆盖核心逻辑
- [ ] 集成测试覆盖关键路径
- [ ] 测试用例清晰易懂

### 文档
- [ ] 复杂逻辑有注释
- [ ] API 文档已更新（如有）
- [ ] README 已更新（如有）

---

## 快速参考

### 常用代码片段

```typescript
// 1. Fastify 路由定义
app.post('/api/packets', async (req, reply) => {
  const input = CreatePacketSchema.parse(req.body)
  const result = await packetService.create(input, req.user.userId)
  return reply.code(201).send({ success: true, data: result })
})

// 2. 服务层函数
export async function createPacket(
  params: CreatePacketParams,
  userId: string
): Promise<Packet> {
  await validateParams(params)
  const packet = await prisma.packet.create({ ... })
  await cachePacket(packet)
  return packet
}

// 3. 错误处理
if (!packet) {
  throw new AppError(ErrorCode.PACKET_NOT_FOUND, 'Packet not found', 404)
}

// 4. 幂等性检查
const key = `idem:${req.headers['idempotency-key']}`
const exists = await redis.get(key palette)
if (exists) {
  return reply.code(409).send({ error: 'DUPLICATE_REQUEST' })
}
await redis.setex(key, 3600, '1')

// 5. 分布式锁
await withLock(`packet:${packetId}`, 10, async () => {
  // 临界区代码
})
```

---

## 总结

这份开发规范的目的是:

1. ✅ **提高代码质量**: 统一的风格和规范
2. ✅ **加速开发**: AI 工具可以生成符合规范的代码
3. ✅ **降低维护成本**: 代码易于理解和修改
4. ✅ **减少 Bug**: 类型安全和错误处理规范

**重要提示**: 
- 所有团队成员和 AI 工具都应遵循此规范
- 规范会根据项目演进持续更新
- 发现问题及时提出，共同完善规范

---

**最后更新**: 2025-01-XX  
**维护者**: 开发团队  
**版本**: v1.0.0

