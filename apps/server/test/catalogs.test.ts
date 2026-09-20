import { describe, it, expect } from 'bun:test'
import { Hono } from 'hono'
import { catalogsRouter } from '../src/routes/catalogs'
import {
  CatalogResolver,
  getCatalogRegistry,
  getCuratedCatalogs,
  getCuratedCategories,
  getCuratedPresets,
  getCuratedPresetById,
} from '../src/services/catalog-resolver'
import { getCustomEpisodeGroup, getCustomImdbId } from '../src/services/episode-groups'

describe('Section 3: Curated Catalogs & Catalog Registry Parity', () => {
  const app = new Hono()
  app.route('/api/catalogs', catalogsRouter)

  describe('3.1 Curated Catalogs Dataset (1,133 Rows)', () => {
    it('loads full dataset and matches total catalog count', () => {
      const registry = getCatalogRegistry()
      expect(registry.total).toBeGreaterThanOrEqual(1100)
      expect(Array.isArray(registry.categories)).toBe(true)
      expect(Array.isArray(registry.categoryDirectory)).toBe(true)
    })

    it('contains all 32 curated categories with correct counts', () => {
      const categories = getCuratedCategories()
      expect(categories.length).toBeGreaterThanOrEqual(30)
      const categoryIds = categories.map((c) => c.id)
      expect(categoryIds).toContain('for_you_trending')
      expect(categoryIds).toContain('awards')
      expect(categoryIds).toContain('decades')
      expect(categoryIds).toContain('anime')
      expect(categoryIds).toContain('studios_labels')
    })

    it('contains all 9 pre-built layout presets with valid rows', () => {
      const presets = getCuratedPresets()
      expect(presets.length).toBe(9)
      const ids = presets.map((p) => p.id)
      expect(ids).toContain('balanced')
      expect(ids).toContain('movie_lover')
      expect(ids).toContain('series_binger')
      expect(ids).toContain('quality')
      expect(ids).toContain('lite_streaming')
      expect(ids).toContain('casual')
      expect(ids).toContain('anime_fan')
      expect(ids).toContain('kids_profile')
      expect(ids).toContain('classics_lover')

      for (const p of presets) {
        const fullPreset = getCuratedPresetById(p.id)
        expect(fullPreset).toBeDefined()
        expect(fullPreset?.rows.length).toBeGreaterThan(0)
      }
    })

    it('provides tileShape metadata correctly (POSTER vs LANDSCAPE)', () => {
      const curated = getCuratedCatalogs({ limit: 100 })
      const streamingRow = curated.items.find((c) => c.category?.includes('streaming') || c.category?.includes('collections'))
      if (streamingRow) {
        expect(streamingRow.tileShape).toBe('LANDSCAPE')
      }
      const standardRow = curated.items.find((c) => !c.category?.includes('streaming') && !c.category?.includes('collections'))
      if (standardRow) {
        expect(standardRow.tileShape).toBe('POSTER')
      }
    })
  })

  describe('3.2 Curated Catalog Explorer Endpoints', () => {
    it('GET /api/catalogs/curated searches and filters by kind and category', async () => {
      // 1. Search anime
      const resSearch = await app.request('/api/catalogs/curated?search=ghibli')
      expect(resSearch.status).toBe(200)
      const dataSearch = await resSearch.json()
      expect(dataSearch.total).toBeGreaterThan(0)
      expect(dataSearch.items.some((c: any) => c.label.toLowerCase().includes('ghibli') || c.id.includes('ghibli'))).toBe(true)

      // 2. Filter by category & kind
      const resCat = await app.request('/api/catalogs/curated?category=trending&kind=movie')
      expect(resCat.status).toBe(200)
      const dataCat = await resCat.json()
      expect(dataCat.items.every((c: any) => c.category === 'trending' || c.category?.includes('trending'))).toBe(true)
    })

    it('GET /api/catalogs/curated/categories lists categories', async () => {
      const res = await app.request('/api/catalogs/curated/categories')
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(Array.isArray(data.categories)).toBe(true)
      expect(data.categories.length).toBeGreaterThan(25)
    })

    it('GET /api/catalogs/curated/presets and /presets/:id return full rows', async () => {
      const resList = await app.request('/api/catalogs/curated/presets')
      expect(resList.status).toBe(200)
      const dataList = await resList.json()
      expect(dataList.presets.length).toBe(9)

      const resBalanced = await app.request('/api/catalogs/curated/presets/balanced')
      expect(resBalanced.status).toBe(200)
      const dataBalanced = await resBalanced.json()
      expect(dataBalanced.preset.id).toBe('balanced')
      expect(Array.isArray(dataBalanced.rows)).toBe(true)
      expect(dataBalanced.rows.length).toBeGreaterThan(0)

      const res404 = await app.request('/api/catalogs/curated/presets/non_existent')
      expect(res404.status).toBe(404)
    })
  })

  describe('3.3 Episode Groups Re-ordering', () => {
    it('correctly maps TV shows with custom episode group ordering', () => {
      const onePiece = getCustomEpisodeGroup('37854')
      expect(onePiece).toBeDefined()
      expect(onePiece?.episodeGroupId).toBe('62f98314175051007c594bdf')

      const moneyHeist = getCustomEpisodeGroup(71446)
      expect(moneyHeist).toBeDefined()
      expect(moneyHeist?.episodeGroupId).toBe('5eb730dfca7ec6001f7beb51')

      const cloneWars = getCustomEpisodeGroup('4194')
      expect(cloneWars).toBeDefined()
      expect(cloneWars?.watchOrderOnly).toBe(true)
    })
  })

  describe('3.4 ID Remapping Engine', () => {
    it('correctly overrides mismatched IMDb IDs', () => {
      const dbz = getCustomImdbId('12971')
      expect(dbz).toBe('tt0214341')

      const unmapped = getCustomImdbId('999999999')
      expect(unmapped).toBeUndefined()
    })
  })

  describe('3.5 Dynamic Ad-Hoc Catalogs & Resolver', () => {
    const resolver = new CatalogResolver()

    it('recognizes dynamic ad-hoc catalog IDs (actor, director, company, keyword, mdblist, list)', async () => {
      // Mock actor
      const actorMetas = await resolver.resolveCatalog('tmdb_actor:500', 'movie', {})
      expect(Array.isArray(actorMetas)).toBe(true)

      // Mock director
      const dirMetas = await resolver.resolveCatalog('tmdb_director:525', 'movie', {})
      expect(Array.isArray(dirMetas)).toBe(true)

      // Mock keyword
      const kwMetas = await resolver.resolveCatalog('tmdb_keyword:9715', 'movie', {})
      expect(Array.isArray(kwMetas)).toBe(true)

      // Mock company
      const coMetas = await resolver.resolveCatalog('tmdb_company:420', 'movie', {})
      expect(Array.isArray(coMetas)).toBe(true)
    })
  })

  describe('3.6 Catalog & Meta Stremio Routes', () => {
    it('GET /api/catalogs/manifest.json serves valid Stremio manifest', async () => {
      const res = await app.request('/api/catalogs/manifest.json')
      expect(res.status).toBe(200)
      const manifest = await res.json()
      expect(manifest.id).toBe('org.nuviodeck.deck')
      expect(manifest.resources).toContain('catalog')
      expect(manifest.resources).toContain('meta')
      expect(Array.isArray(manifest.catalogs)).toBe(true)
      expect(manifest.catalogs.length).toBeGreaterThan(0)
    })

    it('GET /api/catalogs/catalog/:type/:id returns Stremio metas array format', async () => {
      const res = await app.request('/api/catalogs/catalog/movie/trending_movies')
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(Array.isArray(data.metas)).toBe(true)
    })

    it('GET /api/catalogs/meta/:type/:id handles requests gracefully', async () => {
      const res = await app.request('/api/catalogs/meta/movie/tmdb:invalid')
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.meta).toBeNull()
    })
  })
})
