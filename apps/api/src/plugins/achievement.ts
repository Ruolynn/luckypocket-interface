import type { FastifyPluginAsync } from 'fastify'
import { AchievementService } from '../services/achievement.service'
import fp from 'fastify-plugin'

declare module 'fastify' {
  interface FastifyInstance {
    achievementService: AchievementService
  }
}

const plugin: FastifyPluginAsync = async (app) => {
  const achievementService = new AchievementService(app)
  app.decorate('achievementService', achievementService)

  app.log.info('Achievement service initialized')
}

export default fp(plugin, { name: 'achievement-service' })
