import type { FastifyInstance } from 'fastify'
import type { PrismaClient } from '@prisma/client'

// Achievement definitions
export enum AchievementCode {
  // Beginner achievements
  FIRST_PACKET = 'FIRST_PACKET', // 首次发红包
  FIRST_CLAIM = 'FIRST_CLAIM', // 首次抢红包
  THREE_DAY_STREAK = 'THREE_DAY_STREAK', // 连续3天发红包

  // Advanced achievements
  GENEROUS_AMBASSADOR = 'GENEROUS_AMBASSADOR', // 累计发出 $100
  LUCKY_KING = 'LUCKY_KING', // 抢到10次"手气最佳"
  SOCIAL_MASTER = 'SOCIAL_MASTER', // 邀请10人注册

  // Intermediate milestones
  PACKET_10 = 'PACKET_10', // 发送10个红包
  PACKET_50 = 'PACKET_50', // 发送50个红包
  CLAIM_10 = 'CLAIM_10', // 领取10个红包
  CLAIM_50 = 'CLAIM_50', // 领取50个红包
  AMOUNT_50 = 'AMOUNT_50', // 累计发出 $50

  // Time-limited (not fully implemented in MVP, placeholder)
  WEEKEND_WARRIOR = 'WEEKEND_WARRIOR', // 周末发10个红包
  FESTIVAL_KING = 'FESTIVAL_KING', // 节日期间发50个红包
}

export interface Achievement {
  code: AchievementCode
  name: string
  description: string
  icon: string // Emoji or URL
  category: 'beginner' | 'advanced' | 'limited'
  criteria: {
    type: 'count' | 'amount' | 'streak' | 'special'
    target: number
    metric: string // What to count: 'packets_sent', 'claims', 'best_luck', 'invites', etc.
  }
}

const ACHIEVEMENTS: Achievement[] = [
  // Beginner
  {
    code: AchievementCode.FIRST_PACKET,
    name: '新手红包师',
    description: '发出你的第一个红包',
    icon: '🎁',
    category: 'beginner',
    criteria: { type: 'count', target: 1, metric: 'packets_sent' },
  },
  {
    code: AchievementCode.FIRST_CLAIM,
    name: '幸运新星',
    description: '成功领取第一个红包',
    icon: '⭐',
    category: 'beginner',
    criteria: { type: 'count', target: 1, metric: 'claims' },
  },
  {
    code: AchievementCode.THREE_DAY_STREAK,
    name: '红包达人',
    description: '连续3天发红包',
    icon: '🔥',
    category: 'beginner',
    criteria: { type: 'streak', target: 3, metric: 'daily_packets' },
  },

  // Intermediate
  {
    code: AchievementCode.PACKET_10,
    name: '红包好手',
    description: '累计发送10个红包',
    icon: '📮',
    category: 'beginner',
    criteria: { type: 'count', target: 10, metric: 'packets_sent' },
  },
  {
    code: AchievementCode.CLAIM_10,
    name: '手气不错',
    description: '累计领取10个红包',
    icon: '🍀',
    category: 'beginner',
    criteria: { type: 'count', target: 10, metric: 'claims' },
  },
  {
    code: AchievementCode.AMOUNT_50,
    name: '小小慷慨',
    description: '累计发出 $50 USDC',
    icon: '💰',
    category: 'beginner',
    criteria: { type: 'amount', target: 50_000_000, metric: 'total_sent' }, // 6 decimals
  },

  // Advanced
  {
    code: AchievementCode.PACKET_50,
    name: '红包专家',
    description: '累计发送50个红包',
    icon: '🎖️',
    category: 'advanced',
    criteria: { type: 'count', target: 50, metric: 'packets_sent' },
  },
  {
    code: AchievementCode.CLAIM_50,
    name: '幸运满满',
    description: '累计领取50个红包',
    icon: '🎉',
    category: 'advanced',
    criteria: { type: 'count', target: 50, metric: 'claims' },
  },
  {
    code: AchievementCode.GENEROUS_AMBASSADOR,
    name: '慷慨大使',
    description: '累计发出 $100 USDC',
    icon: '💎',
    category: 'advanced',
    criteria: { type: 'amount', target: 100_000_000, metric: 'total_sent' },
  },
  {
    code: AchievementCode.LUCKY_KING,
    name: '手气之王',
    description: '抢到10次手气最佳',
    icon: '👑',
    category: 'advanced',
    criteria: { type: 'count', target: 10, metric: 'best_luck' },
  },
  {
    code: AchievementCode.SOCIAL_MASTER,
    name: '社交达人',
    description: '成功邀请10位好友',
    icon: '🤝',
    category: 'advanced',
    criteria: { type: 'count', target: 10, metric: 'invites' },
  },
]

