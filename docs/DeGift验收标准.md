# DeGift 项目验收标准

**项目经理**: Claude PM
**版本**: v1.0
**更新日期**: 2025-11-03

---

## 📋 总览

本文档定义了 DeGift 项目每个阶段、每个任务的详细验收标准。项目经理会根据这些标准对开发 Claude 提交的代码进行验收。

**验收原则**:
- ✅ 所有验收标准必须 100% 满足才能通过
- ✅ 基于产品文档（红包 dApp PRD）进行功能性验证
- ✅ 代码质量、安全性、性能都在验收范围内
- ✅ 不符合标准的任务会被退回修改

---

## Phase 1: 合约层验收标准

### ZES-69: DeGift 智能合约设计和开发

#### 1. 文件结构检查
- [ ] 文件存在：`packages/contracts/src/DeGift.sol`
- [ ] 文件编码：UTF-8
- [ ] 代码行数：合理范围（200-500 行）
- [ ] License 声明：MIT

#### 2. 编译检查
```bash
cd packages/contracts
forge build
```
- [ ] 编译成功（无错误）
- [ ] 无编译警告
- [ ] Solidity 版本：0.8.20

#### 3. 代码结构检查
必须包含的组件：
- [ ] SPDX-License-Identifier
- [ ] pragma solidity ^0.8.20
- [ ] import 语句（OpenZeppelin 等）
- [ ] 合约定义：`contract DeGift`
- [ ] 数据结构：Gift struct
- [ ] 状态变量定义
- [ ] 事件定义
- [ ] 错误定义
- [ ] 修饰符（modifier）
- [ ] 核心函数实现

#### 4. Gift 数据结构验证
```solidity
struct Gift {
    uint256 id;
    address sender;
    address recipient;
    address token;      // address(0) for ETH
    uint256 amount;
    string message;
    uint256 createdAt;
    uint256 expiresAt;
    GiftStatus status;  // enum
}
```
- [ ] 包含所有必需字段
- [ ] 字段类型正确
- [ ] 使用 enum 定义状态

#### 5. 状态枚举验证
```solidity
enum GiftStatus {
    PENDING,
    CLAIMED,
    REFUNDED,
    EXPIRED
}
```
- [ ] 包含所有 4 种状态
- [ ] 命名清晰

#### 6. 核心函数验证

**createGift 函数**:
- [ ] 函数签名正确
- [ ] 支持 ETH（payable）
- [ ] 支持 ERC20（SafeERC20）
- [ ] 参数验证（recipient 非零地址、amount > 0、过期时间合理）
- [ ] 正确存储礼物数据
- [ ] 触发 GiftCreated 事件
- [ ] 返回 giftId
- [ ] 处理代币转账（SafeERC20.safeTransferFrom）

**claimGift 函数**:
- [ ] 函数签名正确
- [ ] 验证礼物存在
- [ ] 验证调用者是接收者
- [ ] 验证礼物未被领取
- [ ] 验证礼物未过期
- [ ] 更新状态为 CLAIMED
- [ ] 正确转账（ETH 或 ERC20）
- [ ] 触发 GiftClaimed 事件
- [ ] 防重入保护（nonReentrant）

**refundGift 函数**:
- [ ] 函数签名正确
- [ ] 验证调用者是发送者
- [ ] 验证礼物未被领取
- [ ] 验证礼物已过期
- [ ] 更新状态为 REFUNDED
- [ ] 正确退款
- [ ] 触发 GiftRefunded 事件

**getGift 函数**:
- [ ] 函数签名正确（view）
- [ ] 返回完整的 Gift 结构
- [ ] 处理不存在的 giftId（返回空或 revert）

#### 7. 事件定义验证
```solidity
event GiftCreated(uint256 indexed giftId, address indexed sender, address indexed recipient, address token, uint256 amount);
event GiftClaimed(uint256 indexed giftId, address indexed claimer, uint256 amount);
event GiftRefunded(uint256 indexed giftId, address indexed sender, uint256 amount);
```
- [ ] 事件名称正确
- [ ] 参数使用 indexed（方便过滤）
- [ ] 包含关键信息

