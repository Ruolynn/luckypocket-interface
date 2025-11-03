// tests/integration/escrow.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { 
  createTestClient, 
  http, 
  publicActions, 
  walletActions,
  parseEther,
  type Address
} from 'viem'
import { foundry } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

// 启动本地测试链: anvil --port 8545
describe('Escrow Integration Tests', () => {
  let client: any
  let sender: Address
  let receiver: Address
  let escrowContract: Address
  
  beforeAll(async () => {
    // 创建测试客户端 (连接到 Anvil 本地链)
    client = createTestClient({
      chain: foundry,
      mode: 'anvil',
      transport: http('http://127.0.0.1:8545')
    })
      .extend(publicActions)
      .extend(walletActions)
    
    // 使用 Anvil 预设的测试账户
    const senderAccount = privateKeyToAccount(
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
    )
    const receiverAccount = privateKeyToAccount(
      '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'
    )
    
    sender = senderAccount.address
    receiver = receiverAccount.address
    
    // 部署合约 (实际项目中应该用 deploy script)
    escrowContract = '0x5FbDB2315678afecb367f032d93F642f64180aa3' // Anvil 默认部署地址
  })
  
  it('应该成功创建托管支付', async () => {
    const amount = parseEther('1')
    const unlockTime = BigInt(Math.floor(Date.now() / 1000) + 3600) // 1小时后
    
    // 发送交易
    const hash = await client.writeContract({
      address: escrowContract,
      abi: escrowABI,
      functionName: 'createPayment',
      args: [receiver, '0x0000000000000000000000000000000000000000', unlockTime],
      value: amount,
      account: sender
    })
    
    // 等待交易确认
    const receipt = await client.waitForTransactionReceipt({ hash })
    expect(receipt.status).toBe('success')
    
    // 验证事件
    const logs = await client.getContractEvents({
      address: escrowContract,
      abi: escrowABI,
      eventName: 'PaymentCreated',
      fromBlock: receipt.blockNumber,
      toBlock: receipt.blockNumber
    })
    
    expect(logs).toHaveLength(1)
    expect(logs[0].args.sender).toBe(sender)
    expect(logs[0].args.receiver).toBe(receiver)
  })
  
  it('应该在后端正确同步链上数据', async () => {
    // 1. 创建链上支付
    const hash = await client.writeContract({
      address: escrowContract,
      abi: escrowABI,
      functionName: 'createPayment',
      args: [receiver, '0x0000000000000000000000000000000000000000', unlockTime],
      value: parseEther('1'),
      account: sender
    })
    
    await client.waitForTransactionReceipt({ hash })
    
    // 2. 等待后端监听事件并同步 (使用轮询或 WebSocket)
    await waitForBackendSync(3000)
    
    // 3. 验证数据库
    const escrows = await prisma.escrow.findMany({
      where: { transactionHash: hash }
    })
    
    expect(escrows).toHaveLength(1)
    expect(escrows[0].sender).toBe(sender.toLowerCase())
    expect(escrows[0].status).toBe('CONFIRMED')
  })
  
  it('应该支持时间快进测试释放功能', async () => {
    // 创建一个短时间的托管
    const unlockTime = BigInt(Math.floor(Date.now() / 1000) + 60) // 1分钟
    
    const hash = await client.writeContract({
      address: escrowContract,
      abi: escrowABI,
      functionName: 'createPayment',
      args: [receiver, '0x0000000000000000000000000000000000000000', unlockTime],
      value: parseEther('0.5'),
      account: sender
    })
    
    const receipt = await client.waitForTransactionReceipt({ hash })
    const paymentId = receipt.logs[0].args.paymentId
    
    // ⭐ 使用 Anvil 的时间快进功能
    await client.increaseTime({ seconds: 120 }) // 快进2分钟
    await client.mine({ blocks: 1 }) // 挖一个区块
    
    // 现在可以释放了
    const releaseHash = await client.writeContract({
      address: escrowContract,
      abi: escrowABI,
      functionName: 'release',
      args: [paymentId],
      account: receiver
    })
    
    const releaseReceipt = await client.waitForTransactionReceipt({ 
      hash: releaseHash 
    })
    expect(releaseReceipt.status).toBe('success')
  })
})

// 辅助函数:等待后端同步
async function waitForBackendSync(timeout: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, timeout))
}

// 合约 ABI (简化版)
const escrowABI = [
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
    name: 'PaymentCreated',
    type: 'event',
    inputs: [
      { name: 'paymentId', type: 'uint256', indexed: true },
      { name: 'sender', type: 'address', indexed: true },
      { name: 'receiver', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256' },
      { name: 'unlockTime', type: 'uint256' }
    ]
  }
] as const
