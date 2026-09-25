import { describe, expect, it } from 'bun:test'
import { app } from '../src'
import { StreamSorter } from '../src/services/streams/sorter'
import { ParsedStreamMetadata } from '../src/services/streams/types'

describe('Xperience-Derived Endpoints & Engines', () => {
  it('1. Serves Curated Catalogs Explorer with search and categories', async () => {
    // Search anime
    const res1 = await app.request('/api/catalogs/curated?search=anime&limit=10')
    expect(res1.status).toBe(200)
    const data1 = await res1.json()
    expect(data1.total).toBeGreaterThan(0)
    expect(data1.items.length).toBeGreaterThan(0)
    expect(data1.items[0]).toHaveProperty('tileShape')
    expect(data1.items[0]).toHaveProperty('coverSlug')

    // Categories
    const res2 = await app.request('/api/catalogs/curated/categories')
    expect(res2.status).toBe(200)
    const data2 = await res2.json()
    expect(data2.categories.length).toBe(32)

    // Presets
    const res3 = await app.request('/api/catalogs/curated/presets')
    expect(res3.status).toBe(200)
    const data3 = await res3.json()
    expect(data3.presets.length).toBe(9)

    // Single Preset
    const firstPresetId = data3.presets[0].id
    const res4 = await app.request(`/api/catalogs/curated/presets/${firstPresetId}`)
    expect(res4.status).toBe(200)
    const data4 = await res4.json()
    expect(data4.preset.id).toBe(firstPresetId)
    expect(data4.rows.length).toBeGreaterThan(0)
  })

  it('2. Custom multi-criteria sorting chain orders visual tags and audio before resolution if configured', () => {
    const stream1080pDVAtmos: ParsedStreamMetadata = {
      id: 's1',
      sourceId: 'src1',
      sourceName: 'Comet',
      cached: true,
      rawTitle: 'Movie 1080p DV Atmos',
      resolution: '1080p',
      quality: 'WEB-DL',
      visualTags: ['DV', 'HDR'],
      audioTags: ['Atmos'],
      codecs: ['HEVC'],
      languages: ['English'],
      languageEmojis: ['🇬🇧'],
      sizeBytes: 5000000000,
      originalStream: { name: 'Comet' },
    }

    const stream4kSDR: ParsedStreamMetadata = {
      id: 's2',
      sourceId: 'src1',
      sourceName: 'Comet',
      cached: true,
      rawTitle: 'Movie 2160p SDR',
      resolution: '2160p',
      quality: 'WEB-DL',
      visualTags: [],
      audioTags: ['AAC'],
      codecs: ['HEVC'],
      languages: ['English'],
      languageEmojis: ['🇬🇧'],
      sizeBytes: 8000000000,
      originalStream: { name: 'Comet' },
    }

    // Default sorting (resolution first): 4K wins
    const defaultSorted = StreamSorter.sort([stream1080pDVAtmos, stream4kSDR], 'priority')
    expect(defaultSorted[0].resolution).toBe('2160p')

    // Custom sorting (visualTag > audioTag > resolution): 1080p DV Atmos wins
    const customSorted = StreamSorter.sort(
      [stream4kSDR, stream1080pDVAtmos],
      'priority',
      [],
      [],
      ['cached', 'visualTag', 'audioTag', 'resolution']
    )
    expect(customSorted[0].id).toBe('s1')
    expect(customSorted[0].visualTags).toContain('DV')
  })

  it('3. Serves Streaming Providers and Age Ratings', async () => {
    const res = await app.request('/api/streaming-providers')
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.providers.length).toBe(23)
    expect(data.regions).toHaveProperty('United States')
    expect(data.regions).toHaveProperty('India')

    const ratingsRes = await app.request('/api/streaming-providers/age-ratings')
    expect(ratingsRes.status).toBe(200)
    const ratingsData = await ratingsRes.json()
    expect(ratingsData.ratings.length).toBe(6)
  })

  it('4. Serves Profile Avatars Dataset', async () => {
    const res = await app.request('/api/avatars')
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toBeDefined()
  })

  it('5. International Ratings Certification Matrix Normalization', async () => {
    const { buildCertificationFilter, resolveRatingCountry } = await import(
      '../src/services/ratings-filter'
    )

    // US G/PG/PG-13/R tiers
    const usG = buildCertificationFilter('G', 'US', true)
    expect(usG?.certification_country).toBe('US')
    expect(usG?.certification).toContain('G')

    const usR = buildCertificationFilter('R', 'US', true)
    expect(usR?.certification).toContain('R')
    expect(usR?.certification).toContain('PG-13')
    expect(usR?.certification).not.toContain('NC-17')

    // UK BBFC certification normalization
    const uk15 = buildCertificationFilter('15', 'GB', true)
    expect(uk15?.certification_country).toBe('GB')
    expect(uk15?.certification).toContain('15')
    expect(uk15?.certification).toContain('12')
    expect(uk15?.certification).not.toContain('18')

    // Region resolution from timezone
    expect(resolveRatingCountry(undefined, 'Europe/London')).toBe('GB')
    expect(resolveRatingCountry(undefined, 'America/New_York')).toBe('US')
    expect(resolveRatingCountry(undefined, 'Asia/Kolkata')).toBe('IN')
  })

  it('6. TV Episode Release Air Delay Filter', async () => {
    const { isTvEpisodeDelayed } = await import('../src/services/release-filter')

    // An episode that aired 2 hours ago with a 24-hour delay requirement -> DELAYED
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    expect(isTvEpisodeDelayed(twoHoursAgo, 24)).toBe(true)

    // An episode that aired 48 hours ago with a 24-hour delay requirement -> ALLOWED
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    expect(isTvEpisodeDelayed(twoDaysAgo, 24)).toBe(false)

    // Delay = 0 -> never delayed
    expect(isTvEpisodeDelayed(twoHoursAgo, 0)).toBe(false)
  })
})