#### 8. 错误定义验证
使用 custom errors（节省 gas）：
```solidity
error GiftNotFound();
error GiftAlreadyClaimed();
error GiftExpired();
error GiftNotExpired();
error NotGiftRecipient();
error NotGiftSender();
error InvalidAmount();
error InvalidRecipient();
error InvalidExpiration();
```
- [ ] 使用 custom errors 而非 require(msg)
- [ ] 错误命名清晰
- [ ] 覆盖所有错误场景

#### 9. 安全性检查
- [ ] 使用 OpenZeppelin 的 ReentrancyGuard
- [ ] 使用 SafeERC20 处理代币转账
- [ ] 检查地址非零（recipient）
- [ ] 检查金额大于 0
- [ ] 状态更新在转账之前（Checks-Effects-Interactions）
- [ ] 无整数溢出风险（Solidity 0.8.x 自动检查）

#### 10. Gas 优化检查
- [ ] 使用 custom errors
- [ ] 使用 uint256 而非小整数（省 gas）
- [ ] 合理使用 storage 和 memory
- [ ] 避免不必要的存储写入

#### 11. 代码注释检查
- [ ] 合约级别的 @title 和 @notice
- [ ] 每个函数有 @notice
- [ ] 复杂函数有 @dev 说明
- [ ] 参数有 @param 说明
- [ ] 返回值有 @return 说明
- [ ] 关键逻辑有行内注释

#### 12. 代码风格检查
- [ ] 遵循 Solidity Style Guide
- [ ] 命名规范（驼峰命名）
- [ ] 缩进一致（4 空格）
- [ ] 花括号位置正确
- [ ] 代码可读性好

#### 13. 功能完整性检查
参照红包 dApp PRD：
- [ ] 支持 ETH 原生代币 ✓
- [ ] 支持 ERC20 代币（未来扩展到 NFT）✓
- [ ] 支持自定义消息（祝福语）✓
- [ ] 支持有效期设置 ✓
- [ ] 支持领取和退回逻辑 ✓

**验收决策**:
- 如果所有 ✓ 都勾选 → ✅ **通过验收**，进入 ZES-70
- 如果有任何 ✗ → ❌ **需要修改**，列出具体问题

---

### ZES-70: NFT 礼物支持集成

#### 1. 合约更新检查
- [ ] DeGift.sol 已更新
- [ ] 继承 ERC721Holder
- [ ] 继承 ERC1155Receiver
- [ ] 编译通过

#### 2. NFT Gift 数据结构
```solidity
struct NFTGift {
    uint256 id;
    address sender;
    address recipient;
    address nftContract;
    uint256 tokenId;        // for ERC721
    uint256 amount;         // for ERC1155
    NftType nftType;        // enum: ERC721, ERC1155
    string message;
    uint256 createdAt;
    uint256 expiresAt;
    GiftStatus status;
}
```
- [ ] 数据结构定义正确
- [ ] 支持 ERC721 和 ERC1155

#### 3. NFT 功能验证
**createNFTGift 函数**:
- [ ] 支持 ERC721（tokenId）
- [ ] 支持 ERC1155（tokenId + amount）
- [ ] 使用 safeTransferFrom
- [ ] 验证合约地址有效
- [ ] 验证 NFT 所有权
- [ ] 触发 NFTGiftCreated 事件

**claimNFTGift 函数**:
- [ ] 正确转移 NFT 所有权
- [ ] 处理 ERC721
- [ ] 处理 ERC1155
- [ ] 防重入保护

**refundNFTGift 函数**:
- [ ] 正确退回 NFT
- [ ] 处理两种 NFT 类型

#### 4. 接口实现检查
- [ ] 实现 onERC721Received
- [ ] 实现 onERC1155Received
- [ ] 实现 onERC1155BatchReceived
- [ ] 返回正确的 selector

#### 5. 安全性验证
- [ ] NFT 合约地址验证
- [ ] NFT 所有权检查
- [ ] 防止重入攻击
- [ ] 防止 NFT 卡在合约中

**验收决策**: 所有检查通过 → 进入 ZES-71

---

### ZES-71: 合约测试和审计

#### 1. 测试文件检查
- [ ] 文件存在：`packages/contracts/test/DeGift.t.sol`
- [ ] 继承 Test（Foundry）
- [ ] 设置正确（setUp 函数）

#### 2. 测试覆盖率
运行命令：
```bash
forge coverage
```
- [ ] 整体覆盖率 > 95%
- [ ] createGift 覆盖率 100%
- [ ] claimGift 覆盖率 100%
- [ ] refundGift 覆盖率 100%
- [ ] NFT 相关函数覆盖率 100%

