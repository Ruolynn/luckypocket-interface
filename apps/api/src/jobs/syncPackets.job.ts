import type { FastifyInstance } from 'fastify'
import { getPublicClient, getContractAddress, topics } from '../services/chain.service'

const REDIS_LAST_BLOCK_KEY = 'sync:lastBlock'

export async function startSyncPacketsJob(app: FastifyInstance) {
  const client = getPublicClient()
  const address = getContractAddress()

  async function tick() {
    try {
      const latest = await client.getBlockNumber()
      const stored = await app.redis.get(REDIS_LAST_BLOCK_KEY)
      const from = stored ? BigInt(stored) + 1n : latest > 1000n ? latest - 1000n : 0n

      // PacketCreated
      const createdLogs = await client.getLogs({
        address,
        event: topics.PacketCreated,
        fromBlock: from,
        toBlock: latest,
      })
      for (const log of createdLogs) {
        const pid = log.args.packetId as `0x${string}`
        const txHash = log.transactionHash as `0x${string}`
        const creator = (log.args.creator as string).toLowerCase()
        const expire = Number(log.args.expireTime)
        
        // 查找或创建用户
        const user = await app.prisma.user.upsert({
          where: { address: creator },
          update: {},
          create: { address: creator },
          select: { id: true },
        })

        // 创建或更新红包记录
        await app.prisma.packet.upsert({
          where: { packetId: pid },
          update: {
            txHash,
            token: (log.args.token as string).toLowerCase(),
            totalAmount: (log.args.totalAmount as bigint).toString(),
            count: Number(log.args.count),
            isRandom: Boolean(log.args.isRandom),
            expireTime: new Date(expire * 1000),
            remainingAmount: (log.args.totalAmount as bigint).toString(),
            remainingCount: Number(log.args.count),
          },
          create: {
            packetId: pid,
            txHash,
            creatorId: user.id,
            token: (log.args.token as string).toLowerCase(),
            totalAmount: (log.args.totalAmount as bigint).toString(),
            count: Number(log.args.count),
            isRandom: Boolean(log.args.isRandom),
            expireTime: new Date(expire * 1000),
            remainingAmount: (log.args.totalAmount as bigint).toString(),
            remainingCount: Number(log.args.count),
          },
        })
        
        // WS 广播
        app.io.to(`packet:${pid}`).emit('packet:created', {
          packetId: pid,
          creator,
          totalAmount: (log.args.totalAmount as bigint).toString(),
          count: Number(log.args.count),
        })
      }

      // PacketClaimed
      const claimedLogs = await client.getLogs({
        address,
        event: topics.PacketClaimed,
        fromBlock: from,
        toBlock: latest,
      })
      for (const log of claimedLogs) {
        const pid = log.args.packetId as `0x${string}`
        const claimer = (log.args.claimer as string).toLowerCase()
        const amount = (log.args.amount as bigint).toString()

        const packet = await app.prisma.packet.findUnique({ where: { packetId: pid } })
        if (!packet) continue

        const user = await app.prisma.user.upsert({
          where: { address: claimer },
          update: {},
          create: { address: claimer },
          select: { id: true },
        })

        await app.prisma.claim.upsert({
          where: { txHash: log.transactionHash as string },
          update: {},
          create: {
            packetId: packet.id,
            userId: user.id,
            amount,
            txHash: log.transactionHash as string,
          },
        })

        // WS 广播
        app.io.to(`packet:${pid}`).emit('packet:claimed', {
          packetId: pid,
          claimer,
          amount,
          remainingCount: Number(log.args.remainingCount),
        })
      }

      // PacketRandomReady（随机切分就绪）
      const readyLogs = await client.getLogs({
        address,
        event: topics.PacketRandomReady,
        fromBlock: from,
        toBlock: latest,
      })
      for (const log of readyLogs) {
        const pid = log.args.packetId as `0x${string}`
        // 通知前端该红包的随机已就绪
        app.io.to(`packet:${pid}`).emit('packet:randomReady', { packetId: pid })
      }

      await app.redis.set(REDIS_LAST_BLOCK_KEY, latest.toString())
    } catch (err) {
      app.log.error({ err }, 'syncPackets tick error')
    }
  }

  // 立即执行一次，然后按 30s 周期轮询
  tick()
  const intervalMs = Number(process.env.SYNC_INTERVAL_MS || 30000)
  const timer = setInterval(tick, intervalMs)
  app.addHook('onClose', async () => clearInterval(timer))
}


