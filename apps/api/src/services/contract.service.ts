import { createWalletClient, createPublicClient, http, parseAbiItem } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'
import { getContractAddress } from './chain.service'

const PacketCreatedEvent = parseAbiItem('event PacketCreated(bytes32 indexed packetId, address indexed creator, address token, uint256 totalAmount, uint32 count, bool isRandom, uint256 expireTime)')

const RED_PACKET_ABI = [
  {
    type: 'function',
    name: 'claimPacket',
    inputs: [{ name: 'packetId', type: 'bytes32' }],
    outputs: [{ name: 'amount', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getPacketInfo',
    inputs: [{ name: 'packetId', type: 'bytes32' }],
    outputs: [
      { name: 'creator', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'totalAmount', type: 'uint256' },
      { name: 'count', type: 'uint32' },
      { name: 'remainingCount', type: 'uint32' },
      { name: 'expireTime', type: 'uint256' },
      { name: 'isRandom', type: 'bool' },
    ],
    stateMutability: 'view',
  },
] as const

/**
 * 创建钱包客户端（用于代理交易）
 */
export function createWalletClientForProxy() {
  const privateKey = process.env.PROXY_WALLET_PRIVATE_KEY
  if (!privateKey) {
    throw new Error('PROXY_WALLET_PRIVATE_KEY not set')
  }
  const account = privateKeyToAccount(privateKey as `0x${string}`)
  const rpcUrl = process.env.ETHEREUM_RPC_URL || 'http://localhost:8545'
  return createWalletClient({
    account,
    chain: sepolia,
    transport: http(rpcUrl),
  })
}

/**
 * 读取合约信息
 */
export async function getPacketInfoFromChain(packetId: `0x${string}`) {
  const client = createPublicClient({
    transport: http(process.env.ETHEREUM_RPC_URL || 'http://localhost:8545'),
    chain: sepolia,
  })
  const address = getContractAddress()
  
  return client.readContract({
    address,
    abi: RED_PACKET_ABI,
    functionName: 'getPacketInfo',
    args: [packetId],
  })
}

/**
 * ERC20 标准 ABI（用于读取代币信息）
 */
const ERC20_ABI = [
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'name',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
] as const

/**
 * 获取代币元数据（symbol, decimals, name）
 */
export async function getTokenMetadata(tokenAddress: `0x${string}`) {
  const client = createPublicClient({
    transport: http(process.env.ETHEREUM_RPC_URL || 'http://localhost:8545'),
    chain: sepolia,
  })

  try {
    const [symbol, decimals, name] = await Promise.all([
      client.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'symbol',
      }).catch(() => 'UNKNOWN'),
      client.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'decimals',
      }).catch(() => 18),
      client.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'name',
      }).catch(() => 'Unknown Token'),
    ])

    return { symbol: symbol as string, decimals: Number(decimals), name: name as string }
  } catch (error) {
    throw new Error(`Failed to fetch token metadata: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * 验证交易是否已确认
 */
export async function verifyTransaction(txHash: `0x${string}`, expectedPacketId?: `0x${string}`) {
  const client = createPublicClient({
    transport: http(process.env.ETHEREUM_RPC_URL || 'http://localhost:8545'),
    chain: sepolia,
  })

  try {
    const receipt = await client.getTransactionReceipt({ hash: txHash })
    if (!receipt || receipt.status !== 'success') {
      return { valid: false, error: 'Transaction failed or not found' }
    }

    // 如果提供了 packetId，验证事件
    if (expectedPacketId) {
      const address = getContractAddress()
      try {
        const logs = await client.getLogs({
          address,
          event: PacketCreatedEvent,
          fromBlock: receipt.blockNumber,
          toBlock: receipt.blockNumber,
        })

        const found = logs.find((log) => {
          const logPacketId = log.args.packetId
          return logPacketId?.toLowerCase() === expectedPacketId.toLowerCase()
        })
        if (!found) {
          return { valid: false, error: 'PacketCreated event not found in transaction' }
        }

        return {
          valid: true,
          blockNumber: receipt.blockNumber,
          event: found.args,
        }
      } catch (error) {
        return { valid: false, error: `Failed to fetch logs: ${error instanceof Error ? error.message : 'Unknown error'}` }
      }
    }

    return {
      valid: true,
      blockNumber: receipt.blockNumber,
    }
  } catch (error) {
    return { valid: false, error: `Failed to verify transaction: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}

/**
 * 代理调用 claimPacket（需要用户签名授权或使用 Paymaster）
 */
export async function proxyClaimPacket(packetId: `0x${string}`, userAddress: `0x${string}`) {
  const walletClient = createWalletClientForProxy()
  const address = getContractAddress()
  
  // 注意：实际实现中需要用户签名或使用 ERC-4337 Account Abstraction
  // 这里仅作为框架示例
  const hash = await walletClient.writeContract({
    address,
    abi: RED_PACKET_ABI,
    functionName: 'claimPacket',
    args: [packetId],
    account: walletClient.account, // 这里应该是用户的 account
  })
  
  return hash
}

