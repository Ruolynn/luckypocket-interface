import type { FastifyPluginAsync } from 'fastify'
import { Frog, Button } from 'frog'
import { getSSLHubRpcClient } from '@farcaster/hub-nodejs'
import { z } from 'zod'
import { ensureIdempotency } from '../utils/idempotency'
import { withLock } from '../utils/locks'
import { proxyClaimPacket, generateClaimMessage } from '../services/contract.service'

const plugin: FastifyPluginAsync = async (app) => {
  // 初始化 Farcaster Hub 客户端
  const hubClient = getSSLHubRpcClient('hub-grpc.pinata.cloud')

  // 初始化 Frog 框架
  const frog = new Frog({
    basePath: '/api/frame',
    title: '🧧 HongBao - 红包 dApp',
  })

  // 帮助函数：从 FID 获取用户地址
  async function getAddressFromFid(fid: number): Promise<string | null> {
    try {
      const result = await hubClient.getVerificationsByFid({ fid })

      if (result.isOk() && result.value.messages.length > 0) {
        // 获取第一个验证的地址
        const verification = result.value.messages[0]
        const address = verification.data?.verificationAddAddressBody?.address

        if (address) {
          // 将 Uint8Array 转换为十六进制地址
          return '0x' + Buffer.from(address).toString('hex')
        }
      }

      return null
    } catch (error) {
      app.log.error({ error, fid }, 'Failed to get address from FID')
      return null
    }
  }

  // 帮助函数：确保用户存在
  async function ensureUser(fid: number, address: string) {
    const user = await app.prisma.user.findUnique({
      where: { address: address.toLowerCase() },
    })

    if (!user) {
      // 创建新用户
      return await app.prisma.user.create({
        data: {
          address: address.toLowerCase(),
          farcasterFid: fid,
        },
      })
    }

    // 更新 FID（如果未设置）
    if (!user.farcasterFid) {
      return await app.prisma.user.update({
        where: { id: user.id },
        data: { farcasterFid: fid },
      })
    }

    return user
  }

  // 帮助函数：生成红包图片 JSX
  function generatePacketImage(params: {
    message?: string
    totalAmount: string
    remainingCount: number
    count: number
    remainingAmount: string
    isExpired: boolean
    isEmpty: boolean
    tokenSymbol?: string
    creatorName?: string
  }) {
    const { message, totalAmount, remainingCount, count, remainingAmount, isExpired, isEmpty, tokenSymbol = 'USDC', creatorName } = params
    const status = isExpired ? '已过期' : isEmpty ? '已抢完' : '进行中'
    const bgColor = isExpired ? '#6b7280' : isEmpty ? '#9ca3af' : '#ef4444'
    const accentColor = isExpired ? '#4b5563' : isEmpty ? '#6b7280' : '#dc2626'

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: `linear-gradient(135deg, ${bgColor} 0%, ${accentColor} 100%)`,
          padding: '60px 40px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#ffffff',
        }}
      >
        {/* 红包图标 */}
        <div style={{ fontSize: '120px', marginBottom: '20px' }}>🧧</div>

        {/* 创建者信息 */}
        {creatorName && (
          <div style={{ fontSize: '28px', marginBottom: '10px', opacity: 0.9 }}>
            {creatorName} 的红包
          </div>
        )}

        {/* 祝福语 */}
        <div
          style={{
            fontSize: '36px',
            fontWeight: 'bold',
            marginBottom: '40px',
            textAlign: 'center',
            maxWidth: '900px',
            lineHeight: '1.4',
          }}
        >
          {message || '恭喜发财，大吉大利！'}
        </div>

        {/* 金额信息 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '30px',
          }}
        >
          <div style={{ fontSize: '48px', fontWeight: 'bold' }}>
            {totalAmount} {tokenSymbol}
          </div>
          <div style={{ fontSize: '24px', opacity: 0.9 }}>
            剩余: {remainingAmount} {tokenSymbol}
          </div>
        </div>

        {/* 进度信息 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            fontSize: '28px',
            marginTop: '20px',
          }}
        >
          <div style={{ opacity: 0.9 }}>
            {remainingCount} / {count}
          </div>
          <div
            style={{
              padding: '8px 20px',
              borderRadius: '20px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              fontSize: '20px',
            }}
          >
            {status}
          </div>
        </div>
      </div>
    )
  }

  // Frame 1: 显示红包详情
  frog.frame('/:packetId', async (c) => {
    const packetId = c.req.param('packetId')

    try {
      // 尝试从缓存读取（优化首屏渲染）
      const redis = (app as any).redis as import('ioredis').Redis | undefined
      const cacheKey = `frame:packet:${packetId}`
      let packet: any = null

      if (redis) {
        try {
          const cached = await redis.get(cacheKey)
          if (cached) {
            packet = JSON.parse(cached)
          }
        } catch (e) {
          // 缓存读取失败，继续从数据库读取
        }
      }

      // 如果缓存未命中，从数据库读取
      if (!packet) {
        packet = await app.prisma.packet.findUnique({
          where: { packetId },
          include: {
            creator: true,
          },
        })

        // 写入缓存（TTL: 30秒，平衡实时性和性能）
        if (packet && redis) {
          try {
            await redis.setex(cacheKey, 30, JSON.stringify(packet))
          } catch (e) {
            // 缓存写入失败不影响主流程
          }
        }
      }

      if (!packet) {
        return c.res({
          image: (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                color: '#ffffff',
                fontSize: '48px',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              <div style={{ fontSize: '80px', marginBottom: '20px' }}>❌</div>
              <div>红包不存在</div>
            </div>
          ),
          intents: [
            <Button.Link href={process.env.WEB_URL || 'http://localhost:3000'}>
              前往 dApp
            </Button.Link>,
          ],
        })
      }

      // 检查是否过期
      const isExpired = new Date(packet.expireTime) < new Date()

      // 检查是否抢完
      const isEmpty = packet.remainingCount === 0

      // 格式化金额（假设是 6 位小数的 USDC）
      const decimals = packet.tokenDecimals || 6
      const totalAmount = (BigInt(packet.totalAmount) / BigInt(10 ** decimals)).toLocaleString()
      const remainingAmount = (BigInt(packet.remainingAmount) / BigInt(10 ** decimals)).toLocaleString()
      const tokenSymbol = packet.tokenSymbol || 'USDC'
      const creatorName = packet.creator?.farcasterName || packet.creator?.address?.slice(0, 6) + '...' || '匿名用户'

      // 生成红包图片
      const packetImage = generatePacketImage({
        message: packet.message || undefined,
        totalAmount,
        remainingCount: packet.remainingCount,
        count: packet.count,
        remainingAmount,
        isExpired,
        isEmpty,
        tokenSymbol,
        creatorName,
      })

      return c.res({
        image: packetImage,
        intents: [
          !isExpired && !isEmpty && (
            <Button action={`/claim/${packetId}`}>
              🎁 领取红包
            </Button>
          ),
          <Button action={`/details/${packetId}`}>
            📋 查看详情
          </Button>,
          <Button.Link href={`${process.env.WEB_URL || 'http://localhost:3000'}/packets/${packetId}`}>
            🌐 Web 查看
          </Button.Link>,
        ],
      })
    } catch (error) {
      app.log.error({ error, packetId }, 'Failed to load packet for frame')
      return c.res({
        image: (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: '#ffffff',
              fontSize: '36px',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            <div style={{ fontSize: '80px', marginBottom: '20px' }}>⚠️</div>
            <div>加载失败，请重试</div>
          </div>
        ),
        intents: [
          <Button action={`/${packetId}`}>重试</Button>,
        ],
      })
    }
  })

  // Frame 2: 领取红包
  frog.frame('/claim/:packetId', async (c) => {
    const packetId = c.req.param('packetId')

    try {
      // 获取 Farcaster 用户信息
      const { fid } = c.frameData || {}

      if (!fid) {
        return c.res({
          image: (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: '#ffffff',
                fontSize: '36px',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              <div style={{ fontSize: '80px', marginBottom: '20px' }}>🔐</div>
              <div>请先登录 Farcaster</div>
            </div>
          ),
          intents: [
            <Button action={`/${packetId}`}>返回</Button>,
          ],
        })
      }

      // 从 FID 获取地址
      const address = await getAddressFromFid(fid)

      if (!address) {
        return c.res({
          image: (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#ffffff',
                fontSize: '32px',
                fontFamily: 'system-ui, sans-serif',
                textAlign: 'center',
                padding: '40px',
              }}
            >
              <div style={{ fontSize: '80px', marginBottom: '20px' }}>🔑</div>
              <div>无法获取您的钱包地址</div>
              <div style={{ fontSize: '24px', marginTop: '20px', opacity: 0.9 }}>
                请确保已绑定以太坊地址
              </div>
            </div>
          ),
          intents: [
            <Button action={`/${packetId}`}>返回</Button>,
          ],
        })
      }

      // 确保用户存在
      const user = await ensureUser(fid, address)

      // 获取红包信息
      const packet = await app.prisma.packet.findUnique({
        where: { packetId },
      })

      if (!packet) {
        return c.res({
          image: (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                color: '#ffffff',
                fontSize: '36px',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              <div style={{ fontSize: '80px', marginBottom: '20px' }}>❌</div>
              <div>红包不存在</div>
            </div>
          ),
          intents: [
            <Button action={`/${packetId}`}>返回</Button>,
          ],
        })
      }

      // 检查是否已领取
      const existingClaim = await app.prisma.claim.findUnique({
        where: {
          packetId_userId: {
            packetId: packet.id,
            userId: user.id,
          },
        },
      })

      if (existingClaim) {
        const decimals = packet.tokenDecimals || 6
        const amount = (BigInt(existingClaim.amount) / BigInt(10 ** decimals)).toLocaleString()
        const tokenSymbol = packet.tokenSymbol || 'USDC'
        return c.res({
          image: (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
                color: '#ffffff',
                fontSize: '48px',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              <div style={{ fontSize: '100px', marginBottom: '30px' }}>✅</div>
              <div style={{ fontWeight: 'bold', marginBottom: '20px' }}>已领取！</div>
              <div style={{ fontSize: '36px', opacity: 0.9 }}>
                {amount} {tokenSymbol}
              </div>
            </div>
          ),
          intents: [
            <Button action={`/details/${packetId}`}>查看详情</Button>,
            <Button action={`/${packetId}`}>返回</Button>,
          ],
        })
      }

      // 检查红包状态
      if (new Date(packet.expireTime) < new Date()) {
        return c.res({
          image: (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                color: '#ffffff',
                fontSize: '48px',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              <div style={{ fontSize: '100px', marginBottom: '30px' }}>⏰</div>
              <div>红包已过期</div>
            </div>
          ),
          intents: [
            <Button action={`/${packetId}`}>返回</Button>,
          ],
        })
      }

      if (packet.remainingCount === 0) {
        return c.res({
          image: (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
                color: '#ffffff',
                fontSize: '48px',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              <div style={{ fontSize: '100px', marginBottom: '30px' }}>📭</div>
              <div>红包已抢完</div>
            </div>
          ),
          intents: [
            <Button action={`/${packetId}`}>返回</Button>,
          ],
        })
      }

      // 计算领取金额（固定金额 = 剩余金额 / 剩余份数）
      const claimedAmount = BigInt(packet.remainingAmount) / BigInt(packet.remainingCount)

      // 创建领取记录
      await app.prisma.claim.create({
        data: {
          packet: { connect: { id: packet.id } },
          user: { connect: { id: user.id } },
          amount: claimedAmount.toString(),
          txHash: '0x' + '0'.repeat(64), // 临时占位，实际应该是真实的交易哈希
        },
      })

      // 更新红包剩余
      await app.prisma.packet.update({
        where: { id: packet.id },
        data: {
          remainingAmount: (BigInt(packet.remainingAmount) - claimedAmount).toString(),
          remainingCount: packet.remainingCount - 1,
        },
      })

      // 广播 Socket.IO 事件
      app.io.to(`packet:${packetId}`).emit('packet:claimed', {
        packetId,
        claimer: address,
        amount: claimedAmount.toString(),
        remainingCount: packet.remainingCount - 1,
      })

      // 领取成功后，尝试结算邀请奖励（异步，不阻塞响应）
      app.inviteService.settleInviteReward(user.id).catch((err) => {
        app.log.error({ error: err, userId: user.id }, 'Failed to settle invite reward in frame')
      })

      // 检查并解锁成就（异步，不阻塞响应）
      app.achievementService.checkAndUnlockAchievements(user.id).catch((err) => {
        app.log.error({ error: err, userId: user.id }, 'Failed to check achievements in frame')
      })

      const decimals = packet.tokenDecimals || 6
      const displayAmount = (claimedAmount / BigInt(10 ** decimals)).toLocaleString()
      const tokenSymbol = packet.tokenSymbol || 'USDC'

      return c.res({
        image: (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              fontSize: '48px',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            <div style={{ fontSize: '120px', marginBottom: '30px' }}>🎉</div>
            <div style={{ fontWeight: 'bold', marginBottom: '20px' }}>恭喜领取！</div>
            <div style={{ fontSize: '56px', marginBottom: '30px', fontWeight: 'bold' }}>
              {displayAmount} {tokenSymbol}
            </div>
            <div style={{ fontSize: '28px', opacity: 0.9 }}>
              剩余: {packet.remainingCount - 1} 个
            </div>
          </div>
        ),
        intents: [
          <Button action={`/details/${packetId}`}>查看详情</Button>,
          <Button.Link href={process.env.WEB_URL || 'http://localhost:3000'}>
            创建红包
          </Button.Link>,
        ],
      })
    } catch (error) {
      app.log.error({ error, packetId }, 'Failed to claim packet in frame')
      return c.res({
        image: (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: '#ffffff',
              fontSize: '36px',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            <div style={{ fontSize: '80px', marginBottom: '20px' }}>❌</div>
            <div>领取失败</div>
            <div style={{ fontSize: '24px', marginTop: '20px', opacity: 0.9 }}>
              请稍后重试
            </div>
          </div>
        ),
        intents: [
          <Button action={`/${packetId}`}>返回</Button>,
        ],
      })
    }
  })

  // Frame 3: 查看领取详情
  frog.frame('/details/:packetId', async (c) => {
    const packetId = c.req.param('packetId')

    try {
      const claims = await app.prisma.claim.findMany({
        where: { packet: { packetId } },
        include: { user: true },
        orderBy: { claimedAt: 'desc' },
        take: 5,
      })

      const packet = await app.prisma.packet.findUnique({
        where: { packetId },
      })

      if (!packet) {
        return c.res({
          image: (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                color: '#ffffff',
                fontSize: '36px',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              <div style={{ fontSize: '80px', marginBottom: '20px' }}>❌</div>
              <div>红包不存在</div>
            </div>
          ),
          intents: [
            <Button action={`/${packetId}`}>返回</Button>,
          ],
        })
      }

      // 格式化金额
      const decimals = packet.tokenDecimals || 6
      const tokenSymbol = packet.tokenSymbol || 'USDC'

      return c.res({
        image: (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#ffffff',
              fontFamily: 'system-ui, sans-serif',
              padding: '50px 40px',
            }}
          >
            <div style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '30px', textAlign: 'center' }}>
              📋 领取记录
            </div>
            <div style={{ fontSize: '24px', marginBottom: '30px', opacity: 0.9, textAlign: 'center' }}>
              共 {claims.length} 条记录
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                flex: 1,
                overflow: 'hidden',
              }}
            >
              {claims.slice(0, 5).map((claim, index) => {
                const addr = claim.user.address
                const shortAddr = `${addr.slice(0, 6)}...${addr.slice(-4)}`
                const amount = (BigInt(claim.amount) / BigInt(10 ** decimals)).toLocaleString()
                return (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 20px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      fontSize: '22px',
                    }}
                  >
                    <div>
                      <span style={{ opacity: 0.8 }}>#{index + 1}</span> {shortAddr}
                    </div>
                    <div style={{ fontWeight: 'bold' }}>
                      {amount} {tokenSymbol}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ),
        intents: [
          <Button action={`/${packetId}`}>返回</Button>,
          <Button.Link href={`${process.env.WEB_URL || 'http://localhost:3000'}/packets/${packetId}`}>
            Web 查看全部
          </Button.Link>,
        ],
      })
    } catch (error) {
      app.log.error({ error, packetId }, 'Failed to load details for frame')
      return c.res({
        image: (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: '#ffffff',
              fontSize: '36px',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            <div style={{ fontSize: '80px', marginBottom: '20px' }}>⚠️</div>
            <div>加载失败</div>
          </div>
        ),
        intents: [
          <Button action={`/${packetId}`}>返回</Button>,
        ],
      })
    }
  })

  // 将 Frog 路由挂载到 Fastify
  app.all('/api/frame/*', async (req, reply) => {
    // 构建完整的 URL
    const protocol = req.protocol
    const host = req.hostname
    const url = `${protocol}://${host}${req.url}`

    // 创建 Web API Request 对象
    const request = new Request(url, {
      method: req.method,
      headers: req.headers as HeadersInit,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    })

    const response = await frog.fetch(request)

    reply.status(response.status)
    response.headers.forEach((value, key) => {
      reply.header(key, value)
    })

    return reply.send(await response.text())
  })

  // Step 1: 提供 /api/frame/claim 接口草案（后续补充幂等与锁）
  app.post('/api/frame/claim', async (req: any, reply) => {
    try {
      const BodySchema = z.object({
        packetId: z.string().min(1),
        fid: z.coerce.number().int().positive(),
      })
      const body = BodySchema.parse(req.body)

      // 幂等键校验（通过 header: idempotency-key）
      await ensureIdempotency(req, reply)
      if (reply.sent) return

      // 并发锁：同一 packetId+fid 在锁存期间只能处理一次
      const redis = (app as any).redis
      const lockKey = `frame:claim:${body.packetId}:${body.fid}`

      const result = await withLock(redis, lockKey, 10, async () => {
        // 1) Farcaster fid -> address
        const address = await (async () => {
          try {
            const r = await hubClient.getVerificationsByFid({ fid: body.fid })
            if (r.isOk() && r.value.messages.length > 0) {
              const v = r.value.messages[0]
              const addr = v.data?.verificationAddAddressBody?.address
              if (addr) return '0x' + Buffer.from(addr).toString('hex')
            }
          } catch {}
          return null
        })()

        if (!address) {
          // 回退：根据 fid 查已有用户记录
          const fallbackUser = await app.prisma.user.findFirst({ where: { farcasterFid: body.fid } })
          if (!fallbackUser?.address) {
            return { ok: false, error: 'ADDRESS_NOT_FOUND', message: 'Cannot resolve wallet from fid' }
          }
          // 使用已存在用户地址
          const addr = fallbackUser.address
          // 确保后续逻辑可用该地址
          const user = fallbackUser

          // 3) load packet
          const packet = await app.prisma.packet.findUnique({ where: { packetId: body.packetId } })
          if (!packet) {
            return { ok: false, error: 'PACKET_NOT_FOUND' }
          }

          const existed = await app.prisma.claim.findUnique({
            where: { packetId_userId: { packetId: packet.id, userId: user.id } } as any,
          })
          if (existed) {
            return {
              ok: true,
              status: 'ALREADY_CLAIMED',
              data: { amount: existed.amount, txHash: existed.txHash },
            }
          }

          if (new Date(packet.expireTime) < new Date()) return { ok: false, error: 'PACKET_EXPIRED' }
          if (packet.remainingCount === 0) return { ok: false, error: 'PACKET_EMPTY' }

          const claimedAmount = (BigInt(packet.remainingAmount) / BigInt(packet.remainingCount)).toString()
          const now = new Date()

          // 尝试链上领取（如果启用 ERC-4337 或合约支持 claimFor）
          let txHash: string | null = null
          try {
            // 方案1: 尝试使用 ERC-4337 Paymaster（如果配置）
            if (process.env.ENABLE_ERC4337_PAYMASTER === 'true') {
              txHash = await proxyClaimPacket(body.packetId as `0x${string}`, addr as `0x${string}`, {
                usePaymaster: true,
              })
            }
          } catch (err: any) {
            // ERC-4337 未实现或失败，继续使用数据库记录
            app.log.warn({ err, packetId: body.packetId }, 'Chain claim failed, using DB-only mode')
          }

          // 如果链上调用失败，使用占位 txHash（后续由同步任务处理）
          if (!txHash) {
            txHash = '0x' + '0'.repeat(64)
          }

          const { claim, updated } = await app.prisma.$transaction(async (tx) => {
            const created = await tx.claim.create({
              data: {
                packetId: packet.id,
                userId: user.id,
                amount: claimedAmount,
                txHash,
                claimedAt: now,
              },
            })
            const upd = await tx.packet.update({
              where: { id: packet.id },
              data: {
                remainingAmount: (BigInt(packet.remainingAmount) - BigInt(claimedAmount)).toString(),
                remainingCount: packet.remainingCount - 1,
              },
            })
            return { claim: created, updated: upd }
          })

          try {
            app.io.to(`packet:${body.packetId}`).emit('packet:claimed', {
              packetId: body.packetId,
              claimer: addr,
              amount: claimedAmount,
              remainingCount: updated.remainingCount,
            })
          } catch {}

          app.inviteService?.settleInviteReward(user.id).catch(() => {})
          app.achievementService?.checkAndUnlockAchievements(user.id).catch(() => {})

          return { ok: true, status: 'CLAIMED', data: { amount: claimedAmount, userAddress: addr, remainingCount: updated.remainingCount } }
        }

        // 2) ensure user exists
        const user = await (async () => {
          const u = await app.prisma.user.findUnique({ where: { address: address.toLowerCase() } })
          if (u) return u
          return await app.prisma.user.create({
            data: { address: address.toLowerCase(), farcasterFid: body.fid },
          })
        })()

        // 3) load packet
        const packet = await app.prisma.packet.findUnique({ where: { packetId: body.packetId } })
        if (!packet) {
          return { ok: false, error: 'PACKET_NOT_FOUND' }
        }

        // already claimed?
        const existed = await app.prisma.claim.findUnique({
          where: { packetId_userId: { packetId: packet.id, userId: user.id } } as any,
        })
        if (existed) {
          return {
            ok: true,
            status: 'ALREADY_CLAIMED',
            data: {
              amount: existed.amount,
              txHash: existed.txHash,
            },
          }
        }

        // status checks
        if (new Date(packet.expireTime) < new Date()) {
          return { ok: false, error: 'PACKET_EXPIRED' }
        }
        if (packet.remainingCount === 0) {
          return { ok: false, error: 'PACKET_EMPTY' }
        }

        // 4) compute amount (fixed split)
        const claimedAmount = (BigInt(packet.remainingAmount) / BigInt(packet.remainingCount)).toString()

        // 5) 尝试链上领取（如果启用 ERC-4337）
        let txHash: string | null = null
        try {
          if (process.env.ENABLE_ERC4337_PAYMASTER === 'true') {
            txHash = await proxyClaimPacket(body.packetId as `0x${string}`, address as `0x${string}`, {
              usePaymaster: true,
            })
          }
        } catch (err: any) {
          app.log.warn({ err, packetId: body.packetId }, 'Chain claim failed, using DB-only mode')
        }

        if (!txHash) {
          txHash = '0x' + '0'.repeat(64)
        }

        // 6) tx: create claim + update packet
        const now = new Date()
        const { claim, updated } = await app.prisma.$transaction(async (tx) => {
          const created = await tx.claim.create({
            data: {
              packetId: packet.id,
              userId: user.id,
              amount: claimedAmount,
              txHash,
              claimedAt: now,
            },
          })

          const upd = await tx.packet.update({
            where: { id: packet.id },
            data: {
              remainingAmount: (BigInt(packet.remainingAmount) - BigInt(claimedAmount)).toString(),
              remainingCount: packet.remainingCount - 1,
            },
          })

          return { claim: created, updated: upd }
        })

        // 7) socket broadcast
        try {
          app.io.to(`packet:${body.packetId}`).emit('packet:claimed', {
            packetId: body.packetId,
            claimer: address,
            amount: claimedAmount,
            remainingCount: updated.remainingCount,
          })
        } catch {}

        // 8) async: invite/achievement (best-effort)
        app.inviteService?.settleInviteReward(user.id).catch(() => {})
        app.achievementService?.checkAndUnlockAchievements(user.id).catch(() => {})

        return {
          ok: true,
          status: 'CLAIMED',
          data: {
            amount: claimedAmount,
            userAddress: address,
            remainingCount: updated.remainingCount,
          },
        }
      })

      return reply.code(200).send(result)
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return reply.code(400).send({ error: 'VALIDATION_ERROR', details: err.errors })
      }
      if (err?.message === 'LOCKED') {
        return reply.code(429).send({ error: 'BUSY', message: 'Please retry later' })
      }
      return reply.code(500).send({ error: 'INTERNAL_ERROR' })
    }
  })
}

export default plugin
