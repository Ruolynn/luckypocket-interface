/**
 * @file Stats Routes
 * @description API endpoints for global statistics
 */

import type { FastifyPluginAsync } from 'fastify'
import { GiftService } from '../services/gift.service'

const plugin: FastifyPluginAsync = async (app) => {
  const giftService = new GiftService(app.prisma)

  // Cache TTL: 5 minutes
  const CACHE_TTL = 5 * 60 // 300 seconds
  const CACHE_KEY = 'global:stats'

  /**
   * GET /api/v1/stats
   * Get global statistics
   * Cached for 5 minutes
   */
  app.get(
    '/api/v1/stats',
    {
      schema: {
        description: 'Get global statistics',
        tags: ['stats'],
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  totalGifts: { type: 'number' },
                  totalClaimed: { type: 'number' },
                  totalRefunded: { type: 'number' },
                  totalPending: { type: 'number' },
                  totalExpired: { type: 'number' },
                  totalValueETH: { type: 'string' },
                  totalUsers: { type: 'number' },
                  stats24h: {
                    type: 'object',
                    properties: {
                      giftsCreated: { type: 'number' },
                      giftsClaimed: { type: 'number' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        // Try to get from cache
        const cached = await app.redis.get(CACHE_KEY)

        if (cached) {
          app.log.info('Returning cached stats')
          return reply.code(200).send(JSON.parse(cached))
        }

        // Cache miss - compute stats
        app.log.info('Computing fresh stats')
        const stats = await giftService.getGlobalStats()

        // Store in cache
        await app.redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(stats))

        return reply.code(200).send(stats)
      } catch (error: any) {
        app.log.error({ error }, 'Failed to get global stats')
        return reply.code(500).send({
          error: 'INTERNAL_ERROR',
          message: 'Failed to retrieve statistics',
        })
      }
    }
  )
}

export default plugin
