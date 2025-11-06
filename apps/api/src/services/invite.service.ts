import type { FastifyInstance } from 'fastify'
import type { PrismaClient } from '@prisma/client'

interface InviteRewardConfig {
  // 奖励金额 (USDC, 6 decimals)
  directInviteReward: bigint // $2 = 2_000_000
  newUserBonus: bigint // $2 = 2_000_000

  // 预算控制
  dailyBudgetLimit: bigint // 每日预算上限
  weeklyBudgetLimit: bigint // 每周预算上限
  userDailyClaimLimit: number // 单用户每日领取上限
  userTotalClaimLimit: number // 单用户总领取上限

  // 熔断机制
  circuitBreakerEnabled: boolean // 是否启用熔断
  circuitBreakerFailureThreshold: number // 失败次数阈值（触发熔断）
  circuitBreakerResetTimeout: number // 熔断恢复时间（秒）
  circuitBreakerHalfOpenMaxCalls: number // 半开状态最大尝试次数

  // 风控
  enableAntiFraud: boolean // 是否启用反欺诈检测
  maxInvitesPerIP: number // 单IP每日最大邀请数
  maxInvitesPerDevice: number // 单设备每日最大邀请数

  // 开关
  enabled: boolean
}

// 默认配置
const DEFAULT_CONFIG: InviteRewardConfig = {
  directInviteReward: BigInt(2_000_000), // $2 USDC
  newUserBonus: BigInt(2_000_000), // $2 USDC
  dailyBudgetLimit: BigInt(1000_000_000), // $1000 per day
  weeklyBudgetLimit: BigInt(5000_000_000), // $5000 per week
  userDailyClaimLimit: 10, // 每用户每天最多10次
  userTotalClaimLimit: 100, // 每用户总共最多100次
  circuitBreakerEnabled: true,
  circuitBreakerFailureThreshold: 10, // 10次失败后触发熔断
  circuitBreakerResetTimeout: 300, // 5分钟后尝试恢复
  circuitBreakerHalfOpenMaxCalls: 3, // 半开状态最多尝试3次
  enableAntiFraud: true,
  maxInvitesPerIP: 20, // 单IP每日最多20个邀请
  maxInvitesPerDevice: 10, // 单设备每日最多10个邀请
  enabled: true,
}

// 熔断器状态
enum CircuitBreakerState {
  CLOSED = 'CLOSED', // 正常状态
  OPEN = 'OPEN', // 熔断状态
  HALF_OPEN = 'HALF_OPEN', // 半开状态（尝试恢复）
}

export class InviteRewardService {
  private config: InviteRewardConfig
  private prisma: PrismaClient
  private redis: any
  private app: FastifyInstance
  private circuitBreakerState: CircuitBreakerState = CircuitBreakerState.CLOSED
  private circuitBreakerFailureCount: number = 0
  private circuitBreakerLastFailureTime: number = 0
  private circuitBreakerHalfOpenCalls: number = 0

  constructor(app: FastifyInstance) {
    this.app = app
    this.prisma = app.prisma
    this.redis = app.redis
    this.config = DEFAULT_CONFIG
  }

  /**
   * 检查邀请关系是否有效
   */
  private async validateInvitation(inviterId: string, inviteeId: string): Promise<boolean> {
    // 不能自己邀请自己
    if (inviterId === inviteeId) {
      return false
    }

    // 检查邀请关系是否存在
    const invitation = await this.prisma.invitation.findUnique({
      where: {
        inviterId_inviteeId: {
          inviterId,
          inviteeId,
        },
      },
    })

    return !!invitation
  }

  /**
   * 检查用户是否已完成首次行为（发红包或抢红包）
   */
  async hasUserCompletedFirstAction(userId: string): Promise<boolean> {
    // 检查是否创建过红包
    const createdPacket = await this.prisma.packet.findFirst({
      where: { creatorId: userId },
    })

    if (createdPacket) {
      return true
    }

    // 检查是否领取过红包
    const claim = await this.prisma.claim.findFirst({
      where: { userId },
    })

    return !!claim
  }

  /**
   * 检查预算限制
   */
  private async checkBudgetLimits(): Promise<{ allowed: boolean; reason?: string }> {
    if (!this.config.enabled) {
      return { allowed: false, reason: 'Invite rewards disabled' }
    }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)

    // 获取今日已发放金额
    const dailySpent = await this.getDailySpent(todayStart)
    if (dailySpent >= this.config.dailyBudgetLimit) {
      return { allowed: false, reason: 'Daily budget limit exceeded' }
    }

