import { buildApp } from '../../src/app'
import { describe, it, expect, beforeEach } from 'vitest'

// 内存存储模拟
const state = {
  users: new Map<string, any>(), // address -> user
  usersByFid: new Map<number, any>(),
  packets: new Map<string, any>(), // packetId -> packet
  claims: [] as any[],
  now: () => new Date('2099-01-01T00:00:00.000Z'),
}

function makeRedisMock() {
  const store = new Map<string, any>()
  return {
    async set(key: string, val: string, mode: string, ttl: number, nx: string) {
      if (nx === 'NX' && store.has(key)) return null
      store.set(key, { val, exp: Date.now() + ttl * 1000 })
      return 'OK'
    },
    async del(key: string) {
      store.delete(key)
      return 1
    },
    async get(key: string) {
      const v = store.get(key)
      if (!v) return null
      if (Date.now() > v.exp) {
        store.delete(key)
        return null
      }
      return v.val
    },
    async setex(key: string, ttl: number, val: string) {
      store.set(key, { val, exp: Date.now() + ttl * 1000 })
      return 'OK'
    },
  }
}

function makePrismaMock() {
  return {
    user: {
      async findUnique({ where }: any) {
        if (where.address) return state.users.get(where.address) || null
        if (where.id) {
          for (const u of state.users.values()) if (u.id === where.id) return u
          return null
        }
        return null
      },
      async findFirst({ where }: any) {
        if (where.farcasterFid != null) return state.usersByFid.get(where.farcasterFid) || null
        return null
      },
      async create({ data }: any) {
        const u = { id: `user_${state.users.size + 1}`, ...data }
        state.users.set(u.address, u)
        if (u.farcasterFid != null) state.usersByFid.set(u.farcasterFid, u)
        return u
      },
    },
    packet: {
      async findUnique({ where: { packetId } }: any) {
        return state.packets.get(packetId) || null
      },
      async update({ where: { id }, data }: any) {
        for (const [pid, p] of state.packets) {
          if (p.id === id) {
            const updated = { ...p, ...data }
            state.packets.set(pid, updated)
            return updated
          }
        }
        throw new Error('packet not found')
      },
    },
    claim: {
      async findUnique({ where: { packetId_userId } }: any) {
        return state.claims.find((c) => c.packetId === packetId_userId.packetId && c.userId === packetId_userId.userId) || null
      },
      async create({ data }: any) {
        const c = { id: `claim_${state.claims.length + 1}`, ...data }
        state.claims.push(c)
        return c
      },
    },
    $transaction: async (fn: any) => fn(makePrismaMock()),
  }
}

describe('Frame Claim Integration', () => {
  beforeEach(() => {
    state.users.clear()
    state.usersByFid.clear()
    state.packets.clear()
    state.claims = []
  })

  it('should claim successfully with fid fallback user (CLAIMED)', async () => {
    const app = await buildApp({ withJobs: false, withSocket: false })

    // mock redis and prisma
    ;(app as any).redis = makeRedisMock()
    ;(app as any).prisma = makePrismaMock()

    // seed user by fid (fallback path)
    const address = '0x1111111111111111111111111111111111111111'
    const user = await (app as any).prisma.user.create({ data: { address: address.toLowerCase(), farcasterFid: 10001 } })

    // seed packet
    const packetId = '0xpacket1'
    const packet = {
      id: 'p1',
      packetId,
      expireTime: state.now(),
      remainingAmount: String(1_000_000n),
      remainingCount: 2,
    }
    state.packets.set(packetId, packet)

    const res = await app.inject({
      method: 'POST',
      url: '/api/frame/claim',
      payload: { packetId, fid: 10001 },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.ok).toBe(true)
    expect(body.status).toBe('CLAIMED')
    expect(body.data.amount).toBe(String(1_000_000n / 2n))

    await app.close()
  })

  it('should return ALREADY_CLAIMED for duplicate user claim', async () => {
    const app = await buildApp({ withJobs: false, withSocket: false })
    ;(app as any).redis = makeRedisMock()
    ;(app as any).prisma = makePrismaMock()

    const address = '0x1111111111111111111111111111111111111111'
    const user = await (app as any).prisma.user.create({ data: { address: address.toLowerCase(), farcasterFid: 10002 } })

    const packetId = '0xpacket2'
    const packet = {
      id: 'p2',
      packetId,
      expireTime: state.now(),
      remainingAmount: String(2_000_000n),
      remainingCount: 2,
    }
    state.packets.set(packetId, packet)

    // first claim
    await app.inject({ method: 'POST', url: '/api/frame/claim', payload: { packetId, fid: 10002 } })
    // duplicate claim
    const res2 = await app.inject({ method: 'POST', url: '/api/frame/claim', payload: { packetId, fid: 10002 } })

    expect(res2.statusCode).toBe(200)
    const body2 = res2.json()
    expect(body2.status).toBe('ALREADY_CLAIMED')

    await app.close()
  })

  it('should validate body and return 400 on invalid input', async () => {
    const app = await buildApp({ withJobs: false, withSocket: false })
    ;(app as any).redis = makeRedisMock()
    ;(app as any).prisma = makePrismaMock()

    const res = await app.inject({ method: 'POST', url: '/api/frame/claim', payload: { fid: -1 } })
    expect(res.statusCode).toBe(400)

    await app.close()
  })
})
