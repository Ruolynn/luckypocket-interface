// tests/helpers/blockchain-utils.ts
import { 
  createTestClient, 
  http, 
  publicActions, 
  walletActions,
  parseEther,
  type Address,
  type Hash,
  type PublicClient,
  type WalletClient
} from 'viem'
import { foundry } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

/**
 * 测试账户池 (Anvil 预设账户)
 */
export const TEST_ACCOUNTS = {
  alice: {
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as Address,
    privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as Hash
  },
  bob: {
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as Address,
    privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d' as Hash
  },
  charlie: {
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' as Address,
    privateKey: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a' as Hash
  }
}

/**
 * 创建测试客户端
 */
export function createTestBlockchainClient() {
  return createTestClient({
    chain: foundry,
    mode: 'anvil',
    transport: http('http://127.0.0.1:8545')
  })
    .extend(publicActions)
    .extend(walletActions)
}

/**
 * 等待交易确认
 */
export async function waitForTransaction(
  client: PublicClient,
  hash: Hash,
  options?: {
    timeout?: number
    confirmations?: number
  }
) {
  const { timeout = 30000, confirmations = 1 } = options || {}
  
  const receipt = await client.waitForTransactionReceipt({
    hash,
    timeout,
    confirmations
  })
  
  if (receipt.status !== 'success') {
    throw new Error(`Transaction failed: ${hash}`)
  }
  
  return receipt
}

/**
 * 时间快进
 */
export async function increaseTime(
  client: WalletClient,
  seconds: number
) {
  await client.increaseTime({ seconds })
  await client.mine({ blocks: 1 })
}

/**
 * 获取最新区块
 */
export async function getLatestBlock(client: PublicClient) {
  return await client.getBlock({ blockTag: 'latest' })
}

/**
 * 设置账户余额
 */
export async function setBalance(
  client: WalletClient,
  address: Address,
  balance: bigint
) {
  await client.setBalance({ address, value: balance })
}

/**
 * 部署测试合约 (简化版)
 */
export async function deployTestContract(
  client: WalletClient & PublicClient,
  bytecode: Hash,
  abi: any[],
  args: any[] = []
) {
  const hash = await client.deployContract({
    abi,
    bytecode,
    args,
    account: TEST_ACCOUNTS.alice.address
  })
  
  const receipt = await waitForTransaction(client, hash)
  return receipt.contractAddress as Address
}

/**
 * 获取合约事件
 */
export async function getContractEvents(
  client: PublicClient,
  address: Address,
  abi: any[],
  eventName: string,
  fromBlock?: bigint
) {
  const latestBlock = await client.getBlockNumber()
  
  return await client.getContractEvents({
    address,
    abi,
    eventName,
    fromBlock: fromBlock || latestBlock - 100n,
    toBlock: latestBlock
  })
}

/**
 * 执行合约调用并等待确认
 */
export async function executeContract(
  client: WalletClient & PublicClient,
  address: Address,
  abi: any[],
  functionName: string,
  args: any[] = [],
  value?: bigint
) {
  const hash = await client.writeContract({
    address,
    abi,
    functionName,
    args,
    value,
    account: TEST_ACCOUNTS.alice.address
  })
  
  return await waitForTransaction(client, hash)
}

/**
 * 创建测试钱包账户
 */
export function createTestAccount(privateKey: Hash) {
  return privateKeyToAccount(privateKey)
}

/**
 * 获取 ERC20 代币余额
 */
export async function getTokenBalance(
  client: PublicClient,
  tokenAddress: Address,
  accountAddress: Address
) {
  return await client.readContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [accountAddress]
  })
}

/**
 * 批准 ERC20 代币
 */
export async function approveToken(
  client: WalletClient & PublicClient,
  tokenAddress: Address,
  spender: Address,
  amount: bigint,
  account: Address = TEST_ACCOUNTS.alice.address
) {
  const hash = await client.writeContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [spender, amount],
    account
  })
  
  return await waitForTransaction(client, hash)
}

/**
 * 等待后端同步 (轮询数据库)
 */
export async function waitForBackendSync(
  checkFn: () => Promise<boolean>,
  options?: {
    timeout?: number
    interval?: number
  }
) {
  const { timeout = 10000, interval = 500 } = options || {}
  const startTime = Date.now()
  
  while (Date.now() - startTime < timeout) {
    if (await checkFn()) {
      return true
    }
    await new Promise(resolve => setTimeout(resolve, interval))
  }
  
  throw new Error('Backend sync timeout')
}

