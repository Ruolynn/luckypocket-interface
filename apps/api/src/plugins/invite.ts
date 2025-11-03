import type { FastifyPluginAsync } from 'fastify'
import { InviteRewardService } from '../services/invite.service'
import fp from 'fastify-plugin'

declare module 'fastify' {
  interface FastifyInstance {
    inviteService: InviteRewardService
  }
}

const plugin: FastifyPluginAsync = async (app) => {
  const inviteService = new InviteRewardService(app)
  app.decorate('inviteService', inviteService)

  app.log.info('Invite reward service initialized')
}

export default fp(plugin, { name: 'invite-service' })
