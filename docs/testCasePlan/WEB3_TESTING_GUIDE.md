# Web3 自动化测试完整方案

## 📦 安装依赖

```bash
# 1. Foundry (智能合约测试)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# 2. Synpress (E2E 钱包测试)
pnpm add -D @synthetixio/synpress @playwright/test

# 3. Viem Test Utils (集成测试)
pnpm add -D viem anvil

# 4. 其他测试工具
pnpm add -D vitest @vitest/ui c8
```

## 📂 测试目录结构

```
teemi.ai/
├── contracts/
│   └── test/                      # ✅ Foundry 合约测试
│       ├── TimeLockEscrow.t.sol
│       ├── TeemiShield.t.sol
│       └── StealthKeyRegistry.t.sol
│
├── apps/backend/
│   └── tests/
│       ├── unit/                  # ✅ 单元测试 (Mock)
│       │   ├── services/
│       │   └── utils/
│       └── integration/           # ✅ 集成测试 (真实链)
│           ├── escrow.test.ts
│           ├── privacy.test.ts
│           └── friend.test.ts
│
├── apps/frontend/
│   └── tests/
│       ├── unit/                  # ✅ 组件单元测试
│       │   └── components/
│       └── e2e/                   # ✅ E2E 测试 (Synpress)
│           ├── auth.spec.ts
│           ├── escrow-flow.spec.ts
│           ├── privacy-flow.spec.ts
│           └── friend-flow.spec.ts
│
└── tests/                         # 全局测试
    ├── fixtures/                  # 测试数据
    ├── helpers/                   # 测试辅助函数
    └── setup/                     # 测试环境设置
```

## 🎯 测试策略

### 1. 智能合约测试 (Foundry) - 95% 覆盖率目标

**特点**: 
- ⚡ 超快速 (毫秒级)
- 🎯 完全隔离,无外部依赖
- 🔄 支持时间快进、区块跳转
- 📊 内置 Gas 报告和覆盖率

**适用场景**:
- 所有合约逻辑
- 边界条件测试
- Gas 优化验证
- 漏洞检测

**运行命令**:
```bash
cd contracts
forge test                    # 运行所有测试
forge test -vvv               # 详细输出
forge test --match-test testCreatePayment  # 运行特定测试
forge coverage                # 覆盖率报告
forge snapshot                # Gas 快照
```

### 2. 后端集成测试 (Vitest + Viem + Anvil) - 80% 覆盖率目标

**特点**:
- 🔗 使用真实的本地区块链
- 🤖 完全自动化,无需手动操作
- 🔍 验证链上+链下数据一致性
- ⚙️ 可控制的测试环境

**测试流程**:
```typescript
1. 启动 Anvil 本地链
2. 部署合约到本地链
3. 使用测试账户发送交易
4. 验证链上状态
5. 验证后端数据库同步
6. 清理测试数据
```

**启动测试链**:
```bash
# Terminal 1: 启动 Anvil
anvil --port 8545 --chain-id 31337

# Terminal 2: 部署合约
cd contracts
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast

# Terminal 3: 运行集成测试
cd apps/backend
pnpm test:integration
```

### 3. 前端 E2E 测试 (Playwright + Synpress) - 关键路径覆盖

**特点**:
- 🦊 自动控制 MetaMask
- 🎭 模拟真实用户行为
- 📸 失败时自动截图和录制
- 🌐 支持多浏览器

**核心优势**:
```typescript
// ❌ 传统方式: 手动点击 MetaMask 100+ 次
// ✅ Synpress: 自动化所有钱包交互

await metamask.connectToDapp()         // 自动连接
await metamask.confirmTransaction()    // 自动确认交易
await metamask.confirmSignature()      // 自动签名
await metamask.switchNetwork('Sepolia') // 自动切换网络
await metamask.rejectTransaction()     // 测试拒绝场景
```

