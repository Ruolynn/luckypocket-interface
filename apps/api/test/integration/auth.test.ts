import { buildApp } from '../../src/app'

describe('Auth SIWE', () => {
  it('GET /api/auth/siwe/nonce should return nonce', async () => {
    const app = await buildApp({ withJobs: false, withSocket: false })
    const res = await app.inject({ method: 'GET', url: '/api/auth/siwe/nonce' })
    expect(res.statusCode).toBe(200)
    expect(res.json().nonce).toBeDefined()
    await app.close()
  })
})


