import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

const plugin: FastifyPluginAsync = async (app) => {
  app.get('/api/leaderboard', async (req, reply) => {
    const { type, range } = z
      .object({
        type: z.enum(['luck', 'generous', 'active']),
        range: z.enum(['week', 'month', 'realtime']),
      })
      .parse(req.query as any)

    const key = `lb:${type}:${range}`
    const rawTop = await app.redis.zrevrange(key, 0, 49, 'WITHSCORES')
    
    // 将 Redis 的 [member, score, member, score, ...] 格式转换为对象数组
    const top: Array<{ address: string; score: string }> = []
    for (let i = 0; i < rawTop.length; i += 2) {
      top.push({
        address: rawTop[i] as string,
        score: rawTop[i + 1] as string,
      })
    }

    return { type, range, top }
  })
}

export default plugin


