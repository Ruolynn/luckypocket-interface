/**
 * @file Gift Routes
 * @description API endpoints for gift operations
 */

import type { FastifyPluginAsync, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { GiftService } from '../services/gift.service'
import { siweAuthMiddleware, optionalAuthMiddleware } from '../middleware/siwe-auth'
import { proxyClaimPacket, generateClaimMessage } from '../services/contract.service'
import { getTokenValidationService } from '../services/token-validation.service'

// Request schemas
const CreateGiftSchema = z.object({
  recipientAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  tokenType: z.enum(['ETH', 'ERC20', 'ERC721', 'ERC1155']),
  tokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  tokenId: z.string().regex(/^\d+$/, 'Invalid token ID').optional(),
  amount: z.string().regex(/^\d+(\.\d+)?$/, 'Invalid amount'),
  daysUntilExpiry: z.number().int().min(1).max(365),
  message: z.string().max(500).optional(),
  tokenDecimals: z.number().int().min(0).max(36).optional(),
})

const GetGiftsQuerySchema = z.object({
  status: z.enum(['PENDING', 'CLAIMED', 'REFUNDED', 'EXPIRED']).optional(),
  senderId: z.string().optional(),
  recipientId: z.string().optional(),
  recipientAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  orderBy: z.enum(['createdAt', 'expiresAt']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
})

const plugin: FastifyPluginAsync = async (app) => {
  const giftService = new GiftService(app.prisma)

  /**
   * POST /api/v1/gifts/create
   * Create a new gift
   * Requires authentication
   */
  app.post(
    '/api/v1/gifts/create',
    {
      preHandler: siweAuthMiddleware,
      schema: {
        description: 'Create a new gift',
        tags: ['gifts'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['recipientAddress', 'tokenType', 'amount', 'daysUntilExpiry'],
          properties: {
            recipientAddress: { type: 'string' },
            tokenType: { type: 'string', enum: ['ETH', 'ERC20', 'ERC721', 'ERC1155'] },
            tokenAddress: { type: 'string' },
            tokenId: { type: 'string' },
            amount: { type: 'string' },
            daysUntilExpiry: { type: 'number' },
            message: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              txHash: { type: 'string' },
              giftId: { type: 'string' },
              blockNumber: { type: 'number' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        if (!request.user) {
          return reply.code(401).send({
            error: 'UNAUTHORIZED',
            message: 'Authentication required',
          })
        }

        // Validate request body
        const body = CreateGiftSchema.parse(request.body)

        // Validate token-specific requirements
        if ((body.tokenType === 'ERC20' || body.tokenType === 'ERC721' || body.tokenType === 'ERC1155') && !body.tokenAddress) {
          return reply.code(400).send({
            error: 'VALIDATION_ERROR',
            message: `tokenAddress is required for ${body.tokenType} gifts`,
          })
        }

        // Validate NFT requires tokenId
        if ((body.tokenType === 'ERC721' || body.tokenType === 'ERC1155') && !body.tokenId) {
          return reply.code(400).send({
            error: 'VALIDATION_ERROR',
            message: `tokenId is required for ${body.tokenType} gifts`,
          })
        }

        // Token validation for ERC20 tokens
        if (body.tokenType === 'ERC20' && body.tokenAddress) {
          try {
            const validationService = getTokenValidationService()
            const validation = await validationService.validateToken(body.tokenAddress as `0x${string}`)

            if (!validation.isValid) {
              return reply.code(400).send({
                error: 'INVALID_TOKEN',
                message: 'Token validation failed',
                details: {
                  isERC20: validation.isERC20,
                  isBlacklisted: validation.isBlacklisted,
                  risks: validation.risks,
                  warnings: validation.warnings,
                  metadata: validation.metadata,
                },
              })
            }

            // 如果验证通过但有警告，记录日志
            if (validation.warnings.length > 0) {
              app.log.warn({ tokenAddress: body.tokenAddress, warnings: validation.warnings }, 'Token validation warnings')
            }
          } catch (error: any) {
            app.log.error({ error, tokenAddress: body.tokenAddress }, 'Token validation error')
            // 验证失败时，允许继续但记录警告（避免过于严格导致正常代币无法使用）
            // 如果确实需要严格验证，可以取消注释下面的代码
            // return reply.code(400).send({
            //   error: 'TOKEN_VALIDATION_ERROR',
            //   message: error.message || 'Failed to validate token',
            // })
          }
        }

        // Validate ERC721 amount must be 1
        if (body.tokenType === 'ERC721' && body.amount !== '1') {
          return reply.code(400).send({
            error: 'VALIDATION_ERROR',
            message: 'ERC721 gifts must have amount = 1',
          })
        }

        // Create gift
        const result = await giftService.createGift({
          ...body,
          senderAddress: request.user.address,
        })

        return reply.code(200).send(result)
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({
            error: 'VALIDATION_ERROR',
            message: 'Invalid request parameters',
            details: error.errors,
          })
        }

        app.log.error({ error }, 'Failed to create gift')

        // Handle specific errors
        const errorMessage = error.message || 'Unknown error'

        if (errorMessage.includes('Insufficient allowance')) {
          return reply.code(400).send({
            error: 'INSUFFICIENT_ALLOWANCE',
            message: errorMessage,
          })
        }

        if (errorMessage.includes('Missing blockchain configuration')) {
          return reply.code(500).send({
            error: 'SERVER_MISCONFIGURED',
            message: 'Blockchain configuration missing',
          })
        }

        return reply.code(500).send({
          error: 'INTERNAL_ERROR',
          message: 'Failed to create gift',
        })
      }
    }
  )

  /**
   * GET /api/v1/gifts/:giftId
   * Get gift details
   * Optional authentication (shows more details if authenticated)
   */
  app.get(
    '/api/v1/gifts/:giftId',
    {
      preHandler: optionalAuthMiddleware,
      schema: {
        description: 'Get gift details',
        tags: ['gifts'],
        params: {
          type: 'object',
          properties: {
            giftId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              giftId: { type: 'string' },
              chainId: { type: 'number' },
              createTxHash: { type: 'string' },
              sender: { type: 'object' },
              recipient: { type: 'object', nullable: true },
              recipientAddress: { type: 'string' },
              tokenType: { type: 'string' },
              token: { type: 'string' },
              tokenId: { type: 'string' },
              amount: { type: 'string' },
              tokenSymbol: { type: 'string', nullable: true },
              tokenDecimals: { type: 'number', nullable: true },
              tokenName: { type: 'string', nullable: true },
              message: { type: 'string', nullable: true },
              status: { type: 'string' },
              expiresAt: { type: 'string' },
              createdAt: { type: 'string' },
              claimedAt: { type: 'string', nullable: true },
              claims: { type: 'array' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { giftId } = request.params as { giftId: string }

        const gift = await giftService.getGift(giftId)

        return reply.code(200).send(gift)
      } catch (error: any) {
        if (error.message === 'Gift not found') {
          return reply.code(404).send({
            error: 'NOT_FOUND',
            message: 'Gift not found',
          })
        }

        app.log.error({ error }, 'Failed to get gift')
        return reply.code(500).send({
          error: 'INTERNAL_ERROR',
          message: 'Failed to retrieve gift',
        })
      }
    }
  )

  /**
   * GET /api/v1/gifts
   * Get gifts list with filters
   * Optional authentication
   */
  app.get(
    '/api/v1/gifts',
    {
      preHandler: optionalAuthMiddleware,
      schema: {
        description: 'Get gifts list',
        tags: ['gifts'],
        querystring: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['PENDING', 'CLAIMED', 'REFUNDED', 'EXPIRED'] },
            senderId: { type: 'string' },
            recipientId: { type: 'string' },
            recipientAddress: { type: 'string' },
            limit: { type: 'number' },
            offset: { type: 'number' },
            orderBy: { type: 'string', enum: ['createdAt', 'expiresAt'] },
            order: { type: 'string', enum: ['asc', 'desc'] },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              gifts: { type: 'array' },
              total: { type: 'number' },
              limit: { type: 'number' },
              offset: { type: 'number' },
              hasMore: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const query = GetGiftsQuerySchema.parse(request.query)

        const result = await giftService.getGifts(query)

        return reply.code(200).send(result)
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({
            error: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: error.errors,
          })
        }

        app.log.error({ error }, 'Failed to get gifts')
        return reply.code(500).send({
          error: 'INTERNAL_ERROR',
          message: 'Failed to retrieve gifts',
        })
      }
    }
  )

  /**
   * GET /api/v1/gifts/:giftId/claims
   * Get gift claims
   */
  app.get(
    '/api/v1/gifts/:giftId/claims',
    {
      schema: {
        description: 'Get gift claims',
        tags: ['gifts'],
        params: {
          type: 'object',
          properties: {
            giftId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                amount: { type: 'string' },
                txHash: { type: 'string' },
                chainId: { type: 'number' },
                claimedAt: { type: 'string' },
                claimer: { type: 'object' },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { giftId } = request.params as { giftId: string }

        const claims = await giftService.getGiftClaims(giftId)

        return reply.code(200).send(claims)
      } catch (error: any) {
        if (error.message === 'Gift not found') {
          return reply.code(404).send({
            error: 'NOT_FOUND',
            message: 'Gift not found',
          })
        }

        app.log.error({ error }, 'Failed to get gift claims')
        return reply.code(500).send({
          error: 'INTERNAL_ERROR',
          message: 'Failed to retrieve claims',
        })
      }
    }
  )

  /**
   * GET /api/v1/gifts/:giftId/can-claim
   * Check if user can claim a gift
   * Requires authentication
   */
  app.get(
    '/api/v1/gifts/:giftId/can-claim',
    {
      preHandler: siweAuthMiddleware,
      schema: {
        description: 'Check if user can claim gift',
        tags: ['gifts'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            giftId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              canClaim: { type: 'boolean' },
              reason: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        if (!request.user) {
          return reply.code(401).send({
            error: 'UNAUTHORIZED',
            message: 'Authentication required',
          })
        }

        const { giftId } = request.params as { giftId: string }

        const result = await giftService.canClaim(giftId, request.user.address)

        return reply.code(200).send(result)
      } catch (error) {
        app.log.error({ error }, 'Failed to check claim eligibility')
        return reply.code(500).send({
          error: 'INTERNAL_ERROR',
          message: 'Failed to check eligibility',
        })
      }
    }
  )

  /**
   * POST /api/v1/gifts/:giftId/claim
   * Record gift claim
   * Requires authentication
   */
  const ClaimGiftSchema = z.object({
    txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash'),
    gasUsed: z.string().regex(/^\d+$/, 'Invalid gasUsed').optional(),
    gasPrice: z.string().regex(/^\d+$/, 'Invalid gasPrice').optional(),
  })

  app.post(
    '/api/v1/gifts/:giftId/claim',
    {
      preHandler: siweAuthMiddleware,
      schema: {
        description: 'Record gift claim',
        tags: ['gifts'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            giftId: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          required: ['txHash'],
          properties: {
            txHash: { type: 'string' },
            gasUsed: { type: 'string' },
            gasPrice: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  giftId: { type: 'string' },
                  status: { type: 'string' },
                  claimedAt: { type: 'string' },
                  claimTxHash: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        if (!request.user) {
          return reply.code(401).send({
            error: 'UNAUTHORIZED',
            message: 'Authentication required',
          })
        }

        const { giftId } = request.params as { giftId: string }

        // Validate body
        const body = ClaimGiftSchema.parse(request.body)

        // Record claim
        const result = await giftService.recordClaim(giftId, request.user.userId, body)

        return reply.code(200).send(result)
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({
            error: 'VALIDATION_ERROR',
            message: 'Invalid request parameters',
            details: error.errors,
          })
        }

        app.log.error({ error }, 'Failed to record claim')

        // Handle specific errors
        const errorMessage = error.message || 'Unknown error'

        if (errorMessage === 'Gift not found') {
          return reply.code(404).send({
            error: 'NOT_FOUND',
            message: 'Gift not found',
          })
        }

        if (errorMessage === 'User not found') {
          return reply.code(404).send({
            error: 'NOT_FOUND',
            message: 'User not found',
          })
        }

        if (errorMessage === 'User is not the recipient of this gift') {
          return reply.code(403).send({
            error: 'FORBIDDEN',
            message: 'You are not the recipient of this gift',
          })
        }

        if (errorMessage === 'Gift already claimed') {
          return reply.code(400).send({
            error: 'ALREADY_CLAIMED',
            message: 'Gift has already been claimed',
          })
        }

        if (errorMessage === 'Gift was refunded') {
          return reply.code(400).send({
            error: 'REFUNDED',
            message: 'Gift was refunded',
          })
        }

        if (errorMessage === 'Gift has expired') {
          return reply.code(400).send({
            error: 'EXPIRED',
            message: 'Gift has expired',
          })
        }

        return reply.code(500).send({
          error: 'INTERNAL_ERROR',
          message: 'Failed to record claim',
        })
      }
    }
  )

  /**
   * POST /api/v1/gifts/:giftId/refund
   * Refund an expired gift
   * Requires authentication - only sender can refund
   */
  app.post(
    '/api/v1/gifts/:giftId/refund',
    {
      preHandler: siweAuthMiddleware,
      schema: {
        description: 'Refund an expired gift',
        tags: ['gifts'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            giftId: { type: 'string' },
          },
          required: ['giftId'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              txHash: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        if (!request.user) {
          return reply.code(401).send({
            error: 'UNAUTHORIZED',
            message: 'Authentication required',
          })
        }

        const { giftId } = request.params as { giftId: string }

        // Get gift from database to verify ownership
        const gift = await giftService.getGift(giftId)

        if (!gift) {
          return reply.code(404).send({
            error: 'NOT_FOUND',
            message: 'Gift not found',
          })
        }

        // Verify sender owns this gift
        if (gift.sender.address.toLowerCase() !== request.user.address.toLowerCase()) {
          return reply.code(403).send({
            error: 'FORBIDDEN',
            message: 'Only the sender can refund this gift',
          })
        }

        // Check if gift is expired
        if (new Date() <= gift.expiresAt) {
          return reply.code(400).send({
            error: 'NOT_EXPIRED',
            message: 'Gift has not expired yet',
          })
        }

        // Check if gift is still pending
        if (gift.status !== 'PENDING') {
          return reply.code(400).send({
            error: 'INVALID_STATUS',
            message: `Gift status is ${gift.status}, can only refund PENDING gifts`,
          })
        }

        // Call contract to refund
        const result = await giftService.refundGift(giftId)

        return reply.code(200).send({
          success: true,
          txHash: result.txHash,
        })
      } catch (error: any) {
        app.log.error({ error }, 'Failed to refund gift')

        const errorMessage = error.message || 'Unknown error'

        if (errorMessage.includes('GiftNotFound')) {
          return reply.code(404).send({
            error: 'NOT_FOUND',
            message: 'Gift not found on blockchain',
          })
        }

        if (errorMessage.includes('NotGiftSender')) {
          return reply.code(403).send({
            error: 'FORBIDDEN',
            message: 'Only the sender can refund this gift',
          })
        }

        if (errorMessage.includes('GiftNotExpired')) {
          return reply.code(400).send({
            error: 'NOT_EXPIRED',
            message: 'Gift has not expired yet',
          })
        }

        if (errorMessage.includes('GiftAlreadyClaimed')) {
          return reply.code(400).send({
            error: 'ALREADY_CLAIMED',
            message: 'Gift has already been claimed',
          })
        }

        return reply.code(500).send({
          error: 'INTERNAL_ERROR',
          message: 'Failed to refund gift',
        })
      }
    }
  )

  /**
   * POST /api/v1/gifts/:giftId/claim-proxy
   * Proxy claim gift with user signature or ERC-4337
   * Requires authentication
   */
  const ProxyClaimSchema = z.object({
    signature: z.string().regex(/^0x[a-fA-F0-9]{130}$/, 'Invalid signature format (should be 0x + 130 hex chars)').optional(),
    message: z.string().min(1).optional(),
    usePaymaster: z.boolean().optional().default(false),
  })

  app.post(
    '/api/v1/gifts/:giftId/claim-proxy',
    {
      preHandler: siweAuthMiddleware,
      schema: {
        description: 'Proxy claim gift with signature or ERC-4337',
        tags: ['gifts'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            giftId: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            signature: { type: 'string' },
            message: { type: 'string' },
            usePaymaster: { type: 'boolean' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              txHash: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        if (!request.user) {
          return reply.code(401).send({
            error: 'UNAUTHORIZED',
            message: 'Authentication required',
          })
        }

        const { giftId } = request.params as { giftId: string }
        const body = ProxyClaimSchema.parse(request.body)

        // Get gift to verify it exists
        const gift = await giftService.getGift(giftId)
        if (!gift) {
          return reply.code(404).send({
            error: 'NOT_FOUND',
            message: 'Gift not found',
          })
        }

        // Check if already claimed
        if (gift.status === 'CLAIMED') {
          return reply.code(400).send({
            error: 'ALREADY_CLAIMED',
            message: 'Gift has already been claimed',
          })
        }

        const userAddress = request.user.address as `0x${string}`

        // If no signature provided, generate message for user to sign
        if (!body.signature || !body.message) {
          if (body.usePaymaster) {
            // Try ERC-4337
            try {
              const txHash = await proxyClaimPacket(giftId as `0x${string}`, userAddress, {
                usePaymaster: true,
              })
              return reply.code(200).send({
                success: true,
                txHash,
                message: 'Claim transaction sent via ERC-4337 Paymaster',
              })
            } catch (error: any) {
              return reply.code(400).send({
                error: 'PAYMASTER_ERROR',
                message: error.message || 'ERC-4337 Paymaster not available',
              })
            }
          }

          // Generate message for user to sign
          const nonce = `${Date.now()}-${Math.random()}`
          const message = generateClaimMessage(giftId as `0x${string}`, userAddress, nonce)
          return reply.code(200).send({
            success: false,
            message,
            nonce,
            instructions: 'Please sign this message with your wallet and retry with signature and message fields',
          })
        }

        // Verify and proxy claim
        try {
          const txHash = await proxyClaimPacket(giftId as `0x${string}`, userAddress, {
            signature: body.signature as `0x${string}`,
            message: body.message!,
          })

          // Record claim in database (async, don't wait)
          giftService.recordClaim(giftId, request.user.userId, { txHash }).catch((err) => {
            app.log.error({ err, giftId }, 'Failed to record claim after proxy')
          })

          return reply.code(200).send({
            success: true,
            txHash,
            message: 'Claim transaction sent successfully',
          })
        } catch (error: any) {
          app.log.error({ error, giftId }, 'Failed to proxy claim')

          if (error.message?.includes('signature')) {
            return reply.code(400).send({
              error: 'INVALID_SIGNATURE',
              message: error.message,
            })
          }

          if (error.message?.includes('claimFor')) {
            return reply.code(400).send({
              error: 'CONTRACT_NOT_SUPPORTED',
              message: 'Contract does not support proxy claim. Please use direct contract call.',
            })
          }

          return reply.code(500).send({
            error: 'INTERNAL_ERROR',
            message: 'Failed to proxy claim',
          })
        }
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({
            error: 'VALIDATION_ERROR',
            message: 'Invalid request parameters',
            details: error.errors,
          })
        }

        app.log.error({ error }, 'Failed to proxy claim gift')
        return reply.code(500).send({
          error: 'INTERNAL_ERROR',
          message: 'Failed to process proxy claim',
        })
      }
    }
  )

  /**
   * POST /api/v1/tokens/validate
   * Validate an ERC20 token address
   * Public endpoint (no auth required for validation)
   */
  app.post(
    '/api/v1/tokens/validate',
    {
      schema: {
        description: 'Validate an ERC20 token',
        tags: ['tokens'],
        body: {
          type: 'object',
          required: ['tokenAddress'],
          properties: {
            tokenAddress: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              isValid: { type: 'boolean' },
              isERC20: { type: 'boolean' },
              isBlacklisted: { type: 'boolean' },
              metadata: {
                type: 'object',
                properties: {
                  symbol: { type: ['string', 'null'] },
                  decimals: { type: ['number', 'null'] },
                  name: { type: ['string', 'null'] },
                },
              },
              risks: { type: 'array', items: { type: 'string' } },
              warnings: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const body = z
          .object({
            tokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
          })
          .parse(request.body)

        const validationService = getTokenValidationService()
        const validation = await validationService.validateToken(body.tokenAddress as `0x${string}`)

        return reply.code(200).send(validation)
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({
            error: 'VALIDATION_ERROR',
            message: 'Invalid request parameters',
            details: error.errors,
          })
        }

        app.log.error({ error }, 'Failed to validate token')
        return reply.code(500).send({
          error: 'INTERNAL_ERROR',
          message: 'Failed to validate token',
        })
      }
    }
  )
}

export default plugin
