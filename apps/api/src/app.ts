import Fastify from 'fastify'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import sentryPlugin from './plugins/sentry'
import prismaPlugin from './plugins/prisma'
import redisPlugin from './plugins/redis'
import jwtPlugin from './plugins/jwt'
import socketPlugin from './plugins/socket'
import chainPlugin from './plugins/chain'
import authRoutes from './routes/auth'
import packetRoutes from './routes/packets'
import inviteRoutes from './routes/growth/invite'
import leaderboardRoutes from './routes/growth/leaderboard'
import frameRoutes from './routes/frame'
import { startSyncPacketsJob } from './jobs/syncPackets.job'
import { startRebuildLeaderboardJob } from './jobs/rebuildLeaderboard.job'

export async function buildApp(options?: { withJobs?: boolean; withSocket?: boolean }) {
  const app = Fastify({ logger: false })

  await app.register(cors, { origin: true, credentials: true })
  await app.register(sentryPlugin)
  // 在测试环境禁用 rateLimit，避免第三方插件导致 hook 异常
  if (process.env.NODE_ENV !== 'test') {
    await app.register(rateLimit, {
      max: Number(process.env.RATE_LIMIT_MAX ?? 120),
      timeWindow: (process.env.RATE_LIMIT_WINDOW_MS as any) ?? '1 minute',
    })
  }
  await app.register(prismaPlugin)
  await app.register(redisPlugin)
  await app.register(jwtPlugin)
  await app.register(chainPlugin)
  if (options?.withSocket !== false) {
    await app.register(socketPlugin)
  }

  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

  await app.register(authRoutes)
  await app.register(packetRoutes)
  await app.register(inviteRoutes)
  await app.register(leaderboardRoutes)
  await app.register(frameRoutes)

  if (options?.withJobs) {
    await startSyncPacketsJob(app)
    await startRebuildLeaderboardJob(app)
  }

  return app
}