    // 获取本周已发放金额
    const weeklySpent = await this.getWeeklySpent(weekStart)
    if (weeklySpent >= this.config.weeklyBudgetLimit) {
      return { allowed: false, reason: 'Weekly budget limit exceeded' }
    }

    return { allowed: true }
  }

  /**
   * 获取今日已发放金额（使用 Redis 缓存）
   */
  private async getDailySpent(todayStart: Date): Promise<bigint> {
    const cacheKey = `invite:daily_spent:${todayStart.toISOString().split('T')[0]}`

    // 尝试从 Redis 获取
    const cached = await this.redis.get(cacheKey)
    if (cached) {
      return BigInt(cached)
    }

    // 从数据库计算
    const invitations = await this.prisma.invitation.findMany({
      where: {
        rewardPaid: true,
        createdAt: { gte: todayStart },
      },
    })

    const total = BigInt(invitations.length) * this.config.directInviteReward

    // 缓存到 Redis (TTL: 1天)
    await this.redis.setex(cacheKey, 86400, total.toString())

    return total
  }

  /**
   * 获取本周已发放金额
   */
  private async getWeeklySpent(weekStart: Date): Promise<bigint> {
    const cacheKey = `invite:weekly_spent:${weekStart.toISOString().split('T')[0]}`

    const cached = await this.redis.get(cacheKey)
    if (cached) {
      return BigInt(cached)
    }

    const invitations = await this.prisma.invitation.findMany({
      where: {
        rewardPaid: true,
        createdAt: { gte: weekStart },
      },
    })

    const total = BigInt(invitations.length) * this.config.directInviteReward

    // 缓存到 Redis (TTL: 7天)
    await this.redis.setex(cacheKey, 604800, total.toString())

    return total
  }

  /**
   * 检查熔断器状态
   */
  private async checkCircuitBreaker(): Promise<{ allowed: boolean; reason?: string }> {
    if (!this.config.circuitBreakerEnabled) {
      return { allowed: true }
    }

    const now = Date.now()

    // 检查是否需要从 OPEN 状态恢复
    if (this.circuitBreakerState === CircuitBreakerState.OPEN) {
      const timeSinceLastFailure = (now - this.circuitBreakerLastFailureTime) / 1000
      if (timeSinceLastFailure >= this.config.circuitBreakerResetTimeout) {
        // 进入半开状态
        this.circuitBreakerState = CircuitBreakerState.HALF_OPEN
        this.circuitBreakerHalfOpenCalls = 0
        this.app.log.info('Circuit breaker entering HALF_OPEN state')
      } else {
        return {
          allowed: false,
          reason: `Circuit breaker is OPEN. Retry after ${Math.ceil(this.config.circuitBreakerResetTimeout - timeSinceLastFailure)} seconds`,
        }
      }
    }

    // 半开状态检查
    if (this.circuitBreakerState === CircuitBreakerState.HALF_OPEN) {
      if (this.circuitBreakerHalfOpenCalls >= this.config.circuitBreakerHalfOpenMaxCalls) {
        // 半开状态尝试次数过多，重新进入 OPEN 状态
        this.circuitBreakerState = CircuitBreakerState.OPEN
        this.circuitBreakerLastFailureTime = now
        this.app.log.warn('Circuit breaker re-entering OPEN state after HALF_OPEN attempts')
        return { allowed: false, reason: 'Circuit breaker is OPEN after HALF_OPEN attempts' }
      }
    }

    return { allowed: true }
  }

  /**
   * 记录成功操作（用于熔断器）
   */
  private recordSuccess(): void {
    if (this.circuitBreakerState === CircuitBreakerState.HALF_OPEN) {
      // 半开状态下成功，恢复正常
      this.circuitBreakerState = CircuitBreakerState.CLOSED
      this.circuitBreakerFailureCount = 0
      this.circuitBreakerHalfOpenCalls = 0
      this.app.log.info('Circuit breaker recovered to CLOSED state')
    } else if (this.circuitBreakerState === CircuitBreakerState.CLOSED) {
      // 正常状态下，重置失败计数
      this.circuitBreakerFailureCount = 0
    }
  }

  /**
   * 记录失败操作（用于熔断器）
   */
  private recordFailure(): void {
    this.circuitBreakerFailureCount++
    this.circuitBreakerLastFailureTime = Date.now()

    if (this.circuitBreakerState === CircuitBreakerState.HALF_OPEN) {
      // 半开状态下失败，重新进入 OPEN 状态
      this.circuitBreakerState = CircuitBreakerState.OPEN
      this.circuitBreakerHalfOpenCalls = 0
      this.app.log.warn('Circuit breaker re-entering OPEN state after HALF_OPEN failure')
    } else if (
      this.circuitBreakerState === CircuitBreakerState.CLOSED &&
      this.circuitBreakerFailureCount >= this.config.circuitBreakerFailureThreshold
    ) {
      // 达到失败阈值，进入 OPEN 状态
      this.circuitBreakerState = CircuitBreakerState.OPEN
      this.app.log.error(
        {
          failureCount: this.circuitBreakerFailureCount,
          threshold: this.config.circuitBreakerFailureThreshold,
        },
        'Circuit breaker triggered: entering OPEN state'
      )
    }
  }

  /**
   * 风控检查：IP和设备指纹
   */
  private async checkAntiFraud(
    userId: string,
    ipAddress?: string,
    deviceFingerprint?: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    if (!this.config.enableAntiFraud) {
      return { allowed: true }
    }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // IP 检查
    if (ipAddress) {
      const ipKey = `invite:ip:${ipAddress}:${todayStart.toISOString().split('T')[0]}`
      const ipCount = await this.redis.incr(ipKey)
      await this.redis.expire(ipKey, 86400) // TTL: 1天

      if (ipCount > this.config.maxInvitesPerIP) {
        this.app.log.warn({ ipAddress, count: ipCount }, 'Anti-fraud: IP limit exceeded')
        return {
          allowed: false,
          reason: `Too many invites from this IP address (${ipCount}/${this.config.maxInvitesPerIP})`,
        }
      }
    }

    // 设备指纹检查
    if (deviceFingerprint) {
      const deviceKey = `invite:device:${deviceFingerprint}:${todayStart.toISOString().split('T')[0]}`
      const deviceCount = await this.redis.incr(deviceKey)
      await this.redis.expire(deviceKey, 86400) // TTL: 1天

      if (deviceCount > this.config.maxInvitesPerDevice) {
        this.app.log.warn({ deviceFingerprint, count: deviceCount }, 'Anti-fraud: Device limit exceeded')
        return {
          allowed: false,
          reason: `Too many invites from this device (${deviceCount}/${this.config.maxInvitesPerDevice})`,
        }
      }
    }

    return { allowed: true }
  }

  /**
   * 检查用户领取限制
   */
  private async checkUserLimits(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // 检查总领取次数
    const totalClaimed = await this.prisma.invitation.count({
      where: {
        inviterId: userId,
        rewardPaid: true,
      },
    })

    if (totalClaimed >= this.config.userTotalClaimLimit) {
      return { allowed: false, reason: 'User total claim limit exceeded' }
    }

    // 检查今日领取次数
    const dailyClaimed = await this.prisma.invitation.count({
      where: {
        inviterId: userId,
        rewardPaid: true,
        createdAt: { gte: todayStart },
      },
    })

    if (dailyClaimed >= this.config.userDailyClaimLimit) {
      return { allowed: false, reason: 'User daily claim limit exceeded' }
    }

    return { allowed: true }
  }

  /**
   * 结算邀请奖励（当被邀请人完成首次行为时调用）
   */
  async settleInviteReward(
    inviteeId: string,
    options?: {
      ipAddress?: string
      deviceFingerprint?: string
    }
  ): Promise<{
    success: boolean
    inviterId?: string
    amount?: bigint
    error?: string
  }> {
    try {
      // 检查熔断器
      const circuitCheck = await this.checkCircuitBreaker()
      if (!circuitCheck.allowed) {
        this.recordFailure()
        return { success: false, error: circuitCheck.reason }
      }

      // 如果是半开状态，增加尝试计数
      if (this.circuitBreakerState === CircuitBreakerState.HALF_OPEN) {
        this.circuitBreakerHalfOpenCalls++
      }

      // 查找该用户的邀请关系
      const invitation = await this.prisma.invitation.findFirst({
        where: {
          inviteeId,
          rewardPaid: false,
        },
        include: {
          inviter: true,
          invitee: true,
        },
      })

      // 没有邀请关系或已结算
      if (!invitation) {
        this.recordFailure()
        return { success: false, error: 'No pending invitation found' }
      }

      // 验证邀请关系
      const isValid = await this.validateInvitation(invitation.inviterId, inviteeId)
      if (!isValid) {
        this.recordFailure()
        return { success: false, error: 'Invalid invitation' }
      }

      // 检查预算限制
      const budgetCheck = await this.checkBudgetLimits()
      if (!budgetCheck.allowed) {
        this.app.log.warn(
          { inviterId: invitation.inviterId, inviteeId, reason: budgetCheck.reason },
          'Invite reward blocked by budget limit'
        )
        this.recordFailure()
        return { success: false, error: budgetCheck.reason }
      }

      // 检查用户限制
      const userLimitCheck = await this.checkUserLimits(invitation.inviterId)
      if (!userLimitCheck.allowed) {
        this.app.log.warn(
          { inviterId: invitation.inviterId, reason: userLimitCheck.reason },
          'Invite reward blocked by user limit'
        )
        this.recordFailure()
        return { success: false, error: userLimitCheck.reason }
      }

      // 风控检查
      const fraudCheck = await this.checkAntiFraud(
        invitation.inviterId,
        options?.ipAddress,
        options?.deviceFingerprint
      )
      if (!fraudCheck.allowed) {
        this.app.log.warn(
          { inviterId: invitation.inviterId, inviteeId, reason: fraudCheck.reason },
          'Invite reward blocked by anti-fraud check'
        )
        this.recordFailure()
        return { success: false, error: fraudCheck.reason }
      }

      // 使用事务更新邀请状态并创建通知
      await this.prisma.$transaction(async (tx) => {
        // 标记奖励已发放
        await tx.invitation.update({
          where: { id: invitation.id },
          data: { rewardPaid: true },
        })

        // 创建通知给邀请人
        await tx.notification.create({
          data: {
            userId: invitation.inviterId,
            type: 'INVITE_REWARD',
            title: '🎁 邀请奖励到账',
            content: `恭喜！您邀请的用户 ${invitation.invitee.address.slice(0, 6)}...${invitation.invitee.address.slice(-4)} 已完成首次操作，您获得 $${(Number(this.config.directInviteReward) / 1_000_000).toFixed(2)} USDC 奖励！`,
            data: {
              inviteeId,
              amount: this.config.directInviteReward.toString(),
              inviteeAddress: invitation.invitee.address,
            },
          },
        })

        // 创建通知给被邀请人（新人奖励）
        await tx.notification.create({
          data: {
            userId: inviteeId,
            type: 'NEW_USER_BONUS',
            title: '🎉 新人奖励到账',
            content: `欢迎使用红包 dApp！您获得新人奖励 $${(Number(this.config.newUserBonus) / 1_000_000).toFixed(2)} USDC！`,
            data: {
              amount: this.config.newUserBonus.toString(),
            },
          },
        })
      })

      // 清除相关缓存
      const today = new Date().toISOString().split('T')[0]
      await this.redis.del(`invite:daily_spent:${today}`)

      this.app.log.info(
        {
          inviterId: invitation.inviterId,
          inviteeId,
          amount: this.config.directInviteReward.toString(),
        },
        'Invite reward settled successfully'
      )

      // 发送 Socket.IO 实时通知
      this.app.io.to(`user:${invitation.inviterId}`).emit('notification', {
        type: 'INVITE_REWARD',
        amount: this.config.directInviteReward.toString(),
        inviteeAddress: invitation.invitee.address,
      })

      // 记录成功（用于熔断器）
      this.recordSuccess()

      return {
        success: true,
        inviterId: invitation.inviterId,
        amount: this.config.directInviteReward,
      }
    } catch (error) {
      this.app.log.error({ error, inviteeId }, 'Failed to settle invite reward')
      this.recordFailure()
      return { success: false, error: 'Internal error' }
    }
  }

  /**
   * 获取熔断器状态（用于监控）
   */
  getCircuitBreakerStatus(): {
    state: CircuitBreakerState
    failureCount: number
    lastFailureTime: number | null
    halfOpenCalls: number
  } {
    return {
      state: this.circuitBreakerState,
      failureCount: this.circuitBreakerFailureCount,
      lastFailureTime: this.circuitBreakerLastFailureTime || null,
      halfOpenCalls: this.circuitBreakerHalfOpenCalls,
    }
  }

  /**
   * 获取邀请统计
   */
  async getInviteStats(userId: string): Promise<{
    totalInvites: number
    paidInvites: number
    pendingInvites: number
    totalEarned: bigint
    inviteCode: string
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { inviteCode: true },
    })

    const totalInvites = await this.prisma.invitation.count({
      where: { inviterId: userId },
    })

    const paidInvites = await this.prisma.invitation.count({
      where: { inviterId: userId, rewardPaid: true },
    })

    const pendingInvites = totalInvites - paidInvites

    const totalEarned = BigInt(paidInvites) * this.config.directInviteReward

    return {
      totalInvites,
      paidInvites,
      pendingInvites,
      totalEarned,
      inviteCode: user?.inviteCode || '',
    }
  }

  /**
   * 更新配置（管理员功能）
   */
  updateConfig(newConfig: Partial<InviteRewardConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.app.log.info({ config: this.config }, 'Invite reward config updated')
  }

  /**
   * 获取当前配置
   */
  getConfig(): InviteRewardConfig {
    return { ...this.config }
  }
}