**运行命令**:
```bash
# 安装 Synpress
npx synpress install

# 运行 E2E 测试
pnpm test:e2e

# 调试模式 (带 UI)
pnpm test:e2e --ui

# 只运行特定测试
pnpm test:e2e escrow-flow.spec.ts
```

### 4. 前端单元测试 (Vitest + Testing Library) - 80% 覆盖率

**特点**:
- 🎨 测试组件逻辑
- 🚫 Mock 所有外部依赖 (钱包、API)
- ⚡ 快速反馈

**运行命令**:
```bash
cd apps/frontend
pnpm test              # 运行所有单元测试
pnpm test:ui           # UI 模式
pnpm test:coverage     # 覆盖率报告
```

## 🔧 关键技术点

### 1. 如何 Mock 钱包连接?

```typescript
// tests/mocks/wagmi.ts
import { vi } from 'vitest'

export const mockWagmiConfig = {
  useAccount: vi.fn(() => ({
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    isConnected: true,
    chain: { id: 11155111, name: 'Sepolia' }
  })),
  
  useWalletClient: vi.fn(() => ({
    data: mockWalletClient,
    isSuccess: true
  })),
  
  useWriteContract: vi.fn(() => ({
    writeContract: vi.fn().mockResolvedValue('0x123...'),
    isPending: false
  }))
}

// 在测试中使用
import { mockWagmiConfig } from './mocks/wagmi'

vi.mock('wagmi', () => mockWagmiConfig)

test('创建托管按钮', async () => {
  render(<CreateEscrowButton />)
  
  await userEvent.click(screen.getByText('Create Escrow'))
  
  expect(mockWagmiConfig.useWriteContract().writeContract)
    .toHaveBeenCalledWith(...)
})
```

### 2. 如何测试异步的链上交易?

```typescript
// tests/helpers/blockchain.ts
export async function waitForTransaction(
  client: PublicClient,
  hash: Hash,
  timeout = 30000
) {
  const startTime = Date.now()
  
  while (Date.now() - startTime < timeout) {
    const receipt = await client.getTransactionReceipt({ hash })
    if (receipt) return receipt
    
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  throw new Error('Transaction timeout')
}

// 使用
test('创建托管', async () => {
  const hash = await createEscrow(...)
  const receipt = await waitForTransaction(client, hash)
  
  expect(receipt.status).toBe('success')
  
  // 等待后端同步
  await waitForBackendSync(3000)
  
  // 验证数据库
  const escrow = await prisma.escrow.findUnique({ 
    where: { transactionHash: hash } 
  })
  expect(escrow.status).toBe('CONFIRMED')
})
```

### 3. 如何处理 Gas 费和余额问题?

```typescript
// 使用 Anvil 的预充值账户
const testAccounts = [
  {
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    balance: parseEther('10000') // 10000 ETH
  },
  // ... 其他 9 个账户
]

// 如果需要更多余额
await client.setBalance({
  address: testAccount,
  value: parseEther('100000')
})

// 如果需要特定代币
await client.writeContract({
  address: tokenAddress,
  abi: erc20ABI,
  functionName: 'mint',
  args: [testAccount, parseEther('1000')]
})
```

### 4. 如何测试时间锁定功能?

```typescript
// Foundry 测试 (Solidity)
vm.warp(block.timestamp + 1 days);  // 快进1天
vm.roll(block.number + 100);        // 跳过100个区块

// Viem 测试 (TypeScript)
await client.increaseTime({ seconds: 3600 })  // 快进1小时
await client.mine({ blocks: 1 })               // 挖一个区块

// 现在可以测试时间依赖的逻辑
const canRelease = await escrowContract.read.canRelease([paymentId])
expect(canRelease).toBe(true)
```

## 📋 测试检查清单

### ✅ 智能合约测试