export class AchievementService {
  private prisma: PrismaClient
  private app: FastifyInstance

  constructor(app: FastifyInstance) {
    this.app = app
    this.prisma = app.prisma
  }

  /**
   * Get achievement definition by code
   */
  getAchievementDef(code: AchievementCode): Achievement | undefined {
    return ACHIEVEMENTS.find((a) => a.code === code)
  }

  /**
   * Get all achievement definitions
   */
  getAllAchievements(): Achievement[] {
    return ACHIEVEMENTS
  }

  /**
   * Check if user has unlocked an achievement
   */
  async hasAchievement(userId: string, code: AchievementCode): Promise<boolean> {
    const achievement = await this.prisma.userAchievement.findUnique({
      where: {
        userId_code: {
          userId,
          code,
        },
      },
    })

    return !!achievement
  }

  /**
   * Unlock an achievement for a user
   */
  async unlockAchievement(
    userId: string,
    code: AchievementCode,
    metadata?: Record<string, any>
  ): Promise<{ unlocked: boolean; achievement?: Achievement }> {
    // Check if already unlocked
    const hasIt = await this.hasAchievement(userId, code)
    if (hasIt) {
      return { unlocked: false }
    }

    const achievementDef = this.getAchievementDef(code)
    if (!achievementDef) {
      this.app.log.warn({ code }, 'Achievement definition not found')
      return { unlocked: false }
    }

    // Unlock the achievement
    await this.prisma.userAchievement.create({
      data: {
        userId,
        code,
        metadata: metadata ? metadata : undefined,
      },
    })

    // Create notification
    await this.prisma.notification.create({
      data: {
        userId,
        type: 'ACHIEVEMENT_UNLOCKED',
        title: `🏆 解锁成就: ${achievementDef.name}`,
        content: achievementDef.description,
        data: {
          code,
          name: achievementDef.name,
          icon: achievementDef.icon,
          metadata,
        },
      },
    })

    // Send real-time notification
    this.app.io.to(`user:${userId}`).emit('achievement', {
      code,
      name: achievementDef.name,
      icon: achievementDef.icon,
      description: achievementDef.description,
    })

    this.app.log.info({ userId, code }, 'Achievement unlocked')

    return { unlocked: true, achievement: achievementDef }
  }

  /**
   * Get user statistics for achievement checking
   */
  async getUserStats(userId: string): Promise<{
    packetsSent: number
    claims: number
    bestLuckCount: number
    totalSent: bigint
    invites: number
    consecutiveDays: number
  }> {
    const [packetsSent, claims, bestLuckCount, packets, invites] = await Promise.all([
      // Total packets sent
      this.prisma.packet.count({ where: { creatorId: userId } }),

      // Total claims
      this.prisma.claim.count({ where: { userId } }),

      // Best luck count
      this.prisma.claim.count({ where: { userId, isBest: true } }),

      // Get packets for total amount calculation
      this.prisma.packet.findMany({
        where: { creatorId: userId },
        select: { totalAmount: true, createdAt: true },
      }),

      // Total invites
      this.prisma.invitation.count({ where: { inviterId: userId } }),
    ])

    // Calculate total sent amount
    const totalSent = packets.reduce((sum, p) => sum + BigInt(p.totalAmount), BigInt(0))

    // Calculate consecutive days (simplified: check last 3 days)
    const consecutiveDays = await this.calculateConsecutiveDays(userId)

    return {
      packetsSent,
      claims,
      bestLuckCount,
      totalSent,
      invites,
      consecutiveDays,
    }
  }

