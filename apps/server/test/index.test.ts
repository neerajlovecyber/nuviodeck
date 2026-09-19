import { describe, expect, it } from 'vitest'
import { app } from '../src/index'

describe('Hono Server API', () => {
  it('GET /api/health returns status ok', async () => {
    const res = await app.request('/api/health')
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.status).toBe('ok')
    expect(data.timestamp).toBeDefined()
  })

  it('GET /api/hello returns message', async () => {
    const res = await app.request('/api/hello')
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.message).toBe('Hello from Hono on Bun!')
  })
})