- [ ] 正常创建托管
- [ ] 托管释放 (时间到期)
- [ ] 提前释放 (发送方)
- [ ] 退款 (接收方)
- [ ] 争议发起
- [ ] 权限控制
- [ ] 边界条件 (金额=0, 时间=0)
- [ ] 重入攻击防护
- [ ] Gas 优化

### ✅ 后端集成测试

- [ ] 区块链事件监听
- [ ] 数据库同步
- [ ] 通知推送
- [ ] 好友关系管理
- [ ] 隐私支付扫描
- [ ] API 端点测试

### ✅ E2E 测试

- [ ] 钱包连接流程
- [ ] 网络切换
- [ ] 创建托管完整流程
- [ ] 释放托管
- [ ] 发起争议
- [ ] 隐私支付发送
- [ ] 隐私支付接收
- [ ] 好友添加
- [ ] 聊天发送
- [ ] 通知接收
- [ ] 用户拒绝交易
- [ ] 交易失败处理
- [ ] 余额不足场景

## 🚀 CI/CD 集成

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  contracts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install Foundry
        uses: foundry-rs/foundry-toolchain@v1
      - name: Run tests
        run: |
          cd contracts
          forge test
          forge coverage
  
  backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
      redis:
        image: redis:7
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - name: Install dependencies
        run: pnpm install
      - name: Run Anvil
        run: anvil &
      - name: Run tests
        run: pnpm test:integration
  
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - name: Install dependencies
        run: pnpm install
      - name: Install Synpress
        run: npx synpress install
      - name: Run E2E tests
        run: pnpm test:e2e
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
```

## 📊 测试覆盖率目标

| 层级 | 目标覆盖率 | 优先级 |
|------|-----------|--------|
| 智能合约 | 95%+ | 🔴 最高 |
| 后端 API | 80%+ | 🟠 高 |
| 前端组件 | 70%+ | 🟡 中 |
| E2E 流程 | 关键路径 | 🟠 高 |

## 🎓 最佳实践

### 1. 测试金字塔

```
         /\
        /E2\      ← 少量 E2E (慢但全面)
       /----\
      / 集成 \    ← 适量集成测试
     /--------\
    /   单元   \  ← 大量单元测试 (快速)
   /____________\
```

### 2. 测试独立性

```typescript
// ✅ 好的做法
beforeEach(async () => {
  await setupTestEnvironment()
  await deployContracts()
  await seedDatabase()
})

afterEach(async () => {
  await cleanupDatabase()
  await resetBlockchain()
})

// ❌ 避免测试间依赖
test('test1', () => {
  globalState.value = 123  // 污染全局状态
})

test('test2', () => {
  expect(globalState.value).toBe(123)  // 依赖上一个测试
})
```

### 3. 使用测试标签

```typescript
test.skip('待实现的功能', () => {})
test.only('只运行这个', () => {})
test.todo('TODO: 添加争议测试')

// 按标签运行
pnpm test --grep "@critical"
pnpm test --grep "@escrow"
```

## 🔍 调试技巧

### 1. Foundry 调试

```bash
# 详细输出
forge test -vvvv

# 追踪特定调用
forge test --match-test testCreatePayment -vvvv

# 调试失败的测试
forge test --debug testFailingTest
```

### 2. Playwright 调试

```bash
# UI 模式
pnpm test:e2e --ui

# 调试模式
pnpm test:e2e --debug

# 追踪模式
pnpm test:e2e --trace on
```

### 3. 查看 Anvil 日志

```bash
# 详细模式启动
anvil -vvv

# 查看交易详情
cast tx <HASH> --rpc-url http://localhost:8545
cast receipt <HASH> --rpc-url http://localhost:8545
```

## 📚 参考资源

- [Foundry Book](https://book.getfoundry.sh/)
- [Synpress 文档](https://synpress.io/)
- [Viem 测试工具](https://viem.sh/docs/test.html)
- [Playwright 文档](https://playwright.dev/)
- [Vitest 文档](https://vitest.dev/)
