/**
 * @file Fastify Type Extensions
 * @description Extend Fastify types for custom properties
 */

import '@fastify/jwt'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      userId: string
      address: string
    }
  }
}
