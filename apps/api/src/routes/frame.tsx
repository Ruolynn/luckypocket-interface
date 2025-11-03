import type { FastifyPluginAsync } from 'fastify'
import { Frog, Button } from 'frog'
import { getSSLHubRpcClient } from '@farcaster/hub-nodejs'

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

  // 帮助函数：生成红包图片 URL
  function generatePacketImage(params: {
    message?: string
    totalAmount: string
    remainingCount: number
    count: number
    remainingAmount: string
    isExpired: boolean
    isEmpty: boolean
  }) {
    const { message, totalAmount, remainingCount, count, remainingAmount, isExpired, isEmpty } = params
    const encodedMessage = encodeURIComponent(message || '恭喜发财，大吉大利！')
    const status = isExpired ? 'expired' : isEmpty ? 'empty' : 'active'

    // 使用占位图片服务生成动态图片
    return `https://via.placeholder.com/1200x630/667eea/ffffff?text=${encodedMessage}%0A%0ATotal:${totalAmount}USDC%0ARemaining:${remainingCount}/${count}%0AStatus:${status}`
  }

  // Frame 1: 显示红包详情
  frog.frame('/:packetId', async (c) => {
    const packetId = c.req.param('packetId')

    try {
      const packet = await app.prisma.packet.findUnique({
        where: { packetId },
        include: {
          creator: true,
        },
      })

      if (!packet) {
        return c.res({
          image: 'https://via.placeholder.com/1200x630/667eea/ffffff?text=Red+Packet+Not+Found',
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
      const totalAmount = (BigInt(packet.totalAmount) / BigInt(10**6)).toString()
      const remainingAmount = (BigInt(packet.remainingAmount) / BigInt(10**6)).toString()

      // 生成红包图片
      const imageUrl = generatePacketImage({
        message: packet.message || undefined,
        totalAmount,
        remainingCount: packet.remainingCount,
        count: packet.count,
        remainingAmount,
        isExpired,
        isEmpty,
      })

      return c.res({
        image: imageUrl,
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
        image: 'https://via.placeholder.com/1200x630/667eea/ffffff?text=Loading+Failed',
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
          image: 'https://via.placeholder.com/1200x630/667eea/ffffff?text=Farcaster+Login+Required',
          intents: [
            <Button action={`/${packetId}`}>返回</Button>,
          ],
        })
      }

      // 从 FID 获取地址
      const address = await getAddressFromFid(fid)

      if (!address) {
        return c.res({
          image: 'https://via.placeholder.com/1200x630/667eea/ffffff?text=Cannot+Get+Your+Wallet+Address',
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
          image: 'https://via.placeholder.com/1200x630/667eea/ffffff?text=Red+Packet+Not+Found',
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
        const amount = (BigInt(existingClaim.amount) / BigInt(10**6)).toString()
        return c.res({
          image: `https://via.placeholder.com/1200x630/f093fb/ffffff?text=Already+Claimed!%0AAmount:+${amount}+USDC`,
          intents: [
            <Button action={`/details/${packetId}`}>查看详情</Button>,
            <Button action={`/${packetId}`}>返回</Button>,
          ],
        })
      }

      // 检查红包状态
      if (new Date(packet.expireTime) < new Date()) {
        return c.res({
          image: 'https://via.placeholder.com/1200x630/667eea/ffffff?text=Red+Packet+Expired',
          intents: [
            <Button action={`/${packetId}`}>返回</Button>,
          ],
        })
      }

      if (packet.remainingCount === 0) {
        return c.res({
          image: 'https://via.placeholder.com/1200x630/667eea/ffffff?text=Red+Packet+Empty',
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

      const displayAmount = (claimedAmount / BigInt(10**6)).toString()

      return c.res({
        image: `https://via.placeholder.com/1200x630/84fab0/ffffff?text=Congratulations!%0A%0A+${displayAmount}+USDC%0A%0ARemaining:+${packet.remainingCount - 1}`,
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
        image: 'https://via.placeholder.com/1200x630/667eea/ffffff?text=Claim+Failed',
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
          image: 'https://via.placeholder.com/1200x630/667eea/ffffff?text=Red+Packet+Not+Found',
          intents: [
            <Button action={`/${packetId}`}>返回</Button>,
          ],
        })
      }

      // 构建领取记录文本
      const claimText = claims.map((claim, index) => {
        const addr = claim.user.address
        const shortAddr = `${addr.slice(0, 6)}...${addr.slice(-4)}`
        const amount = (BigInt(claim.amount) / BigInt(10**6)).toString()
        return `${index + 1}.${shortAddr}:${amount}USDC`
      }).join('%0A')

      return c.res({
        image: `https://via.placeholder.com/1200x630/667eea/ffffff?text=Claim+Records%0A%0ATotal:${claims.length}+claims%0A%0A${claimText}`,
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
        image: 'https://via.placeholder.com/1200x630/667eea/ffffff?text=Loading+Failed',
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
}

export default plugin
