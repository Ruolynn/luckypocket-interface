import type { FastifyPluginAsync } from 'fastify'

const plugin: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', app.authenticate as any)

  // Get all achievements with user progress
  app.get('/api/achievements', async (req: any) => {
    const userId = req.user.userId
    const achievements = await app.achievementService.getUserAchievements(userId)

    return achievements
  })

  // Get all achievement definitions (public)
  app.get('/api/achievements/all', { preHandler: [] }, async () => {
    const allAchievements = app.achievementService.getAllAchievements()

    return {
      achievements: allAchievements.map((a) => ({
        code: a.code,
        name: a.name,
        description: a.description,
        icon: a.icon,
        category: a.category,
        target: a.criteria.target,
        metric: a.criteria.metric,
      })),
    }
  })

  // Get user stats
  app.get('/api/achievements/stats', async (req: any) => {
    const userId = req.user.userId
    const stats = await app.achievementService.getUserStats(userId)

    return {
      packetsSent: stats.packetsSent,
      claims: stats.claims,
      bestLuckCount: stats.bestLuckCount,
      totalSent: stats.totalSent.toString(),
      invites: stats.invites,
      consecutiveDays: stats.consecutiveDays,
    }
  })

  // Manually trigger achievement check (for development/testing)
  app.post('/api/achievements/check', async (req: any) => {
    const userId = req.user.userId
    const unlocked = await app.achievementService.checkAndUnlockAchievements(userId)

    return {
      checked: true,
      newlyUnlocked: unlocked,
      count: unlocked.length,
    }
  })
}

export default plugin
