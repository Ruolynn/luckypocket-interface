import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

const plugin: FastifyPluginAsync = async (app) => {
  // GET /api/leaderboard?type=luck&range=week
  app.get('/api/leaderboard', async (req, reply) => {
    const { type, range } = z
      .object({
        type: z.enum(['luck', 'generous', 'active', 'channel']),
        range: z.enum(['24h', '7d', '30d', 'all', 'week', 'month', 'realtime']).optional(),
      })
      .parse(req.query as any)

    // Map frontend range to backend range
    const rangeMap: Record<string, string> = {
      '24h': 'realtime',
      '7d': 'week',
      '30d': 'month',
      'all': 'month',
    }
    const backendRange = rangeMap[range || '7d'] || range || 'week'

    const key = `lb:${type}:${backendRange}`
    const rawTop = await app.redis.zrevrange(key, 0, 49, 'WITHSCORES')
    
    // 将 Redis 的 [member, score, member, score, ...] 格式转换为对象数组
    const userIds: string[] = []
    const scores: string[] = []
    for (let i = 0; i < rawTop.length; i += 2) {
      userIds.push(rawTop[i] as string)
      scores.push(rawTop[i + 1] as string)
    }

    // 批量获取用户信息（地址、Farcaster 名称等）
    const users = await app.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        address: true,
        farcasterName: true,
        farcasterFid: true,
      },
    })

    const userMap = new Map(users.map((u) => [u.id, u]))

    // 构建返回数据，保持排序
    const top = userIds.map((userId, index) => {
      const user = userMap.get(userId)
      return {
        rank: index + 1,
        address: user?.address || userId,
        farcasterName: user?.farcasterName || null,
        farcasterFid: user?.farcasterFid || null,
        score: scores[index],
        userId,
      }
    })

    return { type, range: range || '7d', top }
  })
}

export default plugin


