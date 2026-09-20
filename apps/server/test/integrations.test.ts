import { describe, it, expect } from 'bun:test'
import { Hono } from 'hono'
import { integrationsRouter } from '../src/routes/integrations'
import { db } from '../src/db'
import { accountConnections } from '../src/db/schema'
import { eq } from 'drizzle-orm'

const app = new Hono()
app.route('/api/integrations', integrationsRouter)

describe('User Account Integrations Backend (TMDB, Trakt, Simkl, AniList, MAL)', () => {
  it('GET /api/integrations/status returns status for all 5 providers', async () => {
    const res = await app.request('/api/integrations/status')
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.status).toBe('ok')
    expect(data.integrations).toHaveProperty('tmdb')
    expect(data.integrations).toHaveProperty('trakt')
    expect(data.integrations).toHaveProperty('simkl')
    expect(data.integrations).toHaveProperty('anilist')
    expect(data.integrations).toHaveProperty('myanimelist')
    expect(typeof data.integrations.tmdb.connected).toBe('boolean')
    expect(typeof data.integrations.trakt.connected).toBe('boolean')
  })

  it('TMDB: rejects empty request token for session creation', async () => {
    const res = await app.request('/api/integrations/tmdb/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('requestToken is required')
  })

  it('TMDB: lists endpoint rejects unauthenticated requests', async () => {
    // Ensure TMDB is disconnected for test
    await db.delete(accountConnections).where(eq(accountConnections.id, 'tmdb'))

    const res = await app.request('/api/integrations/tmdb/lists')
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toContain('TMDB account is not connected')
  })

  it('Trakt: rejects empty device code for token exchange', async () => {
    const res = await app.request('/api/integrations/trakt/device/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('deviceCode is required')
  })

  it('Trakt: lists endpoint rejects unauthenticated requests', async () => {
    await db.delete(accountConnections).where(eq(accountConnections.id, 'trakt'))

    const res = await app.request('/api/integrations/trakt/lists')
    expect(res.status).toBe(401)
  })

  it('Trakt Scrobbler: gracefully handles or skips when not connected', async () => {
    await db.delete(accountConnections).where(eq(accountConnections.id, 'trakt'))

    const startRes = await app.request('/api/integrations/trakt/scrobble/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ movie: { ids: { tmdb: 550 } }, progress: 10 }),
    })
    expect(startRes.status).toBe(200)
    const startData = await startRes.json()
    expect(startData.skipped).toBe(true)

    const stopRes = await app.request('/api/integrations/trakt/scrobble/stop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ movie: { ids: { tmdb: 550 } }, progress: 95 }),
    })
    expect(stopRes.status).toBe(200)
    const stopData = await stopRes.json()
    expect(stopData.skipped).toBe(true)
  })

  it('Simkl: lists endpoint rejects when disconnected', async () => {
    await db.delete(accountConnections).where(eq(accountConnections.id, 'simkl'))

    const res = await app.request('/api/integrations/simkl/lists')
    expect(res.status).toBe(401)
  })

  it('AniList: rejects empty token', async () => {
    const res = await app.request('/api/integrations/anilist/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
  })

  it('AniList: lists endpoint rejects when disconnected', async () => {
    await db.delete(accountConnections).where(eq(accountConnections.id, 'anilist'))

    const res = await app.request('/api/integrations/anilist/lists')
    expect(res.status).toBe(401)
  })

  it('MyAnimeList: rejects empty token', async () => {
    const res = await app.request('/api/integrations/myanimelist/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
  })

  it('MyAnimeList: lists endpoint rejects when disconnected', async () => {
    await db.delete(accountConnections).where(eq(accountConnections.id, 'myanimelist'))

    const res = await app.request('/api/integrations/myanimelist/lists')
    expect(res.status).toBe(401)
  })

  it('Mock Connection Flow & Status Verification', async () => {
    // Insert a mock Trakt connection
    const now = new Date().toISOString()
    await db
      .insert(accountConnections)
      .values({
        id: 'trakt',
        provider: 'trakt',
        username: 'Neerajlovecyber',
        displayName: 'Neeraj',
        avatarUrl: 'https://trakt.tv/assets/avatar.png',
        accessToken: 'mock_trakt_token_123',
        scrobbleEnabled: true,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: accountConnections.id,
        set: {
          username: 'Neerajlovecyber',
          accessToken: 'mock_trakt_token_123',
          scrobbleEnabled: true,
          updatedAt: now,
        },
      })

    const statusRes = await app.request('/api/integrations/status')
    expect(statusRes.status).toBe(200)
    const statusData = await statusRes.json()
    expect(statusData.integrations.trakt.connected).toBe(true)
    expect(statusData.integrations.trakt.username).toBe('Neerajlovecyber')
    expect(statusData.integrations.trakt.scrobbleEnabled).toBe(true)

    // Toggle scrobble
    const patchRes = await app.request('/api/integrations/trakt/scrobble', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: false }),
    })
    expect(patchRes.status).toBe(200)
    const patchData = await patchRes.json()
    expect(patchData.scrobbleEnabled).toBe(false)

    // Disconnect
    const delRes = await app.request('/api/integrations/trakt/disconnect', {
      method: 'DELETE',
    })
    expect(delRes.status).toBe(200)

    const finalStatusRes = await app.request('/api/integrations/status')
    const finalStatusData = await finalStatusRes.json()
    expect(finalStatusData.integrations.trakt.connected).toBe(false)
  })
})
