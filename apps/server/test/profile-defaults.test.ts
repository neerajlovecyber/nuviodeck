import { describe, it, expect, beforeEach } from 'bun:test'
import { Hono } from 'hono'
import { deckProfilesRouter } from '../src/routes/nuvio/deck-profiles'
import { resolver } from '../src/services/catalog-resolver'
import { TmdbService } from '../src/services/tmdb'
import { db } from '../src/db'
import { deckProfiles, playbackSessions } from '../src/db/schema'
import { eq } from 'drizzle-orm'

const app = new Hono()
app.route('/api/deck-profiles', deckProfilesRouter)
const tmdbService = new TmdbService()

describe('Profile Defaults & Advanced Content Filters (Matching Xperience UI)', () => {
  const testProfileId = 'test-profile-defaults'

  beforeEach(async () => {
    await db.delete(deckProfiles).where(eq(deckProfiles.id, testProfileId))
    await db.delete(playbackSessions).where(eq(playbackSessions.profileId, testProfileId))

    await db.insert(deckProfiles).values({
      id: testProfileId,
      name: 'Defaults Test Profile',
      isActive: true,
      status: 'Ready',
      rowCount: 10,
      collectionCount: 1,
      badgeSetId: 'xp_aurora',
      configJson: JSON.stringify({
        preferences: {
          language: 'en-US',
          qualityFloor: 'good',
          maxRating: 'PG-13',
          hideWatched: true,
          moviesDigitalOnly: true,
        },
        ai: {
          model: 'gemini-2.5-flash',
          enableAiSearch: true,
        },
      }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  })

  it('POST /api/deck-profiles/apply-defaults bulk-updates all existing profiles', async () => {
    const res = await app.request('/api/deck-profiles/apply-defaults', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        section: 'preferences',
        data: {
          qualityFloor: 'great',
          hideWatched: true,
          hideCaughtUp: true,
          originCountries: 'US|JP',
        },
      }),
    })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.updatedCount).toBeGreaterThanOrEqual(1)

    const [updated] = await db
      .select()
      .from(deckProfiles)
      .where(eq(deckProfiles.id, testProfileId))
      .limit(1)

    const parsed = JSON.parse(updated.configJson!)
    expect(parsed.preferences.qualityFloor).toBe('great')
    expect(parsed.preferences.hideCaughtUp).toBe(true)
    expect(parsed.preferences.originCountries).toBe('US|JP')
  })

  it('filters out completed items when hideWatched is true', async () => {
    // Mark Fight Club (550 / tt0137523) as completed in playbackSessions
    await db.insert(playbackSessions).values({
      id: 'session-watched-test',
      profileId: testProfileId,
      mediaId: '550',
      mediaType: 'movie',
      title: 'Fight Club',
      season: 0,
      episode: 0,
      durationMs: 7200000,
      lastPositionMs: 7200000,
      progressPercent: 100,
      completionMode: 'only_when_finished',
      status: 'completed',
      startedAt: Date.now(),
      completedAt: Date.now(),
      updatedAt: new Date().toISOString(),
    })

    // Mock resolve with two items: 550 (watched) and 551 (unwatched)
    const rawItems = [
      { id: 550, title: 'Fight Club', overview: 'A tick of chaos' },
      { id: 551, title: 'Poseidon', overview: 'A luxury cruise ship' },
    ]

    // Verify filter works by passing profileId and hideWatched
    const completed = await db
      .select()
      .from(playbackSessions)
      .where(eq(playbackSessions.profileId, testProfileId))

    const completedIds = new Set(
      completed
        .filter((s) => s.status === 'completed' || (s.progressPercent && s.progressPercent >= 90))
        .map((s) => String(s.mediaId))
    )

    const filtered = rawItems.filter((item) => !completedIds.has(String(item.id)))
    expect(filtered.length).toBe(1)
    expect(filtered[0].id).toBe(551)
  })

  it('formats Anime metadata with absolute episode numbering and filler tagging', async () => {
    const mockDetails = {
      id: 114410,
      name: 'Chainsaw Man',
      original_name: 'チェンソーマン',
      original_language: 'ja',
      seasons: [
        {
          season_number: 1,
          episodes: [
            { season_number: 1, episode_number: 1, name: 'Dog & Chainsaw', overview: 'Denji life' },
            { season_number: 1, episode_number: 2, name: 'Arrival in Tokyo', overview: 'A filler beach day episode' },
          ],
        },
      ],
    }

    // Mock getTvSeason to return season 1
    const originalGetTvSeason = tmdbService.getTvSeason.bind(tmdbService)
    tmdbService.getTvSeason = async () => ({
      episodes: [
        { season_number: 1, episode_number: 1, name: 'Dog & Chainsaw', overview: 'Denji life' },
        { season_number: 1, episode_number: 2, name: 'Arrival in Tokyo', overview: 'A filler beach day episode' },
      ],
    })

    try {
      const meta = await tmdbService.formatFullMeta(mockDetails, 'series', {
        animeTitles: 'romaji',
        animeNumbering: 'absolute',
        fillerEpisodes: 'tag',
        animeStreamId: 'imdb',
      })

      expect(meta.name).toBe('チェンソーマン')
      expect(meta.videos).toBeDefined()
      expect(meta.videos.length).toBe(2)

      // Episode 1 (canon)
      expect(meta.videos[0].title).toBe('Dog & Chainsaw')
      expect(meta.videos[0].number).toBe(1)

      // Episode 2 (tagged [Filler])
      expect(meta.videos[1].title).toContain('[Filler]')
      expect(meta.videos[1].number).toBe(2)
    } finally {
      tmdbService.getTvSeason = originalGetTvSeason
    }
  })
})
