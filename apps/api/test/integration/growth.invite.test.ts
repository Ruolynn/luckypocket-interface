// @ts-nocheck
import { buildApp } from '../../src/app'

describe('Growth invite endpoints', () => {
  it('accept and stats', async () => {
    const app = await buildApp({ withJobs: false, withSocket: false })

    // mock prisma
    const users = new Map<string, any>([["code123", { id: 'inviter', inviteCode: 'code123' }]])
    const invitations: any[] = []
    ;(app as any).prisma = {
      user: {
        findUnique: async ({ where: { inviteCode } }: any) => users.get(inviteCode) || null,
      },
      invitation: {
        upsert: async ({ where, create }: any) => {
          const exists = invitations.find((x) => x.inviterId === where.inviterId_inviteeId.inviterId && x.inviteeId === where.inviterId_inviteeId.inviteeId)
          if (!exists) invitations.push(create)
          return create
        },
        count: async ({ where: { inviterId } }: any) => invitations.filter((x) => x.inviterId === inviterId).length,
      },
    }

    const token = (app as any).jwt.sign({ userId: 'invitee', address: '0xaddr' })

    const res1 = await app.inject({
      method: 'POST',
      url: '/api/invite/accept',
      headers: { authorization: `Bearer ${token}` },
      payload: { inviterCode: 'code123' },
    })
    expect(res1.statusCode).toBe(200)

    const res2 = await app.inject({
      method: 'GET',
      url: '/api/invite/stats',
      headers: { authorization: `Bearer ${token}` },
    })
    expect(res2.statusCode).toBe(200)
    expect(res2.json().total).toBeDefined()

    await app.close()
  })
})


