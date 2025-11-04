/**
 * @file User Routes
 * @description API endpoints for user operations
 */

import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { GiftService } from '../services/gift.service'

// Request schemas
const GetUserGiftsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: z.enum(['PENDING', 'CLAIMED', 'REFUNDED', 'EXPIRED']).optional(),
  sortBy: z.enum(['createdAt', 'expiresAt']).optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
})

const AddressParamSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
})

const plugin: FastifyPluginAsync = async (app) => {
  const giftService = new GiftService(app.prisma)

  /**
   * GET /api/v1/users/:address/gifts/sent
   * Get gifts sent by user
   */
  app.get(
    '/api/v1/users/:address/gifts/sent',
    {
      schema: {
        description: 'Get gifts sent by user',
        tags: ['users'],
        params: {
          type: 'object',
          required: ['address'],
          properties: {
            address: { type: 'string' },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number', minimum: 1 },
            limit: { type: 'number', minimum: 1, maximum: 100 },
            status: { type: 'string', enum: ['PENDING', 'CLAIMED', 'REFUNDED', 'EXPIRED'] },
            sortBy: { type: 'string', enum: ['createdAt', 'expiresAt'] },
            order: { type: 'string', enum: ['asc', 'desc'] },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    giftId: { type: 'string' },
                    recipientAddress: { type: 'string' },
                    tokenType: { type: 'string' },
                    amount: { type: 'string' },
                    status: { type: 'string' },
                    createdAt: { type: 'string' },
                    expiresAt: { type: 'string' },
                  },
                },
              },
              pagination: {
                type: 'object',
                properties: {
                  page: { type: 'number' },
                  limit: { type: 'number' },
                  total: { type: 'number' },
                  hasMore: { type: 'boolean' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        // Validate params
        const { address } = AddressParamSchema.parse(request.params)

        // Validate query
        const query = GetUserGiftsQuerySchema.parse(request.query)

        // Get sent gifts
        const result = await giftService.getUserSentGifts(address, query)

        return reply.code(200).send(result)
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({
            error: 'VALIDATION_ERROR',
            message: 'Invalid request parameters',
            details: error.errors,
          })
        }

        app.log.error({ error }, 'Failed to get sent gifts')
        return reply.code(500).send({
          error: 'INTERNAL_ERROR',
          message: 'Failed to retrieve sent gifts',
        })
      }
    }
  )

  /**
   * GET /api/v1/users/:address/gifts/received
   * Get gifts received by user
   */
  app.get(
    '/api/v1/users/:address/gifts/received',
    {
      schema: {
        description: 'Get gifts received by user',
        tags: ['users'],
        params: {
          type: 'object',
          required: ['address'],
          properties: {
            address: { type: 'string' },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number', minimum: 1 },
            limit: { type: 'number', minimum: 1, maximum: 100 },
            status: { type: 'string', enum: ['PENDING', 'CLAIMED', 'REFUNDED', 'EXPIRED'] },
            sortBy: { type: 'string', enum: ['createdAt', 'expiresAt'] },
            order: { type: 'string', enum: ['asc', 'desc'] },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    giftId: { type: 'string' },
                    senderAddress: { type: 'string' },
                    tokenType: { type: 'string' },
                    amount: { type: 'string' },
                    status: { type: 'string' },
                    createdAt: { type: 'string' },
                    expiresAt: { type: 'string' },
                  },
                },
              },
              pagination: {
                type: 'object',
                properties: {
                  page: { type: 'number' },
                  limit: { type: 'number' },
                  total: { type: 'number' },
                  hasMore: { type: 'boolean' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        // Validate params
        const { address } = AddressParamSchema.parse(request.params)

        // Validate query
        const query = GetUserGiftsQuerySchema.parse(request.query)

        // Get received gifts
        const result = await giftService.getUserReceivedGifts(address, query)

        return reply.code(200).send(result)
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({
            error: 'VALIDATION_ERROR',
            message: 'Invalid request parameters',
            details: error.errors,
          })
        }

        app.log.error({ error }, 'Failed to get received gifts')
        return reply.code(500).send({
          error: 'INTERNAL_ERROR',
          message: 'Failed to retrieve received gifts',
        })
      }
    }
  )
}

export default plugin
