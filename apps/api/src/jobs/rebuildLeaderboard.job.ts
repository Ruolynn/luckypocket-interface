import type { FastifyInstance } from 'fastify'

function startOfUTCDaysAgo(days: number) {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

export async function startRebuildLeaderboardJob(app: FastifyInstance) {
  async function rebuild() {
    try {
      // 手气榜(week): 单次领取最大金额（使用 GiftClaim）
      const weekFrom = startOfUTCDaysAgo(7)
      const luck = await app.prisma.giftClaim.findMany({
        where: { claimedAt: { gte: weekFrom } },
        select: { claimerId: true, amount: true },
      })
      const luckMap = new Map<string, bigint>()
      for (const c of luck) {
        const amt = BigInt(c.amount)
        const prev = luckMap.get(c.claimerId) || 0n
        if (amt > prev) luckMap.set(c.claimerId, amt)
      }
      const luckKey = 'lb:luck:week'
      await app.redis.del(luckKey)
      for (const [userId, score] of luckMap) {
        await app.redis.zadd(luckKey, Number(score), userId)
      }

      // 慷慨榜(month): 创建礼物数量（使用 Gift）
      const monthFrom = startOfUTCDaysAgo(30)
      const generous = await app.prisma.gift.groupBy({
        by: ['senderId'],
        where: { createdAt: { gte: monthFrom } },
        _count: { _all: true },
      })
      const generousKey = 'lb:generous:month'
      await app.redis.del(generousKey)
      for (const row of generous) {
        const score = row._count._all
        await app.redis.zadd(generousKey, score, row.senderId)
      }

      // 活跃榜(realtime): 参与次数（近24小时领取次数，使用 GiftClaim）
      const realtimeFrom = startOfUTCDaysAgo(1)
      const active = await app.prisma.giftClaim.groupBy({
        by: ['claimerId'],
        where: { claimedAt: { gte: realtimeFrom } },
        _count: { _all: true },
      })
      const activeKey = 'lb:active:realtime'
      await app.redis.del(activeKey)
      for (const row of active) {
        await app.redis.zadd(activeKey, row._count._all, row.claimerId)
      }

      // Channel 榜（暂时使用空数据，后续实现）
      // TODO: 实现 Channel 维度的排行榜
      const channelKey = 'lb:channel:week'
      await app.redis.del(channelKey)

      // WS 广播（可选）
      app.io.emit('leaderboard:update', { type: 'luck', range: 'week' })
      app.io.emit('leaderboard:update', { type: 'generous', range: 'month' })
      app.io.emit('leaderboard:update', { type: 'active', range: 'realtime' })
    } catch (err) {
      app.log.error({ err }, 'rebuildLeaderboard error')
    }
  }

  // 立即执行一次，然后每小时重建
  rebuild()
  const timer = setInterval(rebuild, 60 * 60 * 1000)
  app.addHook('onClose', async () => clearInterval(timer))
}


