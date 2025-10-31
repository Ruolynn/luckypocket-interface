import fp from 'fastify-plugin'
import { getPublicClient } from '../services/chain.service'

declare module 'fastify' {
  interface FastifyInstance {
    chain: { client: ReturnType<typeof getPublicClient> }
  }
}

export default fp(async (app) => {
  app.decorate('chain', { client: getPublicClient() })
})

