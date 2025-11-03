import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { ensureIdempotency } from '../utils/idempotency'
import { createPacketRecord, claimOnChainAndRecord } from '../services/packet.service'
import { withLock } from '../utils/locks'
import { verifyTransaction, getPacketInfoFromChain, getTokenMetadata } from '../services/contract.service'
import { notifyPacketCreated } from '../services/notification.service'

const createSchema = z.object({
  packetId: z.string(),
  txHash: z.string(),
  token: z.string(),
  totalAmount: z.string().regex(/^\d+$/),
  count: z.number().int().min(1).max(200),
  isRandom: z.boolean(),
  message: z.string().max(200).optional(),
  expireTime: z.string().datetime(),
})

const claimSchema = z.object({
  packetId: z.string(),
})

const plugin: FastifyPluginAsync = async (app) => {
  app.post(
    '/api/packets/create',
    {
      preHandler: (app as any).authenticate ? [app.authenticate as any] : undefined,
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    },
    async (req: any, reply) => {
    await ensureIdempotency(req, reply)
    if (reply.sent) return
    const input = createSchema.parse(req.body)

    try {
      // 1. 验证链上交易
      const txVerification = await verifyTransaction(input.txHash as `0x${string}`, input.packetId as `0x${string}`)
      if (!txVerification.valid) {
        return reply.code(400).send({ error: 'INVALID_TRANSACTION', details: txVerification.error })
      }

      // 2. 从链上读取红包信息，验证一致性
      const chainInfoTuple = await getPacketInfoFromChain(input.packetId as `0x${string}`)
      if (!chainInfoTuple) {
        return reply.code(404).send({ error: 'PACKET_NOT_FOUND_ON_CHAIN' })
      }

      // 解构元组: [creator, token, totalAmount, count, remainingCount, expireTime, isRandom]
      const [creator, token, totalAmount, count, remainingCount, expireTime, isRandom] = chainInfoTuple

      // 验证交易中的事件数据与链上读取的数据一致性
      if (txVerification.event) {
        const eventData = txVerification.event as any
        if (eventData.creator?.toLowerCase() !== creator?.toLowerCase()) {
          return reply.code(400).send({ error: 'CREATOR_MISMATCH' })
        }
        if (eventData.token?.toLowerCase() !== token?.toLowerCase()) {
          return reply.code(400).send({ error: 'TOKEN_MISMATCH' })
        }
        if (eventData.totalAmount?.toString() !== totalAmount?.toString()) {
          return reply.code(400).send({ error: 'AMOUNT_MISMATCH' })
        }
        if (Number(eventData.count) !== Number(count)) {
          return reply.code(400).send({ error: 'COUNT_MISMATCH' })
        }
        if (Boolean(eventData.isRandom) !== isRandom) {
          return reply.code(400).send({ error: 'RANDOM_MISMATCH' })
        }
      }

      // 3. 获取并存储代币元数据
      const tokenMetadata = await getTokenMetadata(input.token as `0x${string}`)

      // 4. 创建红包记录（包含代币快照）
      const packet = await createPacketRecord(app.prisma, req.user.userId, {
        ...input,
        expireTime: new Date(input.expireTime),
        tokenSymbol: tokenMetadata.symbol,
        tokenDecimals: tokenMetadata.decimals,
        tokenName: tokenMetadata.name,
      })

      // 5. 发送通知
      await notifyPacketCreated(app.prisma, req.user.userId, {
        packetId: input.packetId,
        count: input.count,
        totalAmount: input.totalAmount,
      })

      // 6. 创建成功后，尝试结算邀请奖励（异步，不阻塞响应）
      app.inviteService.settleInviteReward(req.user.userId).catch((err) => {
        app.log.error({ error: err, userId: req.user.userId }, 'Failed to settle invite reward after packet creation')
      })

      // 7. 检查并解锁成就（异步，不阻塞响应）
      app.achievementService.checkAndUnlockAchievements(req.user.userId).catch((err) => {
        app.log.error({ error: err, userId: req.user.userId }, 'Failed to check achievements after packet creation')
      })

      return { packet }
    } catch (error: any) {
      app.log.error({ err: error, input }, 'createPacket error')
      if (error.message?.includes('Token metadata')) {
        return reply.code(400).send({ error: 'INVALID_TOKEN', details: error.message })
      }
      return reply.code(500).send({ error: 'INTERNAL_ERROR', details: error.message })
    }
    }
  )

  app.post(
    '/api/packets/claim',
    {
      preHandler: (app as any).authenticate ? [app.authenticate as any] : undefined,
      config: { rateLimit: { max: 10, timeWindow: '10s' } },
    },
    async (req: any, reply) => {
    await ensureIdempotency(req, reply)
    if (reply.sent) return
    const { packetId } = claimSchema.parse(req.body)
    const userId = (req as any).user?.userId || (req as any).user?.sub || 'unknown'
    const result = await withLock(app.redis, `claim:${packetId}:${userId}`, 10, async () => {
      return await claimOnChainAndRecord(app.prisma, packetId as `0x${string}`, userId)
    })
    if ('error' in (result as any)) {
      const err = (result as any).error as string
      let status = 400
      if (err === 'PACKET_NOT_FOUND') status = 404
      else if (err === 'PACKET_EXPIRED') status = 400
      else if (err === 'PACKET_ALREADY_CLAIMED') status = 409
      return reply.code(status).send({ error: err })
    }

    // 领取成功后，尝试结算邀请奖励（异步，不阻塞响应）
    app.inviteService.settleInviteReward(userId).catch((err) => {
      app.log.error({ error: err, userId }, 'Failed to settle invite reward after claim')
    })

    // 检查并解锁成就（异步，不阻塞响应）
    app.achievementService.checkAndUnlockAchievements(userId).catch((err) => {
      app.log.error({ error: err, userId }, 'Failed to check achievements after claim')
    })

    return { claim: result.claim }
    }
  )

  app.get('/api/packets/:packetId', async (req, reply) => {
    const { packetId } = z.object({ packetId: z.string() }).parse(req.params)
    const packet = await app.prisma.packet.findUnique({ where: { packetId } })
    if (!packet) return reply.code(404).send({ error: 'PACKET_NOT_FOUND' })
    return { packet }
  })

  app.get('/api/packets/:packetId/claims', async (req, reply) => {
    const { packetId } = z.object({ packetId: z.string() }).parse(req.params)
    const packet = await app.prisma.packet.findUnique({ where: { packetId } })
    if (!packet) return reply.code(404).send({ error: 'PACKET_NOT_FOUND' })
    const claims = await app.prisma.claim.findMany({
      where: { packetId: packet.id },
      include: { user: { select: { address: true } } },
      orderBy: { claimedAt: 'desc' },
    })
    return { claims }
  })

  app.get('/api/packets/by-tx/:txHash', async (req, reply) => {
    const { txHash } = z.object({ txHash: z.string() }).parse(req.params)
    const packet = await app.prisma.packet.findUnique({ where: { txHash } })
    if (!packet) return reply.code(404).send({ error: 'PACKET_NOT_FOUND' })
    return { packet }
  })
}

export default plugin


