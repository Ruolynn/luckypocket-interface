import { buildApp } from '../../src/app'

class MockRedis {
  store = new Map<string, string>()
  async set(key: string, val: string, _ex?: any, _ttl?: any, nx?: any) {
    if (nx === 'NX') {
      if (this.store.has(key)) return null
      this.store.set(key, val)
      return 'OK'
    }
    this.store.set(key, val)
    return 'OK'
  }
  async setex(key: string, _ttl: number, val: string) {
    this.store.set(key, val)
    return 'OK'
  }
  async get(key: string) {
    return this.store.get(key) || null
  }
  async del(key: string) {
    const had = this.store.delete(key)
    return had ? 1 : 0
  }
  async zadd(_key: string, _score: number, _member: string) {
    return 1
  }
  async zrevrange(_key: string, _start: number, _stop: number, _with: any) {
    return []
  }
}

describe('Packets routes', () => {
  it('create and claim packet with auth, idempotency, lock', async () => {
    const app = await buildApp({ withJobs: false, withSocket: false })

    // mock redis
    ;(app as any).redis = new MockRedis()

    // mock prisma
    const packetRecord = { id: 'p1', packetId: '0xpacket', expireTime: new Date(Date.now() + 3600_000) }
    const users = new Map<string, any>()
    const claims = new Map<string, any>()
    ;(app as any).prisma = {
      user: {
        upsert: async ({ where: { address } }: any) => {
          const id = users.get(address) || `u_${address}`
          users.set(address, id)
          return { id, address }
        },
        findUnique: async ({ where: { id } }: any) => ({ id }),
      },
      packet: {
        upsert: async () => packetRecord,
        findUnique: async ({ where: { packetId } }: any) => (packetId === packetRecord.packetId ? packetRecord : null),
        updateMany: async () => ({}),
      },
      claim: {
        findUnique: async ({ where: { packetId_userId } }: any) => {
          const key = `${packetId_userId.packetId}:${packetId_userId.userId}`
          return claims.get(key) || null
        },
        create: async ({ data }: any) => {
          const key = `${data.packetId}:${data.userId}`
          claims.set(key, data)
          return data
        },
      },
    }

    // auth: create a token
    const token = app.jwt.sign({ userId: 'u1', address: '0xuser' })

    // create packet
    const idem = crypto.randomUUID()
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/packets/create',
      headers: { authorization: `Bearer ${token}`, 'idempotency-key': idem },
      payload: {
        packetId: '0xpacket',
        txHash: '0xtx',
        token: '0xusdc',
        totalAmount: '100',
        count: 10,
        isRandom: true,
        expireTime: new Date(Date.now() + 3600_000).toISOString(),
      },
    })
    expect(createRes.statusCode).toBe(200)
    expect(createRes.json().packet.packetId).toBe('0xpacket')

    // claim packet
    const claimRes = await app.inject({
      method: 'POST',
      url: '/api/packets/claim',
      headers: { authorization: `Bearer ${token}`, 'idempotency-key': crypto.randomUUID() },
      payload: { packetId: '0xpacket' },
    })
    expect(claimRes.statusCode).toBe(200)
    expect(claimRes.json().claim).toBeDefined()

    await app.close()
  })
})


