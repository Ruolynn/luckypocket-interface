import { buildApp } from '../../src/app'

describe('Health endpoint', () => {
  it('GET /health should return ok', async () => {
    const app = await buildApp({ withJobs: false, withSocket: false })
    const res = await app.inject({ method: 'GET', url: '/health' })
    expect(res.statusCode).toBe(200)
    expect(res.json().status).toBe('ok')
    await app.close()
  })
})