#### 3. 单元测试验证

**createGift 测试**:
- [ ] test_CreateGift_WithETH()
- [ ] test_CreateGift_WithERC20()
- [ ] test_CreateGift_RevertsOnZeroAmount()
- [ ] test_CreateGift_RevertsOnZeroRecipient()
- [ ] test_CreateGift_RevertsOnInvalidExpiration()
- [ ] test_CreateGift_EmitsEvent()

**claimGift 测试**:
- [ ] test_ClaimGift_Success()
- [ ] test_ClaimGift_RevertsIfNotRecipient()
- [ ] test_ClaimGift_RevertsIfAlreadyClaimed()
- [ ] test_ClaimGift_RevertsIfExpired()
- [ ] test_ClaimGift_RevertsIfNotFound()
- [ ] test_ClaimGift_TransfersCorrectAmount()

**refundGift 测试**:
- [ ] test_RefundGift_Success()
- [ ] test_RefundGift_RevertsIfNotSender()
- [ ] test_RefundGift_RevertsIfNotExpired()
- [ ] test_RefundGift_RevertsIfAlreadyClaimed()

**NFT 测试**:
- [ ] test_CreateNFTGift_ERC721()
- [ ] test_CreateNFTGift_ERC1155()
- [ ] test_ClaimNFTGift_ERC721()
- [ ] test_ClaimNFTGift_ERC1155()
- [ ] test_RefundNFTGift()

**边界条件测试**:
- [ ] test_MultipleGifts()
- [ ] test_GasOptimization()
- [ ] test_ReentrancyProtection()

#### 4. 安全审计清单

**重入攻击**:
- [ ] 所有状态修改函数都有 nonReentrant
- [ ] 遵循 CEI 模式（Checks-Effects-Interactions）
- [ ] 测试重入攻击场景

**访问控制**:
- [ ] 只有 recipient 可以 claim
- [ ] 只有 sender 可以 refund
- [ ] 验证测试通过

**整数处理**:
- [ ] 无溢出风险（0.8.x 自动检查）
- [ ] 边界值测试（0, max uint256）

**代币处理**:
- [ ] 使用 SafeERC20
- [ ] 正确处理转账失败
- [ ] 测试异常 ERC20（手续费型、黑名单）

**前置检查**:
- [ ] 所有输入都有验证
- [ ] 无法绕过检查

#### 5. Gas 审计
```bash
forge test --gas-report
```
- [ ] createGift gas < 150,000
- [ ] claimGift gas < 100,000
- [ ] refundGift gas < 80,000
- [ ] 与行业平均对比合理

#### 6. 测试执行验证
```bash
forge test -vvv
```
- [ ] 所有测试通过（100%）
- [ ] 无 failing tests
- [ ] 无 skipped tests

**验收决策**: 所有测试和审计通过 → 进入 ZES-72

---

### ZES-72: Base 测试网部署

#### 1. 部署脚本检查
- [ ] 文件存在：`packages/contracts/script/DeployDeGift.s.sol`
- [ ] 继承 Script
- [ ] 正确配置网络参数
- [ ] 部署逻辑正确

#### 2. 环境配置检查
```bash
# .env 文件
BASE_SEPOLIA_RPC_URL=...
PRIVATE_KEY=...
BASESCAN_API_KEY=...
```
- [ ] RPC URL 配置正确
- [ ] 私钥已配置（测试账户）
- [ ] BaseScan API Key 已配置

#### 3. 部署执行
```bash
forge script script/DeployDeGift.s.sol:DeployDeGift \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --broadcast \
  --verify
```
- [ ] 部署成功
- [ ] 获得合约地址
- [ ] 交易哈希记录

#### 4. 合约验证
- [ ] BaseScan 源码验证通过
- [ ] 可以在 BaseScan 查看合约
- [ ] 合约接口可见
- [ ] 读取函数可调用

#### 5. 功能验证测试
在测试网上进行实际操作：
- [ ] 创建 ETH 礼物（发送测试交易）
- [ ] 创建 ERC20 礼物
- [ ] 领取礼物
- [ ] 退回过期礼物
- [ ] 所有操作成功

#### 6. 文档更新
- [ ] 更新合约地址到 README.md
- [ ] 更新 .env.example
- [ ] 创建部署说明文档
- [ ] 记录部署参数

