import { describe, expect, it } from 'bun:test'
import { app } from '../src/index'

describe('Hono Server API', () => {
  it('GET /api/health returns status ok', async () => {
    const res = await app.request('/api/health')
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.status).toBe('ok')
    expect(data.timestamp).toBeDefined()
  })

  it('GET /api/users returns users array from Drizzle DB', async () => {
    const res = await app.request('/api/users')
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.users).toBeDefined()
    expect(Array.isArray(data.users)).toBe(true)
  })

  it('POST /api/users creates a new user in Drizzle DB', async () => {
    const testEmail = `test-${Date.now()}@example.com`
    const res = await app.request('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test User', email: testEmail }),
    })
    expect(res.status).toBe(201)

    const data = await res.json()
    expect(data.user).toBeDefined()
    expect(data.user.name).toBe('Test User')
    expect(data.user.email).toBe(testEmail)
  })
})
