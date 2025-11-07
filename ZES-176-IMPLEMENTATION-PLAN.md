# ZES-176 实现计划：完善事件同步

## 📋 任务概述

**Linear Issue**: ZES-176
**标题**: 完善事件同步：随机红包 PacketRandomReady 与一致性
**优先级**: P1 (In Progress)
**预估工作量**: 3天

## 🎯 目标

完善 RedPacket (红包) 合约的事件同步系统，支持：
1. PacketRandomReady 事件监听
2. 区块链重组 (Reorg) 处理
3. remainingAmount/remainingCount 实时更新
4. 手气最佳 (isBest) 标记
5. 历史事件回填

## 🔍 现状分析

### 已完成
- ✅ DeGift 合约事件监听 (GiftCreated, GiftClaimed, GiftRefunded)
- ✅ 事件回填功能 (syncFromBlock)
- ✅ EventListenerService 基础架构

### 待完成
- ❌ RedPacket 合约事件监听器未创建
- ❌ Packet 数据库模型已被移除 (需要恢复)
- ❌ PacketRandomReady 事件处理未实现
- ❌ 区块链重组处理机制缺失
- ❌ 手气最佳标记逻辑未实现

### 关键发现

项目原本有 Packet 模型，在 migration `20251103100937_refactor_remove_packet_models` 中被移除。但根据 PRD 文档和 Linear 任务，RedPacket 是核心功能，需要恢复。

## 📊 数据模型设计

### Packet Model

```prisma
model Packet {
  id                String   @id @default(cuid())
  packetId          String   @unique // bytes32 from contract
  txHash            String   @unique
  chainId           Int      @default(11155111)

  // Creator
  creatorId         String
  creator           User     @relation("CreatedPackets", fields: [creatorId], references: [id])

  // Token info
  token             String   // ERC20 address or 0x0 for ETH
  tokenSymbol       String?
  tokenDecimals     Int?
  tokenName         String?

  // Packet config
  totalAmount       String   // BigInt as string
  count             Int      // Total number of claims
  isRandom          Boolean  // Fixed or random amounts
  message           String?  @db.VarChar(100)

  // Remaining (updated on each claim)
  remainingAmount   String
  remainingCount    Int

  // VRF status
  vrfRequestId      String?
  randomReady       Boolean  @default(false) // PacketRandomReady event

  // Timestamps
  expireTime        DateTime
  refunded          Boolean  @default(false)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Relations
  claims            PacketClaim[]

  // Block tracking (for reorg handling)
  blockNumber       BigInt?
  blockHash         String?

  @@index([packetId])
  @@index([creatorId])
  @@index([expireTime])
  @@index([blockNumber])
  @@map("packets")
}

model PacketClaim {
  id           String   @id @default(cuid())
  packetId     String
  packet       Packet   @relation(fields: [packetId], references: [id], onDelete: Cascade)
  claimerId    String
  claimer      User     @relation("ClaimedPackets", fields: [claimerId], references: [id])
  amount       String   // BigInt as string
  txHash       String   @unique
  isBest       Boolean  @default(false) // 手气最佳
  claimedAt    DateTime @default(now())

  // Block tracking (for reorg handling)
  blockNumber  BigInt?
  blockHash    String?

  @@unique([packetId, claimerId])
  @@index([packetId])
  @@index([claimerId])
  @@index([isBest])
  @@index([blockNumber])
  @@map("packet_claims")
}
```

### User Model Updates

```prisma
// Add to User model
model User {
  // ... existing fields

  // Packet relations
  createdPackets  Packet[]      @relation("CreatedPackets")
  claimedPackets  PacketClaim[] @relation("ClaimedPackets")
}
```

## 🔧 实现方案

### 1. 数据库迁移

**文件**: `apps/api/prisma/migrations/YYYYMMDDHHMMSS_add_packet_models/migration.sql`

创建 Packet 和 PacketClaim 表。

### 2. RedPacket 事件监听服务

**文件**: `apps/api/src/services/redpacket-listener.service.ts`

```typescript
export class RedPacketListenerService {
  // 监听 4 个事件:
  // - PacketCreated
  // - PacketClaimed
  // - PacketVrfRequested
  // - PacketRandomReady

  // 功能:
  // - 创建 Packet 记录
  // - 更新 remainingAmount/Count
  // - 标记 randomReady
  // - 创建 PacketClaim 记录
  // - 标记手气最佳
}
```

### 3. 区块链重组处理

**策略**:
1. 存储每个事件的 blockNumber 和 blockHash
2. 定期检查最近 N 个区块的 blockHash 是否一致
3. 如果检测到 reorg，回滚受影响的事件
4. 重新同步正确的区块

**实现**:
- 添加 `ReorgDetectionService`
- 在 syncGifts.job.ts 中启动检测定时任务
- 建议检测深度: 12 个区块 (Sepolia ~3 分钟)

### 4. 手气最佳标记

**逻辑**:
1. 监听 PacketClaimed 事件
2. 查询该 Packet 的所有 claims
3. 找到 amount 最大的 claim
4. 更新其 isBest = true
5. 如果有新的更大金额，更新标记

