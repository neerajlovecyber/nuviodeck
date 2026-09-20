import { describe, expect, it } from 'bun:test'
import { app } from '../src/index'
import { TmdbService } from '../src/services/tmdb'
import { getCustomEpisodeGroup, getCustomImdbId } from '../src/services/episode-groups'
import { CatalogResolver } from '../src/services/catalog-resolver'
import { getMovieReleaseDates, isMovieReleasedDigitally } from '../src/services/release-filter'

describe('TMDB Addon Extracted Services & Functionality', () => {
  const tmdb = new TmdbService()
  const resolver = new CatalogResolver()

  describe('Episode Groups & ID Remapping (differentOrder / differentImdbId)', () => {
    it('correctly maps TV shows with custom episode group ordering (e.g. One Piece, Money Heist)', () => {
      const onePieceGroup = getCustomEpisodeGroup(37854)
      expect(onePieceGroup).toBeDefined()
      expect(onePieceGroup?.name).toBe('One Piece')
      expect(onePieceGroup?.episodeGroupId).toBe('62f98314175051007c594bdf')

      const moneyHeistGroup = getCustomEpisodeGroup(71446)
      expect(moneyHeistGroup).toBeDefined()
      expect(moneyHeistGroup?.name).toBe('Money Heist')
    })

    it('correctly overrides mismatched IMDb IDs (differentImdbId.json)', () => {
      const dbzImdb = getCustomImdbId(12971)
      expect(dbzImdb).toBe('tt0214341')

      const dbImdb = getCustomImdbId(12609)
      expect(dbImdb).toBe('tt0280249')
    })

    it('returns undefined for standard unmapped shows', () => {
      expect(getCustomEpisodeGroup(99999999)).toBeUndefined()
      expect(getCustomImdbId(99999999)).toBeUndefined()
    })
  })

  describe('TMDB Stremio Meta Formatting', () => {
    it('formats movie meta preview with poster, rating, and ID correctly', () => {
      const rawMovie = {
        id: 550,
        title: 'Fight Club',
        poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
        backdrop_path: '/hZkgoQYus5vegHoetLkCJzb17zJ.jpg',
        overview: 'A ticking-time-bomb insomniac...',
        release_date: '1999-10-15',
        vote_average: 8.433,
        imdb_id: 'tt0137523',
      }

      const preview = tmdb.formatMetaPreview(rawMovie, 'movie')
      expect(preview.id).toBe('tt0137523')
      expect(preview.type).toBe('movie')
      expect(preview.name).toBe('Fight Club')
      expect(preview.releaseInfo).toBe('1999')
      expect(preview.poster).toContain('/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg')
      expect(preview.banner).toContain('/hZkgoQYus5vegHoetLkCJzb17zJ.jpg')
      expect(preview.imdbRating).toBe(8.4)
    })

    it('formats full movie metadata with trailers, cast, and genres', async () => {
      const details = {
        id: 550,
        title: 'Fight Club',
        overview: 'An insomniac office worker...',
        poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
        backdrop_path: '/hZkgoQYus5vegHoetLkCJzb17zJ.jpg',
        release_date: '1999-10-15',
        vote_average: 8.4,
        runtime: 139,
        genres: [{ id: 18, name: 'Drama' }],
        credits: {
          cast: [{ name: 'Edward Norton' }, { name: 'Brad Pitt' }],
          crew: [{ name: 'David Fincher', job: 'Director' }],
        },
        videos: {
          results: [{ key: 'O1nDozs-Lda', site: 'YouTube', type: 'Trailer' }],
        },
        external_ids: { imdb_id: 'tt0137523' },
      }

      const meta = await tmdb.formatFullMeta(details, 'movie')
      expect(meta.id).toBe('tt0137523')
      expect(meta.type).toBe('movie')
      expect(meta.name).toBe('Fight Club')
      expect(meta.genres).toContain('Drama')
      expect(meta.director).toContain('David Fincher')
      expect(meta.cast).toContain('Edward Norton')
      expect(meta.cast).toContain('Brad Pitt')
      expect(meta.runtime).toBe('139 min')
      expect(meta.trailers.length).toBeGreaterThan(0)
      expect(meta.trailers[0].source).toBe('O1nDozs-Lda')
    })
  })

  describe('Catalog Resolver & Providers Routing', () => {
    it('handles catalog requests and provides empty array gracefully when API key is missing or offline', async () => {
      const metas = await resolver.resolveCatalog('trending_movies', 'movie', { page: 1 })
      expect(Array.isArray(metas)).toBe(true)
    })

    it('resolves Xperience catalogs (actor, director, decade, mdblist) data-driven from catalog metadata', async () => {
      const [actorMetas, directorMetas, decadeMetas, mdblistMetas] = await Promise.all([
        resolver.resolveCatalog('actor_tom_cruise', 'movie', { page: 1 }),
        resolver.resolveCatalog('director_christopher_nolan', 'movie', { page: 1 }),
        resolver.resolveCatalog('decade_90s_movies', 'movie', { page: 1 }),
        resolver.resolveCatalog('snoak_top100_movies', 'movie', { page: 1 }),
      ])

      expect(Array.isArray(actorMetas)).toBe(true)
      expect(Array.isArray(directorMetas)).toBe(true)
      expect(Array.isArray(decadeMetas)).toBe(true)
      expect(Array.isArray(mdblistMetas)).toBe(true)
    }, 15000)
  })

  describe('HTTP Endpoints & Stremio Protocol', () => {
    it('GET /api/catalogs/manifest.json serves valid Stremio manifest with catalog & meta resources', async () => {
      const res = await app.request('/api/catalogs/manifest.json')
      expect(res.status).toBe(200)

      const manifest = await res.json()
      expect(manifest.id).toBe('org.nuviodeck.deck')
      expect(manifest.resources).toContain('catalog')
      expect(manifest.resources).toContain('meta')
      expect(manifest.types).toContain('movie')
      expect(manifest.types).toContain('series')
      expect(Array.isArray(manifest.catalogs)).toBe(true)
      expect(manifest.catalogs.length).toBeGreaterThan(0)
    })

    it('GET /api/catalogs/catalog/movie/trending_movies returns metas structure', async () => {
      const res = await app.request('/api/catalogs/catalog/movie/trending_movies')
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toHaveProperty('metas')
      expect(Array.isArray(data.metas)).toBe(true)
    })

    it('GET /api/catalogs/registry serves single-source catalog registry with categories', async () => {
      const res = await app.request('/api/catalogs/registry')
      expect(res.status).toBe(200)

      const data = await res.json()
      expect(data).toHaveProperty('total')
      expect(data.total).toBe(1133)
      expect(Array.isArray(data.categories)).toBe(true)
      expect(data.categories.length).toBeGreaterThanOrEqual(28)
      expect(Array.isArray(data.categoryDirectory)).toBe(true)
    })

    it('GET /api/catalogs/registry/categories serves lightweight category list', async () => {
      const res = await app.request('/api/catalogs/registry/categories')
      expect(res.status).toBe(200)

      const data = await res.json()
      expect(data.total).toBe(1133)
      expect(Array.isArray(data.categories)).toBe(true)
      expect(data.categories[0]).toHaveProperty('id')
      expect(data.categories[0]).toHaveProperty('name')
      expect(data.categories[0]).toHaveProperty('count')
    })

    it('resolves dynamic ad-hoc catalogs (tmdb_actor:500, tmdb_director:525, mdblist:164547)', async () => {
      const [actorRes, directorRes, mdblistRes] = await Promise.all([
        resolver.resolveCatalog('tmdb_actor:500', 'movie', { page: 1 }),
        resolver.resolveCatalog('tmdb_director:525', 'movie', { page: 1 }),
        resolver.resolveCatalog('mdblist:164547', 'movie', { page: 1 }),
      ])

      expect(Array.isArray(actorRes)).toBe(true)
      expect(Array.isArray(directorRes)).toBe(true)
      expect(Array.isArray(mdblistRes)).toBe(true)
    }, 15000)

    it('GET /api/catalogs/meta/movie/tmdb:invalid returns null or 404 cleanly without crashing', async () => {
      const res = await app.request('/api/catalogs/meta/movie/tmdb:invalid')
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.meta).toBeNull()
    })

    it('GET /api/debrid/providers returns supported debrid services including debridlink', async () => {
      const res = await app.request('/api/debrid/providers')
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(Array.isArray(data.providers)).toBe(true)
      const providerIds = data.providers.map((p: any) => p.id)
      expect(providerIds).toContain('realdebrid')
      expect(providerIds).toContain('torbox')
      expect(providerIds).toContain('alldebrid')
      expect(providerIds).toContain('premiumize')
      expect(providerIds).toContain('debridlink')
    })

    it('POST /api/debrid/validate rejects empty token or unsupported provider', async () => {
      const emptyRes = await app.request('/api/debrid/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'realdebrid', token: '' }),
      })
      expect(emptyRes.status).toBe(400)

      const badProviderRes = await app.request('/api/debrid/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'unknown_debrid', token: 'test_token' }),
      })
      expect(badProviderRes.status).toBe(400)
      const badData = await badProviderRes.json()
      expect(badData.error).toContain('Unsupported debrid provider')
    })

    it('GET /api/metadata/search handles search queries gracefully', async () => {
      const emptyQueryRes = await app.request('/api/metadata/search')
      expect(emptyQueryRes.status).toBe(400)

      const validQueryRes = await app.request('/api/metadata/search?q=Inception&type=movie')
      expect([200, 500]).toContain(validQueryRes.status)
      const searchData = await validQueryRes.json()
      expect(searchData).toHaveProperty('results')
      expect(Array.isArray(searchData.results)).toBe(true)
    })

    it('resolves tmdb_list dynamic catalog gracefully', async () => {
      const listMetas = await resolver.resolveCatalog('tmdb_list:8245', 'movie', { page: 1 })
      expect(Array.isArray(listMetas)).toBe(true)
    })
  })
})