#### 7. 配置文件更新
```javascript
// apps/web/src/config/contracts.ts
export const DEGIFT_CONTRACT = {
  address: '0x...',  // Base Sepolia 地址
  abi: DeGiftABI
}
```
- [ ] 前端配置已更新
- [ ] 后端配置已更新
- [ ] ABI 文件已导出

**验收决策**: 部署验证通过 → ✅ **Phase 1 完成**

---

## Phase 2: 后端 API 验收标准

### ZES-73: 数据库 Schema 设计

#### 1. Prisma Schema 检查
文件：`apps/api/prisma/schema.prisma`

**Gift 模型**:
```prisma
model Gift {
  id          String      @id @default(uuid())
  giftId      String      @unique // 链上 ID
  txHash      String
  sender      String      // 地址
  recipient   String      // 地址
  token       String      // 代币地址，address(0) 表示 ETH
  amount      BigInt
  message     String      @db.VarChar(200)
  giftType    GiftType    // TOKEN, NFT
  status      GiftStatus
  createdAt   DateTime    @default(now())
  expiresAt   DateTime
  claimedAt   DateTime?

  // Relations
  senderId    String
  senderUser  User        @relation("SentGifts", fields: [senderId], references: [id])
  recipientId String
  recipientUser User      @relation("ReceivedGifts", fields: [recipientId], references: [id])
  claim       GiftClaim?

  @@index([sender])
  @@index([recipient])
  @@index([status])
  @@index([createdAt])
}

enum GiftType {
  TOKEN
  NFT
}

enum GiftStatus {
  PENDING
  CLAIMED
  REFUNDED
  EXPIRED
}
```
- [ ] 模型定义完整
- [ ] 字段类型正确
- [ ] 关系定义正确
- [ ] 索引设置合理

**GiftClaim 模型**:
```prisma
model GiftClaim {
  id        String   @id @default(uuid())
  giftId    String   @unique
  gift      Gift     @relation(fields: [giftId], references: [id])
  claimerId String
  claimer   User     @relation(fields: [claimerId], references: [id])
  amount    BigInt
  txHash    String
  claimedAt DateTime @default(now())

  @@index([claimerId])
  @@index([claimedAt])
}
```
- [ ] 模型定义完整
- [ ] 与 Gift 关系正确

#### 2. Migration 验证
```bash
cd apps/api
pnpm prisma migrate dev --name add_gift_models
```
- [ ] Migration 成功生成
- [ ] SQL 正确
- [ ] 数据库更新成功
- [ ] 无错误

#### 3. Prisma Client 生成
```bash
pnpm prisma generate
```
- [ ] Client 生成成功
- [ ] 类型正确
- [ ] 可以导入使用

**验收决策**: Schema 和 Migration 正确 → 进入 ZES-74

---

### ZES-74: 礼物 CRUD API 开发

#### 1. 路由文件检查
文件：`apps/api/src/routes/gifts.ts`
- [ ] 文件存在
- [ ] 导出 FastifyPluginAsync
- [ ] 注册到主应用

#### 2. API 端点验证

**POST /api/gifts - 创建礼物**:
```typescript
{
  recipient: string,
  token: string,
  amount: string,
  message: string,
  expiresAt: string
}
```
- [ ] 端点存在
- [ ] Zod Schema 验证
- [ ] 参数验证完整
- [ ] 调用合约服务
- [ ] 保存到数据库
- [ ] 返回礼物信息
- [ ] 错误处理

**GET /api/gifts/:id - 获取礼物详情**:
- [ ] 端点存在
- [ ] 参数验证（UUID）
- [ ] 查询数据库
- [ ] 返回完整信息
- [ ] 404 处理

**GET /api/gifts - 礼物列表**:
```
Query: page, limit, status, sender, recipient
```
- [ ] 端点存在
- [ ] 分页实现
- [ ] 筛选功能
- [ ] 排序功能
- [ ] 性能优化（索引使用）

**GET /api/gifts/sent - 我发送的礼物**:
- [ ] 需要认证
- [ ] 查询当前用户发送的礼物
- [ ] 分页

**GET /api/gifts/received - 我收到的礼物**:
- [ ] 需要认证
- [ ] 查询当前用户收到的礼物
- [ ] 分页

