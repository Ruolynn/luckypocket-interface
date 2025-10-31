import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

const plugin: FastifyPluginAsync = async (app) => {
  // GET/POST /api/frame/:packetId - 显示 Frame（Frog 框架占位）
  app.get('/api/frame/:packetId', async (req, reply) => {
    const { packetId } = z.object({ packetId: z.string() }).parse(req.params)
    const packet = await app.prisma.packet.findUnique({ where: { packetId } })
    if (!packet) {
      return reply.type('text/html').send(`
        <!DOCTYPE html>
        <html><body>
          <h1>红包不存在</h1>
        </body></html>
      `)
    }
    
    // 简化 Frame 响应（实际应使用 Frog 框架）
    return reply.type('text/html').send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="https://via.placeholder.com/600x400?text=RedPacket" />
          <meta property="fc:frame:button:1" content="领取红包" />
          <meta property="fc:frame:button:1:action" content="post" />
          <meta property="fc:frame:button:1:target" content="${process.env.API_BASE_URL || 'http://localhost:3001'}/api/frame/claim/${packetId}" />
        </head>
        <body>
          <h1>红包详情</h1>
          <p>ID: ${packetId}</p>
          <p>剩余: ${packet.remainingCount}/${packet.count}</p>
        </body>
      </html>
    `)
  })

  // POST /api/frame/claim/:packetId - Frame 内领取（需要 Farcaster Fid）
  app.post('/api/frame/claim/:packetId', async (req, reply) => {
    const { packetId } = z.object({ packetId: z.string() }).parse(req.params)
    // 简化：从请求中提取 fid（实际应从 Farcaster Hub API 获取）
    const fid = (req.body as any)?.fid || (req.headers as any)['x-farcaster-fid']
    
    if (!fid) {
      return reply.type('text/html').send(`
        <!DOCTYPE html>
        <html><body><h1>需要 Farcaster 登录</h1></body></html>
      `)
    }

    // 通过 fid 获取 address（简化：实际应调用 Farcaster Hub API）
    // const address = await getAddressFromFid(fid)
    // const user = await app.prisma.user.findUnique({ where: { farcasterFid: fid } })
    
    return reply.type('text/html').send(`
      <!DOCTYPE html>
      <html><body>
        <h1>领取功能开发中</h1>
        <p>Frame 领取功能需要集成 Farcaster Hub API</p>
      </body></html>
    `)
  })
}

export default plugin

