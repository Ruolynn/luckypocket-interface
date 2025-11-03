import type { PrismaClient } from '@prisma/client'
import { proxyClaimPacket } from './contract.service'

export interface CreatePacketInput {
  packetId: string
  txHash: string
  token: string
  tokenSymbol?: string
  tokenDecimals?: number
  tokenName?: string
  totalAmount: string
  count: number
  isRandom: boolean
  message?: string
  expireTime: Date
}

export async function createPacketRecord(prisma: PrismaClient, userId: string, input: CreatePacketInput) {
  return prisma.packet.upsert({
    where: { packetId: input.packetId },
    update: {
      // 如果已存在，更新关键字段（但保持原始创建者）
      txHash: input.txHash,
      token: input.token,
      tokenSymbol: input.tokenSymbol,
      tokenDecimals: input.tokenDecimals,
      tokenName: input.tokenName,
      totalAmount: input.totalAmount,
      count: input.count,
      isRandom: input.isRandom,
      message: input.message,
      expireTime: input.expireTime,
    },
    create: {
      packetId: input.packetId,
      txHash: input.txHash,
      creatorId: userId,
      token: input.token,
      tokenSymbol: input.tokenSymbol,
      tokenDecimals: input.tokenDecimals,
      tokenName: input.tokenName,
      totalAmount: input.totalAmount,
      count: input.count,
      isRandom: input.isRandom,
      message: input.message,
      remainingAmount: input.totalAmount,
      remainingCount: input.count,
      expireTime: input.expireTime,
    },
  })
}

export async function claimPacketRecord(prisma: PrismaClient, packetIdHex: string, userId: string) {
  const packet = await prisma.packet.findUnique({ where: { packetId: packetIdHex } })
  if (!packet) return { error: 'PACKET_NOT_FOUND' as const }
  if (packet.expireTime < new Date()) return { error: 'PACKET_EXPIRED' as const }

  const existed = await prisma.claim.findUnique({ where: { packetId_userId: { packetId: packet.id, userId } } as any })
  if (existed) return { error: 'PACKET_ALREADY_CLAIMED' as const }

  // 保留占位函数（兼容旧逻辑），默认走上链代理
  const claim = await prisma.claim.create({
    data: {
      packetId: packet.id,
      userId,
      amount: '0',
      txHash: `stub:${crypto.randomUUID()}`,
    },
  })
  return { claim }
}


export async function claimOnChainAndRecord(prisma: PrismaClient, packetIdHex: `0x${string}`, userId: string) {
  const packet = await prisma.packet.findUnique({ where: { packetId: packetIdHex } })
  if (!packet) return { error: 'PACKET_NOT_FOUND' as const }
  if (packet.expireTime < new Date()) return { error: 'PACKET_EXPIRED' as const }

  const existed = await prisma.claim.findUnique({ where: { packetId_userId: { packetId: packet.id, userId } } as any })
  if (existed) return { error: 'PACKET_ALREADY_CLAIMED' as const }

  // 获取用户地址
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { address: true } })
  if (!user?.address) return { error: 'USER_ADDRESS_NOT_FOUND' as const }

  // 代理发起链上领取交易（金额回填依赖事件同步作业）
  const txHash = await proxyClaimPacket(packetIdHex, user.address as `0x${string}`)

  const claim = await prisma.claim.create({
    data: {
      packetId: packet.id,
      userId,
      amount: '0',
      txHash,
    },
  })

  return { claim, txHash }
}


