# 🚀 DeGift 项目开发任务

你好！欢迎加入 DeGift 项目开发。

---

## 📋 项目信息

**项目名称**: DeGift - 去中心化礼物系统
**代码仓库**: `/Users/lushengqi/工作间/Github/HongBao`
**项目周期**: 5 周
**你的角色**: 开发工程师（负责所有代码实现）

---

## 🎯 第一个任务：ZES-69

### 任务名称
DeGift 智能合约设计和开发

### 任务目标
创建 DeGift 智能合约，支持基础的礼物创建、领取和退回功能。

### 具体要求

1. **创建新文件**：`packages/contracts/src/DeGift.sol`

2. **必须实现的功能**：
   ```solidity
   // 创建礼物
   function createGift(
       address recipient,
       address token,
       uint256 amount,
       string memory message,
       uint256 expiresAt
   ) external payable returns (uint256 giftId);

   // 领取礼物
   function claimGift(uint256 giftId) external;

   // 退回礼物
   function refundGift(uint256 giftId) external;

   // 查询礼物
   function getGift(uint256 giftId) external view returns (Gift memory);
   ```

3. **技术要求**：
   - Solidity 0.8.20
   - 使用 OpenZeppelin 库
   - 支持 ETH 和 ERC20 代币
   - 完整的 NatSpec 注释
   - Gas 优化（使用 custom errors）
   - 防重入保护

4. **参考资料**：
   - 现有合约：`packages/contracts/src/HongBaoPacket.sol`
   - 产品文档：`docs/红包dApp-PRD.md`
   - 开发指引：`docs/DeGift开发启动指引.md`（详细说明）

### 验收标准

完成后需要通过以下检查：
- [ ] 合约编译通过（`forge build`）
- [ ] 所有核心函数已实现
- [ ] 完整的事件和错误定义
- [ ] 代码有完整注释
- [ ] 符合安全规范

详细验收标准见：`docs/DeGift验收标准.md`

---

## 📖 重要文档

| 文档 | 位置 | 说明 |
|------|------|------|
| **开发指引** | `docs/DeGift开发启动指引.md` | 详细的任务说明和要求 |
| **验收标准** | `docs/DeGift验收标准.md` | 项目经理的验收清单 |
| **产品需求** | `docs/红包dApp-PRD.md` | 产品功能需求 |
| **参考合约** | `packages/contracts/src/HongBaoPacket.sol` | 现有红包合约 |

---

## 🔄 工作流程

### 1. 开始任务
告诉项目经理你开始了：
```
"我开始开发 ZES-69 - DeGift 智能合约"
```

### 2. 开发过程
- 阅读参考文档
- 创建合约文件
- 实现核心功能
- 添加注释
- 自测编译

### 3. 完成后提交验收
格式如下：
```
ZES-69 已完成，请验收。

文件位置：packages/contracts/src/DeGift.sol
编译状态：通过（forge build）

主要实现：
- createGift 函数（支持 ETH 和 ERC20）
- claimGift 函数（防重入保护）
- refundGift 函数（过期验证）
- getGift 查询函数
- 完整的事件和错误定义
- NatSpec 注释

自检情况：
- ✓ 编译通过，无警告
- ✓ 所有函数实现完整
- ✓ 使用 custom errors
- ✓ 添加了 ReentrancyGuard
- ✓ 代码注释完整
```

### 4. 等待验收
项目经理会检查代码并反馈：
- ✅ **通过** → 开始下一个任务 ZES-70
- ❌ **需要修改** → 根据反馈修改后重新提交

---

## ⚠️ 重要提醒

1. **按顺序开发**：必须完成 ZES-69 → ZES-70 → ZES-71 → ZES-72...
2. **等待验收**：每个任务完成后必须通过验收才能继续
3. **及时反馈**：遇到问题立即告诉项目经理
4. **质量优先**：不要为了赶进度而降低代码质量

---

## 💬 日常沟通

**每日结束时**，简单汇报进度：
```
今日进度：
- 已完成：合约结构设计，createGift 函数
- 进行中：claimGift 函数开发
- 明天计划：完成 refundGift 和自测
- 遇到问题：无
```

**遇到问题时**：
```
遇到技术问题：
问题：不确定如何最优地存储礼物数据
尝试：参考了 HongBaoPacket 的实现
需要帮助：是否有更好的方案？
```

---

## 🎯 现在开始！

**当前任务**: ZES-69 - DeGift 智能合约设计和开发
**预计时间**: 3-4 天
**参考文档**: `docs/DeGift开发启动指引.md`

请告诉我你开始了，然后我会在 Linear 中更新状态。

祝开发顺利！💪

---

**项目经理**: Claude PM
**发布日期**: 2025-11-03
