import fp from 'fastify-plugin'
import { Server, Socket } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import { createClient } from 'redis'
import { jwtService } from '../services/jwt.service'
import type { JWTPayload } from '../types/auth.types'

declare module 'fastify' {
  interface FastifyInstance {
    io: Server
  }
}

// 扩展 Socket 类型以包含用户信息
interface AuthenticatedSocket extends Socket {
  userId?: string
  address?: string
}

export default fp(async (app) => {
  const io = new Server(app.server, {
    cors: { origin: true, credentials: true },
    // 允许从 handshake.auth 或 handshake.query 获取 token
    allowRequest: (req, callback) => {
      // 允许所有连接，在中间件中验证
      callback(null, true)
    },
  })

  const url = process.env.REDIS_URL
  const pub = createClient({ url: url })
  const sub = pub.duplicate()
  await Promise.all([pub.connect(), sub.connect()])
  io.adapter(createAdapter(pub, sub))

  // JWT 认证中间件
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      // 从 handshake.auth 或 handshake.query 获取 token
      const token = (socket.handshake.auth?.token as string) || (socket.handshake.query?.token as string)

      if (!token) {
        app.log.warn({ socketId: socket.id }, 'Socket connection rejected: No token provided')
        return next(new Error('AUTH_REQUIRED'))
      }

      // 验证 JWT token
      const payload = jwtService.verifyToken(token)
      socket.userId = payload.userId
      socket.address = payload.address

      app.log.info({ userId: payload.userId, socketId: socket.id }, 'Socket authenticated')
      next()
    } catch (error: any) {
      app.log.warn({ error: error.message, socketId: socket.id }, 'Socket authentication failed')
      next(new Error(error.message || 'AUTH_FAILED'))
    }
  })

  io.on('connection', (socket: AuthenticatedSocket) => {
    if (!socket.userId) {
      app.log.warn({ socketId: socket.id }, 'Socket connected without userId, disconnecting')
      socket.disconnect()
      return
    }

    // 自动加入用户专属房间
    socket.join(`user:${socket.userId}`)
    app.log.info({ userId: socket.userId, socketId: socket.id }, 'User joined private room')

    // 订阅红包房间（带权限检查）
    socket.on('subscribe:packet', async (packetId: string) => {
      try {
        if (!packetId || typeof packetId !== 'string') {
          socket.emit('error', { type: 'INVALID_PACKET_ID', message: 'Invalid packet ID' })
          return
        }

        // 检查红包是否存在（可选：检查用户是否有权限查看）
        const packet = await app.prisma.packet.findUnique({
          where: { packetId },
          select: { id: true, creatorId: true },
        })

        if (!packet) {
          socket.emit('error', { type: 'PACKET_NOT_FOUND', message: 'Packet not found' })
          return
        }

        // 加入房间
        socket.join(`packet:${packetId}`)
        app.log.info({ userId: socket.userId, packetId, socketId: socket.id }, 'User subscribed to packet room')

        // 发送确认消息
        socket.emit('subscribed', { packetId, room: `packet:${packetId}` })
      } catch (error: any) {
        app.log.error({ error, userId: socket.userId, packetId }, 'Failed to subscribe to packet room')
        socket.emit('error', { type: 'SUBSCRIPTION_ERROR', message: error.message || 'Failed to subscribe' })
      }
    })

    // 取消订阅红包房间
    socket.on('unsubscribe:packet', (packetId: string) => {
      try {
        if (!packetId || typeof packetId !== 'string') {
          socket.emit('error', { type: 'INVALID_PACKET_ID', message: 'Invalid packet ID' })
          return
        }

        socket.leave(`packet:${packetId}`)
        app.log.info({ userId: socket.userId, packetId, socketId: socket.id }, 'User unsubscribed from packet room')

        socket.emit('unsubscribed', { packetId })
      } catch (error: any) {
        app.log.error({ error, userId: socket.userId, packetId }, 'Failed to unsubscribe from packet room')
        socket.emit('error', { type: 'UNSUBSCRIPTION_ERROR', message: error.message || 'Failed to unsubscribe' })
      }
    })

    // 订阅用户通知（自动加入，无需额外操作）
    socket.on('subscribe:notifications', () => {
      // 用户已经在 user:${userId} 房间中，无需额外操作
      socket.emit('subscribed', { room: `user:${socket.userId}`, type: 'notifications' })
    })

    // 错误处理
    socket.on('error', (error: any) => {
      app.log.error({ error, userId: socket.userId, socketId: socket.id }, 'Socket error')
    })

    // 断开连接处理
    socket.on('disconnect', (reason) => {
      app.log.info({ userId: socket.userId, socketId: socket.id, reason }, 'User disconnected')
    })

    // Ping/Pong 保持连接
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() })
    })
  })

  app.decorate('io', io)
  app.addHook('onClose', async () => {
    await pub.disconnect()
    await sub.disconnect()
    io.close()
  })
})


