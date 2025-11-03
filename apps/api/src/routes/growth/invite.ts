import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

const plugin: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', app.authenticate as any)

  // 接受邀请
  app.post('/api/invite/accept', async (req: any, reply) => {
    const { inviterCode } = z.object({ inviterCode: z.string() }).parse(req.body)
    const inviter = await app.prisma.user.findUnique({ where: { inviteCode: inviterCode } })

    if (!inviter || inviter.id === req.user.userId) {
      return reply.code(400).send({ error: 'INVALID_INVITER_CODE' })
    }

    // 创建邀请关系
    await app.prisma.invitation.upsert({
      where: { inviterId_inviteeId: { inviterId: inviter.id, inviteeId: req.user.userId } } as any,
      update: {},
      create: { inviterId: inviter.id, inviteeId: req.user.userId },
    })

    // 检查是否已完成首次行为，如果是则立即结算
    const hasCompleted = await app.inviteService.hasUserCompletedFirstAction(req.user.userId)
    if (hasCompleted) {
      await app.inviteService.settleInviteReward(req.user.userId)
    }

    // 检查邀请人的成就（异步，不阻塞响应）
    app.achievementService.checkAndUnlockAchievements(inviter.id).catch((err) => {
      app.log.error({ error: err, userId: inviter.id }, 'Failed to check achievements after invite')
    })

    return { success: true }
  })

  // 获取邀请统计
  app.get('/api/invite/stats', async (req: any) => {
    const userId = req.user.userId
    const stats = await app.inviteService.getInviteStats(userId)

    return {
      totalInvites: stats.totalInvites,
      paidInvites: stats.paidInvites,
      pendingInvites: stats.pendingInvites,
      totalEarned: stats.totalEarned.toString(),
      inviteCode: stats.inviteCode,
      rewardAmount: '2.00', // $2 USDC
    }
  })

  // 获取邀请列表详情
  app.get('/api/invite/list', async (req: any) => {
    const userId = req.user.userId

    const invitations = await app.prisma.invitation.findMany({
      where: { inviterId: userId },
      include: {
        invitee: {
          select: {
            address: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return {
      invitations: invitations.map((inv) => ({
        id: inv.id,
        inviteeAddress: inv.invitee.address,
        rewardPaid: inv.rewardPaid,
        createdAt: inv.createdAt,
      })),
    }
  })
}

export default plugin


