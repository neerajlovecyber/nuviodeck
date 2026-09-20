import { describe, it, expect } from 'bun:test'
import { Hono } from 'hono'
import { StreamParser } from '../src/services/streams/parser'
import { StreamDeduplicator } from '../src/services/streams/deduplicator'
import { StreamFilterer } from '../src/services/streams/filterer'
import { StreamSorter } from '../src/services/streams/sorter'
import { StreamFormatter } from '../src/services/streams/formatter'
import { streamAggregatorService } from '../src/services/streams'
import { catalogsRouter } from '../src/routes/catalogs'
import { StremioStream } from '../src/services/streams/types'

describe('Streams Engine (Matching Xperience UI & Architecture)', () => {
  const sampleStreamRaw: StremioStream = {
    name: 'Comet [TB+]\n4K UHD',
    title:
      'Dune.Part.Two.2024.UHD.BluRay.2160p.TrueHD.Atmos.7.1.DV.HDR10+.HEVC-FraMeSToR.mkv\n💾 62.50 GB 👥 42 📡 TorrentGalaxy',
    infoHash: 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678',
    url: 'https://api.torbox.app/v1/api/torrents/requestdl?token=mock&id=1',
  }

  it('parses raw stream title and extracts resolution, quality, HDR/DV, audio, codecs, and size', () => {
    const parsed = StreamParser.parse(sampleStreamRaw, 'comet_tb', 'Comet', 'torbox')

    expect(parsed.resolution).toBe('2160p')
    expect(parsed.quality).toBe('BluRay')
    expect(parsed.visualTags).toContain('DV')
    expect(parsed.visualTags).toContain('HDR10+')
    expect(parsed.audioTags).toContain('Atmos')
    expect(parsed.audioTags).toContain('TrueHD')
    expect(parsed.audioChannels).toBe('7.1')
    expect(parsed.codecs).toContain('HEVC')
    expect(parsed.releaseGroup).toBe('FraMeSToR')
    expect(parsed.indexer).toBe('TorrentGalaxy')
    expect(parsed.sizeFormatted).toBe('62.50 GB')
    expect(parsed.seeders).toBe(42)
    expect(parsed.cached).toBe(true)
    expect(parsed.debridService).toBe('torbox')
  })

  it('deduplicates identical files across sources and enforces "higher one wins"', () => {
    const source1Stream = StreamParser.parse(
      {
        name: 'Comet [TB+]',
        title: 'Dune.Part.Two.2024.2160p.UHD.mkv 62.50 GB',
        infoHash: 'aabbcc11223344556677889900aabbcc11223344',
      },
      'comet_tb',
      'Comet',
      'torbox'
    )

    const source2Stream = StreamParser.parse(
      {
        name: 'StremThru [TB+]',
        title: 'Dune.Part.Two.2024.2160p.UHD.mkv 62.50 GB',
        infoHash: 'aabbcc11223344556677889900aabbcc11223344',
      },
      'stremthru_tb',
      'StremThru Torz',
      'torbox'
    )

    // With source order [comet_tb, stremthru_tb], comet_tb must win
    const deduped1 = StreamDeduplicator.deduplicate(
      [source2Stream, source1Stream],
      ['comet_tb', 'stremthru_tb']
    )
    expect(deduped1).toHaveLength(1)
    expect(deduped1[0].sourceId).toBe('comet_tb')

    // With source order [stremthru_tb, comet_tb], stremthru_tb must win
    const deduped2 = StreamDeduplicator.deduplicate(
      [source1Stream, source2Stream],
      ['stremthru_tb', 'comet_tb']
    )
    expect(deduped2).toHaveLength(1)
    expect(deduped2[0].sourceId).toBe('stremthru_tb')
  })

  it('filters out CAM/TS/SCR rips by default and respects mostPerResolution cap', () => {
    const camStream = StreamParser.parse(
      { name: 'Stream', title: 'Dune.Part.Two.2024.HDCAM.x264.mkv' },
      'source1',
      'Source 1'
    )
    const valid1080p = StreamParser.parse(
      { name: 'Stream', title: 'Dune.Part.Two.2024.1080p.WEB-DL.mkv' },
      'source1',
      'Source 1'
    )

    // Generate eleven 4K streams to test mostPerResolution: 10 cap
    const fourKStreams = Array.from({ length: 12 }, (_, i) =>
      StreamParser.parse(
        {
          name: 'Stream',
          title: `Dune.Part.Two.2024.2160p.UHD.mkv size: ${50 + i} GB`,
          infoHash: `hash4k_${i}`,
        },
        'source1',
        'Source 1'
      )
    )

    const all = [camStream, valid1080p, ...fourKStreams]

    // Default filters: CAM hidden, mostPerResolution = 10
    const filtered = StreamFilterer.filter(all, {
      mostPerResolution: 10,
      excludedQualities: ['CAM', 'TS', 'SCR'],
    })

    // CAM must be omitted
    expect(filtered.some((s) => s.quality === 'CAM')).toBe(false)
    // 1080p must be preserved
    expect(filtered.some((s) => s.resolution === '1080p')).toBe(true)
    // 4K must be capped at 10 (not 12) so lower resolutions are never crowded out
    const fourKCount = filtered.filter((s) => s.resolution === '2160p').length
    expect(fourKCount).toBe(10)
  })

  it('supports in_order, interleaved, and priority merge strategies', () => {
    const s1_a = StreamParser.parse(
      { name: 'S1', title: 'Movie.1080p.WEB-DL.mkv 5 GB', infoHash: '1' },
      'source1',
      'Source 1'
    )
    const s1_b = StreamParser.parse(
      { name: 'S1', title: 'Movie.720p.HDTV.mkv 2 GB', infoHash: '2' },
      'source1',
      'Source 1'
    )

    const s2_a = StreamParser.parse(
      { name: 'S2', title: 'Movie.2160p.Remux.mkv 40 GB', infoHash: '3' },
      'source2',
      'Source 2'
    )
    const s2_b = StreamParser.parse(
      { name: 'S2', title: 'Movie.1080p.Remux.mkv 20 GB', infoHash: '4' },
      'source2',
      'Source 2'
    )

    const sourceOrder = ['source1', 'source2']

    // 1. In Order: all Source 1 streams first, then Source 2
    const inOrder = StreamSorter.sort([s2_a, s1_a, s2_b, s1_b], 'in_order', sourceOrder)
    expect(inOrder[0].sourceId).toBe('source1')
    expect(inOrder[1].sourceId).toBe('source1')
    expect(inOrder[2].sourceId).toBe('source2')
    expect(inOrder[3].sourceId).toBe('source2')

    // 2. Interleaved: round robin (S1, S2, S1, S2)
    const interleaved = StreamSorter.sort(
      [s1_a, s1_b, s2_a, s2_b],
      'interleaved',
      sourceOrder
    )
    expect(interleaved[0].sourceId).toBe('source1')
    expect(interleaved[1].sourceId).toBe('source2')
    expect(interleaved[2].sourceId).toBe('source1')
    expect(interleaved[3].sourceId).toBe('source2')

    // 3. Priority: Global quality & resolution (2160p > 1080p > 720p)
    const priority = StreamSorter.sort([s1_b, s1_a, s2_b, s2_a], 'priority', sourceOrder)
    expect(priority[0].resolution).toBe('2160p')
    expect(priority[1].resolution).toBe('1080p')
    expect(priority[3].resolution).toBe('720p')
  })

  it('formats streams according to all 8 Xperience presets and custom templates', () => {
    const parsed = StreamParser.parse(sampleStreamRaw, 'comet_tb', 'Comet', 'torbox')

    // 1. Prism (Default)
    const prism = StreamFormatter.format(parsed, { preset: 'prism' })
    expect(prism.name).toContain('🔥 4K UHD')
    expect(prism.description).toContain('FraMeSToR')
    expect(prism.description).toContain('Ready (Torbox)')

    // 2. Xperience
    const xp = StreamFormatter.format(parsed, { preset: 'xperience' })
    expect(xp.name).toBe('🖥️ UHD')
    expect(xp.description).toContain('💚 torbox • Comet')

    // 3. Charcoal
    const charcoal = StreamFormatter.format(parsed, { preset: 'charcoal' })
    expect(charcoal.name).toContain('🖥️ 4K')
    expect(charcoal.description).toContain('Ξ')

    // 4. StreamSense
    const streamSense = StreamFormatter.format(parsed, { preset: 'streamsense' })
    expect(streamSense.name).toContain('⚜️ 4K UHD')
    expect(streamSense.name).toContain('❖ Comet')

    // 5. Ned's Formatter
    const neds = StreamFormatter.format(parsed, { preset: 'neds' })
    expect(neds.name).toContain('✨ 2160p')
    expect(neds.description).toContain('🎟️')

    // 6. Linden
    const linden = StreamFormatter.format(parsed, { preset: 'linden' })
    expect(linden.name).toContain('4K')
    expect(linden.name).toContain('🔱 Comet')

    // 7. Linden Monochrome
    const lindenMono = StreamFormatter.format(parsed, { preset: 'linden_monochrome' })
    expect(lindenMono.name).not.toContain('🔱')

    // 8. Shota Simple
    const shota = StreamFormatter.format(parsed, { preset: 'shota_simple' })
    expect(shota.name).toContain('[TO] 2160p')

    // 9. Custom Template
    const custom = StreamFormatter.format(parsed, {
      customTemplate: '{stream.resolution} | {addon.name} | {stream.size}',
    })
    expect(custom.description).toBe('2160p | Comet | 62.50 GB')
  })

  it('serves Stremio stream protocol endpoint /api/catalogs/:profileId/stream/:type/:id', async () => {
    const app = new Hono()
    app.route('/api/catalogs', catalogsRouter)

    // Default or disabled profile returns empty streams list without error
    const resDisabled = await app.request('/api/catalogs/stream/movie/tt0137523.json')
    expect(resDisabled.status).toBe(200)
    const jsonDisabled = await resDisabled.json()
    expect(Array.isArray(jsonDisabled.streams)).toBe(true)
    expect(jsonDisabled.streams).toHaveLength(0)

    // Test StreamAggregatorService directly with enabled profile
    const streams = await streamAggregatorService.getStreams(
      'movie',
      'tt0137523',
      {
        enabled: true,
        sources: [
          {
            id: 'mock_comet',
            name: 'Comet',
            type: 'custom',
            url: 'https://invalid-comet-url.example.com/manifest.json',
            enabled: true,
            debridService: 'torbox',
          },
        ],
        debridKeys: { torbox: 'test-token' },
        filters: { mostPerResolution: 10 },
        formatter: { preset: 'prism' },
      }
    )

    // Gracefully returns array (even if mock external URL is unreachable) without throwing
    expect(Array.isArray(streams)).toBe(true)
  })
})