  /**
   * Calculate consecutive days of sending packets
   */
  private async calculateConsecutiveDays(userId: string): Promise<number> {
    const now = new Date()
    const packets = await this.prisma.packet.findMany({
      where: { creatorId: userId },
      select: { createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 100, // Check last 100 packets
    })

    if (packets.length === 0) return 0

    // Group by day
    const daysSent = new Set<string>()
    packets.forEach((p) => {
      const day = p.createdAt.toISOString().split('T')[0]
      daysSent.add(day)
    })

    // Check consecutive days from today backwards
    let streak = 0
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    for (let i = 0; i < 100; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(checkDate.getDate() - i)
      const dayStr = checkDate.toISOString().split('T')[0]

      if (daysSent.has(dayStr)) {
        streak++
      } else {
        break
      }
    }

    return streak
  }

  /**
   * Check and unlock achievements for a user based on their current stats
   */
  async checkAndUnlockAchievements(userId: string): Promise<AchievementCode[]> {
    const stats = await this.getUserStats(userId)
    const unlocked: AchievementCode[] = []

    // Check each achievement
    for (const achievement of ACHIEVEMENTS) {
      const hasIt = await this.hasAchievement(userId, achievement.code)
      if (hasIt) continue // Already has it

      let shouldUnlock = false

      switch (achievement.criteria.metric) {
        case 'packets_sent':
          shouldUnlock = stats.packetsSent >= achievement.criteria.target
          break

        case 'claims':
          shouldUnlock = stats.claims >= achievement.criteria.target
          break

        case 'best_luck':
          shouldUnlock = stats.bestLuckCount >= achievement.criteria.target
          break

        case 'total_sent':
          shouldUnlock = stats.totalSent >= BigInt(achievement.criteria.target)
          break

        case 'invites':
          shouldUnlock = stats.invites >= achievement.criteria.target
          break

        case 'daily_packets':
          shouldUnlock = stats.consecutiveDays >= achievement.criteria.target
          break

        default:
          break
      }

      if (shouldUnlock) {
        const result = await this.unlockAchievement(userId, achievement.code, {
          unlockedAt: new Date().toISOString(),
          stats: {
            packetsSent: stats.packetsSent,
            claims: stats.claims,
            bestLuckCount: stats.bestLuckCount,
            totalSent: stats.totalSent.toString(),
          },
        })

        if (result.unlocked) {
          unlocked.push(achievement.code)
        }
      }
    }

    return unlocked
  }

  /**
   * Get user's achievements with progress
   */
  async getUserAchievements(userId: string): Promise<{
    unlocked: Array<{
      code: string
      name: string
      description: string
      icon: string
      unlockedAt: Date
    }>
    locked: Array<{
      code: string
      name: string
      description: string
      icon: string
      category: string
      progress: number // 0-100 percentage
      current: number
      target: number
    }>
    stats: {
      totalUnlocked: number
      totalAchievements: number
      percentage: number
    }
  }> {
    const [userAchievements, stats] = await Promise.all([
      this.prisma.userAchievement.findMany({
        where: { userId },
        orderBy: { unlockedAt: 'desc' },
      }),
      this.getUserStats(userId),
    ])

    const unlockedCodes = new Set(userAchievements.map((a) => a.code))

    const unlocked = userAchievements.map((ua) => {
      const def = this.getAchievementDef(ua.code as AchievementCode)
      return {
        code: ua.code,
        name: def?.name || ua.code,
        description: def?.description || '',
        icon: def?.icon || '🏆',
        unlockedAt: ua.unlockedAt,
      }
    })

    const locked = ACHIEVEMENTS.filter((a) => !unlockedCodes.has(a.code)).map((a) => {
      let current = 0
      let target = a.criteria.target

      switch (a.criteria.metric) {
        case 'packets_sent':
          current = stats.packetsSent
          break
        case 'claims':
          current = stats.claims
          break
        case 'best_luck':
          current = stats.bestLuckCount
          break
        case 'total_sent':
          current = Number(stats.totalSent)
          break
        case 'invites':
          current = stats.invites
          break
        case 'daily_packets':
          current = stats.consecutiveDays
          break
      }

      const progress = Math.min(100, Math.floor((current / target) * 100))

      return {
        code: a.code,
        name: a.name,
        description: a.description,
        icon: a.icon,
        category: a.category,
        progress,
        current,
        target,
      }
    })

    return {
      unlocked,
      locked,
      stats: {
        totalUnlocked: unlocked.length,
        totalAchievements: ACHIEVEMENTS.length,
        percentage: Math.floor((unlocked.length / ACHIEVEMENTS.length) * 100),
      },
    }
  }
}
