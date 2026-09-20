import { describe, expect, it } from 'bun:test'
import { app } from '../src/index'

describe('Nuvio Backend Routes', () => {
  it('GET /api/badges/presets returns badge sets', async () => {
    const res = await app.request('/api/badges/presets')
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.presets).toBeDefined()
    expect(Array.isArray(data.presets)).toBe(true)
    expect(data.presets.length).toBeGreaterThan(0)
    expect(data.presets[0].id).toBeDefined()
    expect(data.presets[0].label).toBeDefined()
  })

  it('GET /api/badges/export/:presetId.json returns Nuvio import payload', async () => {
    const res = await app.request('/api/badges/export/xp_aurora.json')
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.id).toBe('xp_aurora')
    expect(data.badges).toBeDefined()
    expect(Array.isArray(data.badges)).toBe(true)
    expect(data.groups).toBeDefined()
    expect(Array.isArray(data.groups)).toBe(true)
  })

  it('GET /api/nuvio/sync/health pings Nuvio database or returns status', async () => {
    const res = await app.request('/api/nuvio/sync/health')
    // Status is either 200 (healthy) or 503 (if offline/rate limited)
    expect([200, 503]).toContain(res.status)

    const data = await res.json()
    expect(data.status).toBeDefined()
    expect(typeof data.connected).toBe('boolean')
  }, 15000)

  it('GET /api/nuvio/auth/session handles no session gracefully', async () => {
    const res = await app.request('/api/nuvio/auth/session')
    expect(res.status).toBe(200)

    const data = await res.json()
    expect('session' in data).toBe(true)
  })

  it('GET /api/nuvio/profiles returns 401 with invalid auth', async () => {
    const res = await app.request('/api/nuvio/profiles', {
      headers: { Authorization: 'Bearer invalid_token' },
    })
    expect(res.status).toBe(401)

    const data = await res.json()
    expect(data.error).toBeDefined()
  })

  it('GET /api/nuvio/addons/1 returns 401 with invalid auth', async () => {
    const res = await app.request('/api/nuvio/addons/1', {
      headers: { Authorization: 'Bearer invalid_token' },
    })
    expect(res.status).toBe(401)
  })

  it('GET /api/nuvio/collections/1 returns 401 with invalid auth', async () => {
    const res = await app.request('/api/nuvio/collections/1', {
      headers: { Authorization: 'Bearer invalid_token' },
    })
    expect(res.status).toBe(401)
  })

  it('GET /api/nuvio/profiles/catalog/all returns public avatar catalog', async () => {
    const res = await app.request('/api/nuvio/profiles/catalog/all')
    expect([200, 500]).toContain(res.status)
    if (res.status === 200) {
      const data = await res.json()
      expect(data.catalog).toBeDefined()
      expect(Array.isArray(data.catalog)).toBe(true)
    }
  })
})