/**
 * 快照和恢复状态 (用于测试隔离)
 */
export class BlockchainSnapshot {
  private snapshotId?: Hash
  
  constructor(private client: WalletClient) {}
  
  async take() {
    this.snapshotId = await this.client.snapshot()
  }
  
  async restore() {
    if (!this.snapshotId) {
      throw new Error('No snapshot to restore')
    }
    await this.client.revert({ id: this.snapshotId })
  }
}

// ERC20 标准 ABI (简化版)
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: 'success', type: 'bool' }],
    stateMutability: 'nonpayable'
  }
] as const

// tests/helpers/database-utils.ts
import { PrismaClient } from '@teemi/database'

let prisma: PrismaClient

/**
 * 获取测试数据库实例
 */
export function getTestDatabase() {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/teemi_test'
        }
      }
    })
  }
  return prisma
}

/**
 * 清理数据库
 */
export async function cleanDatabase() {
  const db = getTestDatabase()
  
  // 按照依赖顺序删除
  await db.notification.deleteMany()
  await db.message.deleteMany()
  await db.dispute.deleteMany()
  await db.privatePayment.deleteMany()
  await db.escrow.deleteMany()
  await db.friendship.deleteMany()
  await db.friendRequest.deleteMany()
  await db.user.deleteMany()
}

/**
 * 创建测试用户
 */
export async function createTestUser(data?: Partial<{
  address: string
  username: string
  bio: string
}>) {
  const db = getTestDatabase()
  
  return await db.user.create({
    data: {
      address: data?.address || TEST_ACCOUNTS.alice.address,
      username: data?.username || 'test-user',
      bio: data?.bio || 'Test bio'
    }
  })
}

/**
 * 创建测试托管
 */
export async function createTestEscrow(data?: Partial<{
  sender: string
  receiver: string
  amount: string
  token: string
  unlockTime: Date
}>) {
  const db = getTestDatabase()
  
  return await db.escrow.create({
    data: {
      onChainId: Math.floor(Math.random() * 10000),
      sender: data?.sender || TEST_ACCOUNTS.alice.address,
      receiver: data?.receiver || TEST_ACCOUNTS.bob.address,
      token: data?.token || '0x0000000000000000000000000000000000000000',
      amount: data?.amount || '1000000000000000000',
      unlockTime: data?.unlockTime || new Date(Date.now() + 3600000),
      status: 'CONFIRMED',
      transactionHash: '0x' + '1'.repeat(64)
    }
  })
}

// tests/helpers/test-fixtures.ts
/**
 * 测试数据工厂
 */
export const TestFixtures = {
  user: (overrides?: any) => ({
    address: TEST_ACCOUNTS.alice.address,
    username: 'test-user',
    bio: 'Test bio',
    ...overrides
  }),
  
  escrow: (overrides?: any) => ({
    sender: TEST_ACCOUNTS.alice.address,
    receiver: TEST_ACCOUNTS.bob.address,
    amount: parseEther('1').toString(),
    token: '0x0000000000000000000000000000000000000000',
    unlockTime: new Date(Date.now() + 3600000),
    ...overrides
  }),
  
  privatePayment: (overrides?: any) => ({
    stealthAddress: '0x' + '2'.repeat(40),
    amount: parseEther('0.5').toString(),
    token: '0x0000000000000000000000000000000000000000',
    ephemeralPublicKey: '0x' + '3'.repeat(130),
    ciphertext: 'encrypted-data',
    ...overrides
  })
}

// tests/helpers/assertions.ts
import { expect } from 'vitest'
import type { Address } from 'viem'

/**
 * 自定义断言:验证地址
 */
export function expectAddress(value: any) {
  expect(value).toMatch(/^0x[a-fA-F0-9]{40}$/)
}

/**
 * 自定义断言:验证交易哈希
 */
export function expectTxHash(value: any) {
  expect(value).toMatch(/^0x[a-fA-F0-9]{64}$/)
}

/**
 * 自定义断言:验证余额变化
 */
export async function expectBalanceChange(
  client: PublicClient,
  address: Address,
  expectedChange: bigint,
  fn: () => Promise<any>
) {
  const balanceBefore = await client.getBalance({ address })
  await fn()
  const balanceAfter = await client.getBalance({ address })
  
  const actualChange = balanceAfter - balanceBefore
  expect(actualChange).toBe(expectedChange)
}
