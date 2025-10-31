// @ts-nocheck
import { buildApp } from '../../src/app'

class MockRedisLB {
  async zrevrange(_key: string, _start: number, _stop: number, _with: any) {
    return ['user1', '100', 'user2', '50']
  }
}

describe('Leaderboard endpoint', () => {
  it('GET /api/leaderboard returns top list', async () => {
    const app = await buildApp({ withJobs: false, withSocket: false })
    ;(app as any).redis = new MockRedisLB() as any

    const res = await app.inject({ method: 'GET', url: '/api/leaderboard?type=luck&range=week' })
    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.json().top)).toBe(true)
    await app.close()
  })
})


