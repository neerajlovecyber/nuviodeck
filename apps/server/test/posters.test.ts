import { describe, it, expect } from 'bun:test'
import { Hono } from 'hono'
import { postersRouter } from '../src/routes/posters'
import { posterEngineService } from '../src/services/posters'

const app = new Hono()
app.route('/api/posters', postersRouter)

describe('Multi-Provider Poster Engine (RPDB, TopPosters, XRDB, Posters+, BetterPosters, EasyRatings)', () => {
  it('GET /api/posters/providers lists all 9 supported providers and default options', async () => {
    const res = await app.request('/api/posters/providers')
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(Array.isArray(data.providers)).toBe(true)
    expect(data.providers.length).toBe(9)

    const providerIds = data.providers.map((p: any) => p.id)
    expect(providerIds).toContain('custom')
    expect(providerIds).toContain('betterposters')
    expect(providerIds).toContain('easyrating')
    expect(providerIds).toContain('topposters')
    expect(providerIds).toContain('rpdb')
    expect(providerIds).toContain('omdb')
    expect(providerIds).toContain('fanart')
    expect(providerIds).toContain('xrdb')
    expect(providerIds).toContain('postersplus')

    expect(data.options.showRatingsOnPosters).toBe(true)
    expect(data.options.ratingBadgedEpisodeStills).toBe(true)
  })

  it('resolves RPDB poster correctly when rpdbKey is configured', () => {
    const url = posterEngineService.getPosterUrl(null, {
      imdbId: 'tt0137523',
      tmdbId: 550,
      config: {
        rpdbKey: 't1-testkey',
        providerOrder: ['rpdb'],
      },
    })

    expect(url).toBe('https://api.ratingposterdb.com/t1-testkey/imdb/poster-default/tt0137523.jpg')
  })

  it('resolves TopPosters poster and episode still correctly', () => {
    const posterUrl = posterEngineService.getPosterUrl(null, {
      tmdbId: 1399,
      type: 'series',
      config: {
        toppostersKey: 'tp_key_123',
        providerOrder: ['topposters'],
      },
    })
    expect(posterUrl).toBe('https://api.top-streaming.stream/tp_key_123/tmdb/poster-default/series-1399.jpg')

    const stillUrl = posterEngineService.getEpisodeStillUrl(null, {
      tmdbId: 1399,
      season: 1,
      episode: 5,
      config: {
        toppostersKey: 'tp_key_123',
        ratingBadgedEpisodeStills: true,
      },
    })
    expect(stillUrl).toBe('https://api.top-streaming.stream/tp_key_123/tmdb/thumbnail/series-1399/S1E5.jpg')
  })

  it('resolves XRDB poster and episode still correctly', () => {
    const posterUrl = posterEngineService.getPosterUrl(null, {
      imdbId: 'tt0137523',
      type: 'movie',
      config: {
        xrdbUrl: 'https://xrdb.ibbylabs.dev/demo',
        providerOrder: ['xrdb'],
      },
    })
    expect(posterUrl).toBe('https://xrdb.ibbylabs.dev/demo/poster/movie/tt0137523.jpg')

    const stillUrl = posterEngineService.getEpisodeStillUrl(null, {
      tmdbId: 1399,
      season: 2,
      episode: 3,
      config: {
        xrdbUrl: 'https://xrdb.ibbylabs.dev/demo',
        ratingBadgedEpisodeStills: true,
      },
    })
    expect(stillUrl).toBe('https://xrdb.ibbylabs.dev/demo/still/1399/2/3.jpg')
  })

  it('resolves Posters+ poster and episode still correctly', () => {
    const posterUrl = posterEngineService.getPosterUrl(null, {
      imdbId: 'tt0137523',
      type: 'movie',
      config: {
        postersplusUrl: 'https://postersplus.example.com',
        providerOrder: ['postersplus'],
      },
    })
    expect(posterUrl).toBe('https://postersplus.example.com/poster/movie/tt0137523.jpg')

    const stillUrl = posterEngineService.getEpisodeStillUrl(null, {
      tmdbId: 1399,
      season: 1,
      episode: 1,
      config: {
        postersplusUrl: 'https://postersplus.example.com',
        ratingBadgedEpisodeStills: true,
      },
    })
    expect(stillUrl).toBe('https://postersplus.example.com/still/1399/1/1.jpg')
  })

  it('respects showRatingsOnPosters: false by falling back to plain TMDB image', () => {
    const url = posterEngineService.getPosterUrl('/sample_path.jpg', {
      imdbId: 'tt0137523',
      config: {
        rpdbKey: 'testkey',
        showRatingsOnPosters: false,
      },
    })

    expect(url).toContain('image.tmdb.org/t/p/w500/sample_path.jpg')
  })

  it('POST /api/posters/verify rejects empty key or url', async () => {
    const res = await app.request('/api/posters/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'rpdb', keyOrUrl: '' }),
    })
    expect(res.status).toBe(400)
  })

  it('POST /api/posters/resolve returns dynamic poster and still URLs', async () => {
    const res = await app.request('/api/posters/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tmdbId: 1399,
        imdbId: 'tt0944947',
        type: 'series',
        season: 1,
        episode: 1,
        config: {
          toppostersKey: 'tp_key_123',
          showRatingsOnPosters: true,
          ratingBadgedEpisodeStills: true,
        },
      }),
    })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.posterUrl).toContain('top-streaming.stream')
    expect(data.stillUrl).toContain('top-streaming.stream')
  })

  it('strictly respects user drag-and-drop providerOrder when multiple providers are configured', () => {
    const multiConfig = {
      toppostersKey: 'tp_key_123',
      rpdbKey: 'rp_key_456',
      xrdbUrl: 'https://xrdb.test',
      showRatingsOnPosters: true,
      ratingBadgedEpisodeStills: true,
    }

    // 1. User drags RPDB to the top
    const rpdbFirst = posterEngineService.getPosterUrl(null, {
      imdbId: 'tt0137523',
      tmdbId: 550,
      type: 'movie',
      config: {
        ...multiConfig,
        providerOrder: ['rpdb', 'topposters', 'xrdb'],
      },
    })
    expect(rpdbFirst).toContain('ratingposterdb.com')

    // 2. User drags TopPosters above RPDB
    const topPostersFirst = posterEngineService.getPosterUrl(null, {
      imdbId: 'tt0137523',
      tmdbId: 550,
      type: 'movie',
      config: {
        ...multiConfig,
        providerOrder: ['topposters', 'rpdb', 'xrdb'],
      },
    })
    expect(topPostersFirst).toContain('top-streaming.stream')

    // 3. User drags XRDB to the top
    const xrdbFirst = posterEngineService.getPosterUrl(null, {
      imdbId: 'tt0137523',
      tmdbId: 550,
      type: 'movie',
      config: {
        ...multiConfig,
        providerOrder: ['xrdb', 'topposters', 'rpdb'],
      },
    })
    expect(xrdbFirst).toContain('xrdb.test')

    // 4. Episode stills also strictly obey user drag-and-drop order
    const epStillXrdb = posterEngineService.getEpisodeStillUrl(null, {
      tmdbId: 1399,
      season: 1,
      episode: 1,
      config: {
        ...multiConfig,
        providerOrder: ['xrdb', 'topposters'],
      },
    })
    expect(epStillXrdb).toContain('xrdb.test/still/1399/1/1.jpg')

    const epStillTopPosters = posterEngineService.getEpisodeStillUrl(null, {
      tmdbId: 1399,
      season: 1,
      episode: 1,
      config: {
        ...multiConfig,
        providerOrder: ['topposters', 'xrdb'],
      },
    })
    expect(epStillTopPosters).toContain('top-streaming.stream/tp_key_123/tmdb/thumbnail/series-1399/S1E1.jpg')
  })

  it('skips disabled cards and resolves to the next provider in the user-defined order', () => {
    const cardConfig = {
      providerOrder: ['topposters', 'rpdb', 'xrdb'],
      providers: {
        topposters: { enabled: false, key: 'tp_disabled_key' },
        rpdb: { enabled: true, key: 'rp_active_key' },
        xrdb: { enabled: true, url: 'https://xrdb.test' },
      },
      showRatingsOnPosters: true,
    }

    const resolved = posterEngineService.getPosterUrl(null, {
      imdbId: 'tt0137523',
      tmdbId: 550,
      type: 'movie',
      config: cardConfig,
    })

    // Should skip disabled topposters card and resolve to rpdb
    expect(resolved).toContain('ratingposterdb.com/rp_active_key')
  })

  it('correctly resolves real live fixture configuration from sample-poster-config.json', async () => {
    const fixture = await import('./fixtures/sample-poster-config.json')
    const cfg = fixture.sampleProfileConfig

    // Test with TopPosters as #1
    const resTop = posterEngineService.getPosterUrl(null, {
      imdbId: 'tt0137523',
      tmdbId: 550,
      type: 'movie',
      config: cfg,
    })
    expect(resTop).toBe('https://api.top-streaming.stream/TP-txrM3ckKjDNEKviNF4628FZBPZBXm1AA/tmdb/poster-default/550.jpg')

    // Drag EasyRatings to #1
    const resEasy = posterEngineService.getPosterUrl(null, {
      imdbId: 'tt0137523',
      tmdbId: 550,
      type: 'movie',
      config: {
        ...cfg,
        providerOrder: ['easyrating', 'topposters'],
      },
    })
    expect(resEasy).toBe('https://easyratingsdb.com/Tk-8c2499b5d3798025c236379a618ca6231be3d20837b5badd/poster/tt0137523.jpg')

    // Drag BetterPosters to #1
    const resBtttr = posterEngineService.getPosterUrl(null, {
      imdbId: 'tt0137523',
      tmdbId: 550,
      type: 'movie',
      config: {
        ...cfg,
        providerOrder: ['betterposters'],
      },
    })
    expect(resBtttr).toBe('https://btttr.cc/poster-q/imdb/poster-default/tt0137523.jpg')

    // Drag Custom (Pictorium) to #1
    const resCustom = posterEngineService.getPosterUrl(null, {
      imdbId: 'tt0137523',
      tmdbId: 550,
      type: 'movie',
      config: {
        ...cfg,
        providerOrder: ['custom'],
      },
    })
    expect(resCustom).toBe('https://pictorium-nsp.vercel.app/api/poster/movie/tt0137523')
  })
})
