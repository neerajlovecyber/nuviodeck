import { describe, it, expect } from 'bun:test'
import { StreamProxyService } from '../src/services/streams/proxy'
import { idResolverService } from '../src/services/metadata/id-resolver'
import { debridService } from '../src/services/debrid'
import { app } from '../src/index'

describe('Extracted Server-Side Engines (Proxy, ID Resolver, Debrid Health, Scrobbler)', () => {
  describe('1. Stream Proxy Engine (MediaFlow & StremThru)', () => {
    it('rewrites stream URLs through MediaFlow with api_password and destination_url', async () => {
      const originalStreams = [
        {
          name: '4K Stream',
          title: 'Movie 2024',
          url: 'https://debrid.com/download/file123.mkv',
        },
      ]

      const proxied = await StreamProxyService.proxyStreams(originalStreams, {
        enabled: true,
        id: 'mediaflow',
        url: 'https://my-mediaflow-proxy.com',
        apiPassword: 'secretpassword123',
      })

      expect(proxied.length).toBe(1)
      expect(proxied[0].url).toContain('https://my-mediaflow-proxy.com/proxy/stream')
      expect(proxied[0].url).toContain('destination_url=https%3A%2F%2Fdebrid.com%2Fdownload%2Ffile123.mkv')
      expect(proxied[0].url).toContain('api_password=secretpassword123')
      expect(proxied[0].behaviorHints?.proxyHeaders?.['User-Agent']).toBe('NuvioDeck/1.0')
    })

    it('rewrites stream URLs through StremThru with token authentication', async () => {
      const originalStreams = [
        {
          name: '1080p Stream',
          url: 'https://torrent.storage/video.mp4',
        },
      ]

      const proxied = await StreamProxyService.proxyStreams(originalStreams, {
        enabled: true,
        id: 'stremthru',
        url: 'https://stremthru.myhost.com',
        apiPassword: 'stremthru_token_abc',
      })

      expect(proxied.length).toBe(1)
      expect(proxied[0].url).toContain('https://stremthru.myhost.com/v1/proxy')
      expect(proxied[0].url).toContain('token=stremthru_token_abc')
    })

    it('bypasses proxying cleanly when proxy is disabled', async () => {
      const originalStreams = [
        {
          name: 'Direct Stream',
          url: 'https://direct-cdn.com/stream.mp4',
        },
      ]

      const untouched = await StreamProxyService.proxyStreams(originalStreams, {
        enabled: false,
        id: 'mediaflow',
        url: 'https://proxy.com',
      })

      expect(untouched[0].url).toBe('https://direct-cdn.com/stream.mp4')
    })
  })

  describe('2. Cross-Platform ID Resolver (IMDb, TMDB, Kitsu)', () => {
    it('resolves IMDb and TMDB movie formats with canonical mapping', async () => {
      const imdbResult = await idResolverService.resolve('tt0137523')
      expect(imdbResult.imdbId).toBe('tt0137523')

      const tmdbResult = await idResolverService.resolve('tmdb:550')
      expect(tmdbResult.tmdbId).toBe(550)
    })

    it('resolves TV episode string (tt0903747:1:1) to series with season 1 episode 1', async () => {
      const result = await idResolverService.resolve('tt0903747:1:1')
      expect(result.imdbId).toBe('tt0903747')
      expect(result.season).toBe(1)
      expect(result.episode).toBe(1)
      expect(result.type).toBe('series')
    })

    it('resolves Kitsu Anime format (kitsu:1234:2) to anime with episode 2', async () => {
      const result = await idResolverService.resolve('kitsu:1234:2')
      expect(result.kitsuId).toBe(1234)
      expect(result.episode).toBe(2)
      expect(result.type).toBe('anime')
    })
  })

  describe('3. Debrid Account Health & Latency Monitor', () => {
    it('serves GET /api/debrid/providers with all 7 supported debrid services', async () => {
      const res = await app.request('/api/debrid/providers')
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.providers.length).toBe(7)
      const providerIds = data.providers.map((p: any) => p.id)
      expect(providerIds).toContain('realdebrid')
      expect(providerIds).toContain('torbox')
      expect(providerIds).toContain('alldebrid')
      expect(providerIds).toContain('premiumize')
      expect(providerIds).toContain('debridlink')
      expect(providerIds).toContain('offcloud')
      expect(providerIds).toContain('easydebrid')
    })

    it('POST /api/debrid/health reports health and latency across multiple debrid keys', async () => {
      const res = await app.request('/api/debrid/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keys: {
            torbox: 'dummy_test_token',
            realdebrid: 'dummy_rd_token',
          },
        }),
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.report).toBeDefined()
      expect(data.report.torbox).toBeDefined()
      expect(typeof data.report.torbox.latencyMs).toBe('number')
    })
  })

  describe('4. Stremio Playback Scrobbler Endpoint', () => {
    it('POST /api/progress/scrobble records playback progress and marks completed at >= 80%', async () => {
      const res = await app.request('/api/progress/scrobble', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: 'deck_profile_default',
          id: 'tt0137523',
          type: 'movie',
          progress: 85,
          time: 5100,
          duration: 6000,
          title: 'Fight Club',
        }),
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.session.status).toBe('completed')
    })
  })
})
