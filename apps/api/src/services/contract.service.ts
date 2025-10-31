import { createWalletClient, createPublicClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'
import { getContractAddress } from './chain.service'

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