**PUT /api/gifts/:id/claim - 领取礼物**:
- [ ] 需要认证
- [ ] 验证用户是接收者
- [ ] 调用合约服务
- [ ] 更新数据库状态
- [ ] 返回交易信息

**PUT /api/gifts/:id/refund - 退回礼物**:
- [ ] 需要认证
- [ ] 验证用户是发送者
- [ ] 验证已过期
- [ ] 调用合约服务
- [ ] 更新状态

**GET /api/gifts/stats - 统计数据**:
```json
{
  "totalSent": 100,
  "totalReceived": 50,
  "totalAmount": "1000.00",
  "pendingCount": 10
}
```
- [ ] 返回统计信息
- [ ] 计算正确
- [ ] 性能可接受

#### 3. 服务层检查
文件：`apps/api/src/services/gift.service.ts`
- [ ] 文件存在
- [ ] GiftService 类定义
- [ ] 所有业务逻辑封装
- [ ] 数据库操作
- [ ] 错误处理

#### 4. API 测试
```bash
curl http://localhost:3001/api/gifts
```
- [ ] 所有端点可访问
- [ ] 返回格式正确
- [ ] 错误响应合理
- [ ] 性能可接受（< 200ms）

**验收决策**: 所有 API 正常工作 → 进入 ZES-75

---

### ZES-75: 合约交互服务层

#### 1. 服务文件检查
文件：`apps/api/src/services/gift-contract.service.ts`
- [ ] 文件存在
- [ ] GiftContractService 类
- [ ] 使用 viem

#### 2. 合约交互功能
**读取功能**:
- [ ] getGift(giftId)
- [ ] 正确解析返回数据
- [ ] 错误处理

**写入功能**:
- [ ] createGift(...)
- [ ] claimGift(giftId)
- [ ] refundGift(giftId)
- [ ] 返回交易哈希
- [ ] 等待确认

#### 3. 事件监听
- [ ] 监听 GiftCreated
- [ ] 监听 GiftClaimed
- [ ] 监听 GiftRefunded
- [ ] 事件处理器正确
- [ ] 更新数据库

#### 4. 错误处理
- [ ] 网络错误处理
- [ ] 合约 revert 处理
- [ ] Gas 估算失败处理
- [ ] 重试机制

**验收决策**: 合约交互稳定 → 进入 ZES-76

---

### ZES-76: 通知和事件处理

#### 1. Socket.IO 集成
文件：`apps/api/src/plugins/socket.ts`
- [ ] Socket.IO 配置
- [ ] Redis Adapter
- [ ] 命名空间设置

#### 2. 通知功能
**实时推送**:
- [ ] gift:created 事件
- [ ] gift:claimed 事件
- [ ] gift:refunded 事件
- [ ] 房间管理（按用户）

#### 3. 通知服务
文件：`apps/api/src/services/notification.service.ts`
- [ ] NotificationService 类
- [ ] 发送通知方法
- [ ] 通知队列（Redis）

**验收决策**: 通知正常工作 → ✅ **Phase 2 完成**

---

## Phase 3: 前端开发验收标准

### ZES-77~80: 前端任务验收

详细的前端验收标准包括：
- UI/UX 符合设计
- 功能完整性
- 响应式设计
- 性能指标
- 移动端体验

（具体标准根据开发进度补充）

---

## Phase 4: 集成测试与部署验收标准

### ZES-81~84: 测试和部署验收

详细的测试和部署验收标准包括：
- E2E 测试覆盖
- 性能基准达标
- 安全审计通过
- 部署成功验证

（具体标准根据开发进度补充）

---

## 📊 验收流程

### 1. 开发提交
开发 Claude 完成任务后，提交格式：
```
任务：ZES-XX 已完成
文件：xxx/xxx/xxx
主要实现：
- 功能1
- 功能2
测试：已通过
```

### 2. 项目经理验收
- 检查文件存在
- 运行编译/测试
- 对照验收清单逐项检查
- 运行功能测试

### 3. 验收结果
**✅ 通过**:
```
验收通过！
ZES-XX 已完成，可以进入 ZES-YY
更新 Linear 状态：Done
```

**❌ 需要修改**:
```
验收未通过，需要修改：
1. 问题1描述
2. 问题2描述
请修改后重新提交验收
```

### 4. 更新状态
项目经理在 Linear 中更新任务状态

---

**文档版本**: v1.0
**最后更新**: 2025-11-03
