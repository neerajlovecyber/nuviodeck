import { describe, expect, it } from 'bun:test'
import { app } from '../src/index'

describe('Modular Architecture & Domain Routers', () => {
  it('GET /api/health returns domain directory', async () => {
    const res = await app.request('/api/health')
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.domains).toBeDefined()
    expect(data.domains.nuvio).toBe('/api/nuvio')
    expect(data.domains.badges).toBe('/api/badges')
    expect(data.domains.metadata).toBe('/api/metadata')
    expect(data.domains.catalogs).toBe('/api/catalogs')
    expect(data.domains.debrid).toBe('/api/debrid')
    expect(data.domains.posters).toBe('/api/posters')
  })

  it('GET /api/metadata/status returns metadata providers', async () => {
    const res = await app.request('/api/metadata/status')
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.status).toBe('ok')
    expect(data.providers.tmdb).toBeDefined()
    expect(data.providers.imdb).toBeDefined()
    expect(data.providers.trakt).toBeDefined()
  })

  it('GET /api/catalogs/manifest.json returns valid streaming manifest', async () => {
    const res = await app.request('/api/catalogs/manifest.json')
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.id).toBe('org.nuviodeck.deck')
    expect(data.catalogs).toBeDefined()
    expect(Array.isArray(data.catalogs)).toBe(true)
  })

  it('GET /api/debrid/providers returns supported debrid services', async () => {
    const res = await app.request('/api/debrid/providers')
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(Array.isArray(data.providers)).toBe(true)
    const ids = data.providers.map((p: any) => p.id)
    expect(ids).toContain('realdebrid')
    expect(ids).toContain('torbox')
  })

  it('GET /api/posters/status returns poster art engine status', async () => {
    const res = await app.request('/api/posters/status')
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.status).toBe('ok')
    expect(Array.isArray(data.features)).toBe(true)
  })
})