**优化**:
- 只有 isRandom = true 的 packet 才需要标记
- 使用事务确保原子性
- 可以延迟标记 (packet 全部领取完毕后)

### 5. Socket.IO 实时推送

**事件**:
```typescript
// 红包创建
socket.emit('packet:created', { packetId, ... })

// 红包被领取
socket.emit('packet:claimed', { packetId, claimerId, amount, remainingCount })

// 随机数就绪
socket.emit('packet:random-ready', { packetId })

// 手气最佳更新
socket.emit('packet:best-updated', { packetId, claimId })
```

## 📝 实现步骤

### Step 1: 数据库准备 (30分钟)
- [ ] 创建 Packet/PacketClaim migration
- [ ] 更新 Prisma schema
- [ ] 运行 migrate dev
- [ ] 更新 User model relations

### Step 2: RedPacket 监听服务 (2小时)
- [ ] 创建 RedPacketListenerService
- [ ] 实现 PacketCreated 处理
- [ ] 实现 PacketClaimed 处理
- [ ] 实现 PacketVrfRequested 处理
- [ ] 实现 PacketRandomReady 处理

### Step 3: 手气最佳逻辑 (1小时)
- [ ] 实现 updateBestClaim 方法
- [ ] 在 PacketClaimed 处理中调用
- [ ] 添加事务支持

### Step 4: 区块链重组处理 (2小时)
- [ ] 创建 ReorgDetectionService
- [ ] 实现 blockHash 检查
- [ ] 实现事件回滚逻辑
- [ ] 添加定时任务

### Step 5: Socket.IO 集成 (1小时)
- [ ] 添加 packet 相关事件
- [ ] 在事件处理中触发推送
- [ ] 测试实时更新

### Step 6: 测试 (2小时)
- [ ] 单元测试 (RedPacketListenerService)
- [ ] 集成测试 (事件同步流程)
- [ ] Reorg 模拟测试
- [ ] 手气最佳标记测试

### Step 7: 文档与部署 (30分钟)
- [ ] API 文档
- [ ] 更新 ENV 配置
- [ ] 部署说明

## ⚠️ 注意事项

### 1. 向后兼容
项目已经移除了 Packet 模型，需要确保:
- DeGift 功能不受影响
- 现有的 Gift 表继续工作
- 两个合约可以共存

### 2. 性能考虑
- VRF 回调可能需要等待 (最长 5-10 分钟)
- 使用 Redis 缓存 packet 状态
- remainingCount 更新要考虑并发

### 3. 安全考虑
- 区块链重组可能导致双花
- 需要等待足够的确认块数 (建议 12 块)
- 幂等性检查 (txHash 去重)

### 4. 用户体验
- randomReady 之前显示等待提示
- 实时推送 remainingCount 更新
- 手气最佳动画效果

## 🧪 测试计划

### 单元测试
```typescript
// redpacket-listener.service.test.ts
- PacketCreated 事件处理
- PacketClaimed 事件处理 + remainingCount 更新
- PacketRandomReady 事件处理
- 手气最佳标记逻辑
- 并发领取场景
```

### 集成测试
```typescript
// packet-sync.integration.test.ts
- 完整的红包创建-领取流程
- VRF 请求和回调
- 历史事件同步
- 区块链重组模拟
```

### 压力测试
```bash
# k6 测试脚本
- 并发创建红包
- 并发领取红包
- Socket.IO 消息风暴
```

## 📅 时间估算

| 任务 | 预估时间 | 优先级 |
|------|---------|--------|
| 数据库迁移 | 0.5h | P0 |
| RedPacket 监听服务 | 2h | P0 |
| 手气最佳逻辑 | 1h | P1 |
| 区块链重组处理 | 2h | P1 |
| Socket.IO 集成 | 1h | P1 |
| 测试 | 2h | P0 |
| 文档 | 0.5h | P2 |
| **总计** | **9h** | **~1-2天** |

## 🚀 后续优化

### Phase 2
- [ ] 事件索引器 (Subgraph)
- [ ] 事件重放功能
- [ ] 多链支持
- [ ] 事件监控和告警

### Phase 3
- [ ] 链下随机数备份方案
- [ ] Layer 2 集成
- [ ] 跨链红包

## 📚 相关文档

- [PRD 文档](./docs/红包dApp-PRD.md)
- [技术方案](./docs/技术落地方案-模块接口与伪代码.md)
- [合约文档](./packages/contracts/README.md)
- [API 文档](./docs/API-*.md)

## 🔗 依赖

- Prisma schema 更新
- RedPacket 合约 ABI
- Socket.IO Redis Adapter
- Viem 事件监听

## ✅ 验收标准

- [ ] Packet 模型创建并迁移成功
- [ ] 所有 4 个 RedPacket 事件都能正确监听和处理
- [ ] remainingAmount/Count 实时更新准确
- [ ] 手气最佳标记正确
- [ ] 区块链重组能被检测和处理
- [ ] Socket.IO 实时推送工作正常
- [ ] 历史事件同步功能正常
- [ ] 测试覆盖率 > 80%
- [ ] 文档完整

---

**创建时间**: 2025-11-07
**预计完成**: 2025-11-09
**负责人**: TBD
**状态**: 📝 Planning
