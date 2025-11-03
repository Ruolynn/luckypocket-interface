// tests/integration/escrow-complete-flow.test.ts
/**
 * 完整的托管支付流程集成测试
 * 展示如何测试从链上交易到后端同步的完整流程
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { parseEther, type Address } from 'viem'
import {
  createTestBlockchainClient,
  TEST_ACCOUNTS,
  waitForTransaction,
  increaseTime,
  getContractEvents,
  executeContract,
  waitForBackendSync,
  BlockchainSnapshot
} from '../helpers/blockchain-utils'
import {
  getTestDatabase,
  cleanDatabase,
  createTestUser
} from '../helpers/database-utils'
import { expectAddress, expectTxHash } from '../helpers/assertions'

describe('托管支付完整流程', () => {
  let client: any
  let escrowContract: Address
  let snapshot: BlockchainSnapshot
  const db = getTestDatabase()
  
  beforeAll(async () => {
    // 1. 连接到本地测试链 (Anvil)
    client = createTestBlockchainClient()
    
    // 2. 部署合约 (实际项目中应该从环境变量读取)
    escrowContract = '0x5FbDB2315678afecb367f032d93F642f64180aa3' as Address
    
    // 3. 创建测试用户
    await createTestUser({
      address: TEST_ACCOUNTS.alice.address,
      username: 'alice'
    })
    await createTestUser({
      address: TEST_ACCOUNTS.bob.address,
      username: 'bob'
    })
  })
  
  beforeEach(async () => {
    // 每个测试前创建快照
    snapshot = new BlockchainSnapshot(client)
    await snapshot.take()
  })
  
  afterEach(async () => {
    // 每个测试后恢复快照 (保持链状态干净)
    await snapshot.restore()
    
    // 清理数据库
    await db.escrow.deleteMany()
  })
  
  afterAll(async () => {
    await cleanDatabase()
    await db.$disconnect()
  })
  
  it('✅ 完整流程: 创建 → 确认 → 释放', async () => {
    // ====== 1. 创建托管支付 ======
    console.log('📝 步骤 1: 创建托管支付...')
    
    const amount = parseEther('1')
    const unlockTime = BigInt(Math.floor(Date.now() / 1000) + 3600) // 1小时后
    
    const createHash = await client.writeContract({
      address: escrowContract,
      abi: ESCROW_ABI,
      functionName: 'createPayment',
      args: [
        TEST_ACCOUNTS.bob.address,
        '0x0000000000000000000000000000000000000000', // ETH
        unlockTime
      ],
      value: amount,
      account: TEST_ACCOUNTS.alice.address
    })
    
    console.log(`   ✓ 交易已发送: ${createHash}`)
    expectTxHash(createHash)
    
    // 等待交易确认
    const receipt = await waitForTransaction(client, createHash)
    expect(receipt.status).toBe('success')
    console.log(`   ✓ 交易已确认,Gas 使用: ${receipt.gasUsed}`)
    
    // ====== 2. 验证链上事件 ======
    console.log('📡 步骤 2: 验证链上事件...')
    
    const events = await getContractEvents(
      client,
      escrowContract,
      ESCROW_ABI,
      'PaymentCreated',
      receipt.blockNumber
    )
    
    expect(events).toHaveLength(1)
    const event = events[0].args
    
    expect(event.sender.toLowerCase()).toBe(TEST_ACCOUNTS.alice.address.toLowerCase())
    expect(event.receiver.toLowerCase()).toBe(TEST_ACCOUNTS.bob.address.toLowerCase())
    expect(event.amount).toBe(amount)
    
    const paymentId = event.paymentId
    console.log(`   ✓ 事件已触发,托管 ID: ${paymentId}`)
    
    // ====== 3. 等待后端同步 ======
    console.log('🔄 步骤 3: 等待后端同步...')
    
    await waitForBackendSync(async () => {
      const escrow = await db.escrow.findFirst({
        where: { transactionHash: createHash }
      })
      return escrow?.status === 'CONFIRMED'
    }, { timeout: 10000, interval: 500 })
    
    // 验证数据库记录
    const escrow = await db.escrow.findFirst({
      where: { transactionHash: createHash }
    })
    
    expect(escrow).not.toBeNull()
    expect(escrow!.sender.toLowerCase()).toBe(TEST_ACCOUNTS.alice.address.toLowerCase())
    expect(escrow!.receiver.toLowerCase()).toBe(TEST_ACCOUNTS.bob.address.toLowerCase())
    expect(escrow!.amount).toBe(amount.toString())
    expect(escrow!.status).toBe('CONFIRMED')
    console.log(`   ✓ 数据库已同步,状态: ${escrow!.status}`)
    
    // ====== 4. 时间快进 ======
    console.log('⏰ 步骤 4: 时间快进到解锁时间...')
    
    await increaseTime(client, 3700) // 快进 1小时+100秒
    console.log('   ✓ 时间已快进')
    
    // ====== 5. 释放托管 ======
    console.log('💰 步骤 5: 接收方释放托管...')
    
    const bobBalanceBefore = await client.getBalance({
      address: TEST_ACCOUNTS.bob.address
    })
    
    const releaseHash = await executeContract(
      client,
      escrowContract,
      ESCROW_ABI,
      'release',
      [paymentId]
    )
    
    console.log(`   ✓ 释放交易已确认: ${releaseHash.transactionHash}`)
    
    // 验证余额变化
    const bobBalanceAfter = await client.getBalance({
      address: TEST_ACCOUNTS.bob.address
    })
    
    // Bob 应该收到 1 ETH (减去一点 Gas)
    const received = bobBalanceAfter - bobBalanceBefore
    expect(received).toBeGreaterThan(parseEther('0.99')) // 考虑 Gas 费用
    console.log(`   ✓ Bob 收到: ${received} wei`)
    
    // ====== 6. 验证最终状态 ======
    console.log('✅ 步骤 6: 验证最终状态...')
    
    await waitForBackendSync(async () => {
      const updated = await db.escrow.findFirst({
        where: { transactionHash: createHash }
      })
      return updated?.status === 'RELEASED'
    })
    
    const finalEscrow = await db.escrow.findFirst({
      where: { transactionHash: createHash }
    })
    
    expect(finalEscrow!.status).toBe('RELEASED')
    console.log('   ✓ 托管状态已更新为 RELEASED')
    
    console.log('\n🎉 完整流程测试通过!')
  })
  
  it('✅ 提前释放场景', async () => {
    // 创建托管
    const amount = parseEther('0.5')
    const unlockTime = BigInt(Math.floor(Date.now() / 1000) + 7200) // 2小时后
    
    const createHash = await client.writeContract({
      address: escrowContract,
      abi: ESCROW_ABI,
      functionName: 'createPayment',
      args: [TEST_ACCOUNTS.bob.address, '0x0000000000000000000000000000000000000000', unlockTime],
      value: amount,
      account: TEST_ACCOUNTS.alice.address
    })
    
    const receipt = await waitForTransaction(client, createHash)
    const events = await getContractEvents(
      client,
      escrowContract,
      ESCROW_ABI,
      'PaymentCreated',
      receipt.blockNumber
    )
    const paymentId = events[0].args.paymentId
    
    // 等待后端同步
    await waitForBackendSync(async () => {
      const escrow = await db.escrow.findFirst({
        where: { transactionHash: createHash }
      })
      return escrow?.status === 'CONFIRMED'
    })
    
    // 发送方提前释放 (无需等待解锁时间)
    const releaseHash = await client.writeContract({
      address: escrowContract,
      abi: ESCROW_ABI,
      functionName: 'releaseEarly',
      args: [paymentId],
      account: TEST_ACCOUNTS.alice.address
    })
    
    await waitForTransaction(client, releaseHash)
    
    // 验证状态更新
    await waitForBackendSync(async () => {
      const updated = await db.escrow.findFirst({
        where: { transactionHash: createHash }
      })
      return updated?.status === 'RELEASED'
    })
    
    const finalEscrow = await db.escrow.findFirst({
      where: { transactionHash: createHash }
    })
    
    expect(finalEscrow!.status).toBe('RELEASED')
  })
  
  it('✅ 退款场景', async () => {
    // 创建托管
    const amount = parseEther('0.3')
    const unlockTime = BigInt(Math.floor(Date.now() / 1000) + 3600)
    
    const createHash = await client.writeContract({
      address: escrowContract,
      abi: ESCROW_ABI,
      functionName: 'createPayment',
      args: [TEST_ACCOUNTS.bob.address, '0x0000000000000000000000000000000000000000', unlockTime],
      value: amount,
      account: TEST_ACCOUNTS.alice.address
    })
    
    const receipt = await waitForTransaction(client, createHash)
    const events = await getContractEvents(
      client,
      escrowContract,
      ESCROW_ABI,
      'PaymentCreated',
      receipt.blockNumber
    )
    const paymentId = events[0].args.paymentId
    
    await waitForBackendSync(async () => {
      const escrow = await db.escrow.findFirst({
        where: { transactionHash: createHash }
      })
      return escrow !== null
    })
    
    // 接收方请求退款
    const aliceBalanceBefore = await client.getBalance({
      address: TEST_ACCOUNTS.alice.address
    })
    
    const refundHash = await client.writeContract({
      address: escrowContract,
      abi: ESCROW_ABI,
      functionName: 'refund',
      args: [paymentId],
      account: TEST_ACCOUNTS.bob.address
    })
    
    await waitForTransaction(client, refundHash)
    
    // 验证 Alice 收到退款
    const aliceBalanceAfter = await client.getBalance({
      address: TEST_ACCOUNTS.alice.address
    })
    
    expect(aliceBalanceAfter).toBeGreaterThan(aliceBalanceBefore)
    
    // 验证状态
    await waitForBackendSync(async () => {
      const updated = await db.escrow.findFirst({
        where: { transactionHash: createHash }
      })
      return updated?.status === 'REFUNDED'
    })
    
    const finalEscrow = await db.escrow.findFirst({
      where: { transactionHash: createHash }
    })
    
    expect(finalEscrow!.status).toBe('REFUNDED')
  })
  
  it('❌ 错误场景: 未到时间不能释放', async () => {
    const amount = parseEther('1')
    const unlockTime = BigInt(Math.floor(Date.now() / 1000) + 3600)
    
    const createHash = await client.writeContract({
      address: escrowContract,
      abi: ESCROW_ABI,
      functionName: 'createPayment',
      args: [TEST_ACCOUNTS.bob.address, '0x0000000000000000000000000000000000000000', unlockTime],
      value: amount,
      account: TEST_ACCOUNTS.alice.address
    })
    
    const receipt = await waitForTransaction(client, createHash)
    const events = await getContractEvents(
      client,
      escrowContract,
      ESCROW_ABI,
      'PaymentCreated',
      receipt.blockNumber
    )
    const paymentId = events[0].args.paymentId
    
    // 尝试提前释放 (不是发送方)
    await expect(
      client.writeContract({
        address: escrowContract,
        abi: ESCROW_ABI,
        functionName: 'release',
        args: [paymentId],
        account: TEST_ACCOUNTS.bob.address
      })
    ).rejects.toThrow()
  })
})

// 简化的合约 ABI
const ESCROW_ABI = [
  {
    name: 'createPayment',
    type: 'function',
    inputs: [
      { name: 'receiver', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'unlockTime', type: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'payable'
  },
  {
    name: 'release',
    type: 'function',
    inputs: [{ name: 'paymentId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    name: 'releaseEarly',
    type: 'function',
    inputs: [{ name: 'paymentId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    name: 'refund',
    type: 'function',
    inputs: [{ name: 'paymentId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    name: 'PaymentCreated',
    type: 'event',
    inputs: [
      { name: 'paymentId', type: 'uint256', indexed: true },
      { name: 'sender', type: 'address', indexed: true },
      { name: 'receiver', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256' },
      { name: 'token', type: 'address' },
      { name: 'unlockTime', type: 'uint256' }
    ]
  }
] as const
