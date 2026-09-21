import { describe, it, expect } from 'bun:test'
import { Hono } from 'hono'
import { StreamParser } from '../src/services/streams/parser'
import { StreamDeduplicator } from '../src/services/streams/deduplicator'
import { StreamFilterer } from '../src/services/streams/filterer'
import { StreamSorter } from '../src/services/streams/sorter'
import { StreamFormatter, StreamMicroSyntaxEngine } from '../src/services/streams/formatter'
import { streamAggregatorService } from '../src/services/streams'
import { catalogsRouter } from '../src/routes/catalogs'
import { StremioStream } from '../src/services/streams/types'

describe('Section 1: Stream Engine & Micro-Syntax Formatter Parity', () => {
  const sampleStreamRaw: StremioStream = {
    name: 'Comet [TB+]\n4K UHD',
    title:
      'Dune.Part.Two.2024.UHD.BluRay.2160p.TrueHD.Atmos.7.1.DV.HDR10+.HEVC-FraMeSToR.mkv\n💾 62.50 GB 👥 42 📡 TorrentGalaxy ⏱️ 2h 46m 📅 2d 🌊 SeaDex',
    infoHash: 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678',
    url: 'https://api.torbox.app/v1/api/torrents/requestdl?token=mock&id=1',
  }

  // ----------------------------------------------------
  // 1.1 Micro-Syntax Template Engine
  // ----------------------------------------------------
  describe('1.1 Micro-Syntax Template Engine', () => {
    const parsed = StreamParser.parse(sampleStreamRaw, 'comet_tb', 'Comet', 'torbox')

    it('interpolates direct variables {resolution}, {quality}, {hdr}, {audio}, {size}, {indexer}, {torrentTitle}', () => {
      const template = '{resolution} | {quality} | {hdr} | {audio} | {size} | {indexer} | {torrentTitle}'
      const rendered = StreamMicroSyntaxEngine.render(template, parsed)
      expect(rendered).toContain('2160p')
      expect(rendered).toContain('BluRay')
      expect(rendered).toContain('DV | HDR10+')
      expect(rendered).toContain('Atmos | TrueHD')
      expect(rendered).toContain('62.50 GB')
      expect(rendered).toContain('TorrentGalaxy')
      expect(rendered).toContain('Dune Part Two')
    })

    it('applies filter pipes (:round, :upper, :lower, :bytes, :sbytes, :title, :time, :fallback, ::join, ::replace)', () => {
      expect(StreamMicroSyntaxEngine.render('{resolution:upper}', parsed)).toBe('2160P')
      expect(StreamMicroSyntaxEngine.render('{resolution:lower}', parsed)).toBe('2160p')
      expect(StreamMicroSyntaxEngine.render('{stream.quality:lower}', parsed)).toBe('bluray')
      expect(StreamMicroSyntaxEngine.render('{stream.size::bytes}', parsed)).toContain('GB')
      expect(StreamMicroSyntaxEngine.render('{stream.size::sbytes}', parsed)).toContain('GB')
      expect(StreamMicroSyntaxEngine.render('{stream.duration::time}', parsed)).toContain('2h 46m')
      expect(
        StreamMicroSyntaxEngine.render(
          "{stream.visualTags::join(' - ')}",
          parsed
        )
      ).toBe('DV - HDR10+')
      expect(
        StreamMicroSyntaxEngine.render(
          "{stream.quality::replace('BluRay','BD')}",
          parsed
        )
      ).toBe('BD')
      expect(
        StreamMicroSyntaxEngine.render(
          '{nonexistent::fallback("Default Value")}',
          parsed
        )
      ).toBe('Default Value')
    })

    it('evaluates conditionals ? like {hdr?HDR:} and {? | {stream.encode}?}', () => {
      // Direct ternary
      const res1 = StreamMicroSyntaxEngine.render('{hdr?HasHDR:NoHDR}', parsed)
      expect(res1).toBe('HasHDR')

      // Conditional block syntax {? prefix {var} suffix ?}
      const res2 = StreamMicroSyntaxEngine.render('{? 📺 {stream.encode}?}', parsed)
      expect(res2).toBe('📺 HEVC')

      // Conditional block with non-existent variable omitted
      const res3 = StreamMicroSyntaxEngine.render('{? [Unknown: {nonexistent}] ?}', parsed)
      expect(res3).toBe('')
    })

    it('supports brackets grouping [...] with cascade failure when inner variable is missing', () => {
      // Variable exists -> bracket renders
      const withVar = StreamMicroSyntaxEngine.render('Movie [{resolution}]', parsed)
      expect(withVar).toBe('Movie [2160p]')

      // Inner variable does not exist -> cascade failure drops the entire bracket group
      const withoutVar = StreamMicroSyntaxEngine.render('Movie [{nonexistent_field}]', parsed)
      expect(withoutVar).toBe('Movie')
    })

    it('supports fallback alternatives / like {resolution}/{quality}', () => {
      const rendered = StreamMicroSyntaxEngine.render('{nonexistent/resolution/quality}', parsed)
      expect(rendered).toBe('2160p')
    })

    it('supports Tam-Taro SEL pipes (:star, :pstar, :truncate, :smallcaps, :sbitrate, :remove, :lsort)', () => {
      // Star pipes
      expect(StreamMicroSyntaxEngine.render('{stream.nSeScore::star}', parsed)).toContain('★')
      expect(StreamMicroSyntaxEngine.render('{stream.nSeScore::pstar}', parsed)).toMatch(/^[★☆]{5}$/)

      // Truncate pipe
      expect(StreamMicroSyntaxEngine.render('{stream.title::truncate(4)}', parsed)).toBe('Dune')

      // Smallcaps pipe
      expect(StreamMicroSyntaxEngine.render("{'Dual Audio'::smallcaps}", parsed)).toBe('ᴅᴜᴀʟ ᴀᴜᴅɪᴏ')

      // sbitrate pipe
      const parsedWithBitrate = { ...parsed, bitrate: 24500000 }
      expect(StreamMicroSyntaxEngine.render('{stream.bitrate::sbitrate}', parsedWithBitrate)).toBe('24.5 Mbps')

      // remove pipe
      expect(StreamMicroSyntaxEngine.render("{stream.audioTags::remove('Atmos')::join(' ')}", parsed)).toBe('TrueHD')
    })

    it('handles line removal tools {tools.removeLine}', () => {
      const template = 'Line 1\n{tools.removeLine}\nLine 3'
      const rendered = StreamMicroSyntaxEngine.render(template, parsed)
      expect(rendered).toBe('Line 1\nLine 3')
    })
  })

  // ----------------------------------------------------
  // 1.2 Stream Layout Presets
  // ----------------------------------------------------
  describe('1.2 Stream Layout Presets', () => {
    const parsed = StreamParser.parse(sampleStreamRaw, 'comet_tb', 'Comet', 'torbox')

    const presets = [
      'nuvio',
      'charcoal',
      'prism',
      'streamsense',
      'ned',
      'linden',
      'lindenmono',
      'shota',
      'tamtaro',
      'plain',
    ] as const

    presets.forEach((preset) => {
      it(`renders layout preset "${preset}" successfully with non-empty name and description`, () => {
        const stream = StreamFormatter.format(parsed, { preset })
        expect(stream.name).toBeTruthy()
        expect(stream.description).toBeTruthy()
        expect(typeof stream.name).toBe('string')
        expect(typeof stream.description).toBe('string')
      })
    })

    it('prism preset includes UHD icon, title, tags, and debrid status', () => {
      const stream = StreamFormatter.format(parsed, { preset: 'prism' })
      expect(stream.name).toContain('🔥4K UHD')
      expect(stream.description).toContain('FraMeSToR')
      expect(stream.description).toContain('Ready')
    })

    it('nuvio preset includes UHD icon and debrid source info', () => {
      const stream = StreamFormatter.format(parsed, { preset: 'nuvio' })
      expect(stream.name).toContain('4K')
      expect(stream.description).toContain('Comet')
      expect(stream.description).toContain('FraMeSToR')
    })

    it('plain preset renders clean text description', () => {
      const stream = StreamFormatter.format(parsed, { preset: 'plain' })
      expect(stream.name).toContain('Cached')
      expect(stream.description).toContain('BluRay')
    })

    it('bypasses formatting completely when enabled=false or preset is "raw"/"none"', () => {
      const rawStream = StreamFormatter.format(parsed, { enabled: false })
      expect(rawStream.name).toBe(sampleStreamRaw.name)
      expect(rawStream.title).toBe(sampleStreamRaw.title)

      const noneStream = StreamFormatter.format(parsed, { preset: 'raw' })
      expect(noneStream.name).toBe(sampleStreamRaw.name)
      expect(noneStream.title).toBe(sampleStreamRaw.title)
    })

    it('evaluates star rating pipes (:star, :pstar) based on quality score', () => {
      const star5 = StreamMicroSyntaxEngine.render('{stream.nSeScore::star}', parsed)
      expect(star5).toContain('★')

      const pstar = StreamMicroSyntaxEngine.render('{stream.nSeScore::pstar}', parsed)
      expect(pstar).toHaveLength(5)
    })
  })

  // ----------------------------------------------------
  // 1.3 Torrent Title & Release Parser
  // ----------------------------------------------------
  describe('1.3 Torrent Title & Release Parser', () => {
    it('parses resolution, quality, visual tags, audio tags, channels, codecs, and release groups', () => {
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
      expect(parsed.seadex).toBe(true)
      expect(parsed.duration).toBe(2 * 3600 + 46 * 60)
      expect(parsed.age).toBe('2d')
    })

    it('extracts different qualities correctly: REMUX, WEB-DL, WEBRip, HDTV, DVDRip, CAM, TS, SCR', () => {
      expect(StreamParser.parse({ name: '', title: 'Movie.2024.BluRay.REMUX.mkv' }, 's', 'S').quality).toBe('BluRay REMUX')
      expect(StreamParser.parse({ name: '', title: 'Movie.2024.1080p.WEB-DL.mkv' }, 's', 'S').quality).toBe('WEB-DL')
      expect(StreamParser.parse({ name: '', title: 'Movie.2024.720p.WEBRip.x264.mkv' }, 's', 'S').quality).toBe('WEBRip')
      expect(StreamParser.parse({ name: '', title: 'Show.S01E01.HDTV.x264.mkv' }, 's', 'S').quality).toBe('HDTV')
      expect(StreamParser.parse({ name: '', title: 'Movie.DVDRip.xvid.avi' }, 's', 'S').quality).toBe('DVDRip')
      expect(StreamParser.parse({ name: '', title: 'Movie.2024.HDCAM.x264.mp4' }, 's', 'S').quality).toBe('CAM')
      expect(StreamParser.parse({ name: '', title: 'Movie.2024.TELESYNC.x264.mp4' }, 's', 'S').quality).toBe('TS')
      expect(StreamParser.parse({ name: '', title: 'Movie.2024.DVDSCR.x264.mp4' }, 's', 'S').quality).toBe('SCR')
    })

    it('detects movie cuts and OTT platforms', () => {
      const cutStream = StreamParser.parse({ name: '', title: 'Movie.1982.Theatrical.Cut.Remastered.AMZN.mkv' }, 's', 'S')
      expect(cutStream.movieCut).toBe('Theatrical Cut')
      expect(cutStream.ottPlatform).toBe('Prime Video')
    })

    it('sanitizes multiline pre-formatted scraper descriptions (Sootio/Torrentio/AIOStreams)', () => {
      const sootioStream: StremioStream = {
        name: '🔥 4K UHD',
        title:
          '🔥 4k ⟨web⟩ ⟨web-DI⟩ ★★★★★ ✏️ Itaewon Class S01·E01\n🎞️ Hevc 📺 10bit · Sdr\n🎧 Aac · Dd+ 🔊 2.0\n📦 8.38 Gb · 📊 15.1 Mbps\n🌐 Sootio\n🌎 HI ➡️ ASIAN T2 TVING 3524',
        url: 'https://stream.example.com/play/1',
      }
      const parsed = StreamParser.parse(sootioStream, 'custom_1', 'Custom Addon 1', 'torbox')

      expect(parsed.title).toBe('Itaewon Class')
      expect(parsed.season).toBe(1)
      expect(parsed.episode).toBe(1)
      expect(parsed.resolution).toBe('2160p')
      expect(parsed.quality).toBe('WEB-DL')
      expect(parsed.visualTags).toContain('10bit')
      expect(parsed.audioTags).toContain('AAC')
      expect(parsed.codecs).toContain('HEVC')
      expect(parsed.sizeBytes).toBeGreaterThan(0)
      expect(parsed.folderSizeBytes).toBeUndefined()

      // When formatted with Prism preset, description should be clean without duplicate scraper text or duplicated size
      const formatted = StreamFormatter.format(parsed, { preset: 'prism' })
      expect(formatted.name).toContain('🔥4K UHD')
      expect(formatted.description).toContain('🎬 Itaewon Class')
      expect(formatted.description).toContain('S01')
      expect(formatted.description).toContain('E01')
      expect(formatted.description).toContain('8.38 GB')
      expect(formatted.description).not.toContain('8.38 GB/ 📦 8.38 GB')
      expect(formatted.description).not.toContain('🌐 Sootio')
    })
  })

  // ----------------------------------------------------
  // 1.4 Stream Deduplicator
  // ----------------------------------------------------
  describe('1.4 Stream Deduplicator', () => {
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

    it('merges tiered metadata and languages on duplicate file streams', () => {
      const streamA = StreamParser.parse(
        { name: 'S1', title: 'Movie.2024.2160p.mkv English', infoHash: 'hash123' },
        'src1',
        'Source 1'
      )
      const streamB = StreamParser.parse(
        { name: 'S2', title: 'Movie.2024.2160p.mkv French Spanish', infoHash: 'hash123' },
        'src2',
        'Source 2'
      )

      const deduped = StreamDeduplicator.deduplicate([streamA, streamB], ['src1', 'src2'])
      expect(deduped).toHaveLength(1)
      expect(deduped[0].languages).toContain('English')
      expect(deduped[0].languages).toContain('French')
      expect(deduped[0].languages).toContain('Spanish')
    })
  })

  // ----------------------------------------------------
  // 1.5 Stream Filtering & Quality Gate
  // ----------------------------------------------------
  describe('1.5 Stream Filtering & Quality Gate', () => {
    it('filters out pre-digital CAM/TS/SCR rips and respects mostPerResolution cap', () => {
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

      const filtered = StreamFilterer.filter(all, {
        mostPerResolution: 10,
        excludePreDigital: true,
        excludedQualities: ['CAM', 'TS', 'SCR'],
      })

      expect(filtered.some((s) => s.quality === 'CAM')).toBe(false)
      expect(filtered.some((s) => s.resolution === '1080p')).toBe(true)
      const fourKCount = filtered.filter((s) => s.resolution === '2160p').length
      expect(fourKCount).toBe(10)
    })

    it('filters mismatched titles when excludeMismatchedTitles is enabled', () => {
      const matchStream = StreamParser.parse(
        { name: 'S', title: 'Inception.2010.1080p.BluRay.mkv' },
        's',
        'S'
      )
      const mismatchStream = StreamParser.parse(
        { name: 'S', title: 'Interstellar.2014.1080p.BluRay.mkv' },
        's',
        'S'
      )

      const filtered = StreamFilterer.filter([matchStream, mismatchStream], {
        excludeMismatchedTitles: true,
        targetTitle: 'Inception',
      })

      expect(filtered).toHaveLength(1)
      expect(filtered[0].title).toBe('Inception')
    })

    it('filters out sample/spam files, excluded keywords, and blocklisted release groups', () => {
      const sampleStream = StreamParser.parse(
        { name: 'S', title: 'Inception.2010.1080p.sample.mkv' },
        's',
        'S'
      )
      const spamKeywordStream = StreamParser.parse(
        { name: 'S', title: 'Inception.2010.1080p.Ganool.mkv' },
        's',
        'S'
      )
      const blocklistHashStream = StreamParser.parse(
        { name: 'S', title: 'Inception.2010.1080p.BluRay.mkv', infoHash: 'bad_hash_123' },
        's',
        'S'
      )
      const cleanStream = StreamParser.parse(
        { name: 'S', title: 'Inception.2010.1080p.BluRay.x264-SPARKS.mkv', infoHash: 'good_hash_456' },
        's',
        'S'
      )

      const filtered = StreamFilterer.filter(
        [sampleStream, spamKeywordStream, blocklistHashStream, cleanStream],
        {
          excludedKeywords: ['ganool'],
          excludedReleaseGroups: ['ganool'],
          blocklistHashes: ['bad_hash_123'],
        }
      )

      expect(filtered).toHaveLength(1)
      expect(filtered[0].infoHash).toBe('good_hash_456')
    })

    it('filters out streams that violate movie or series file size boundaries', () => {
      // 100MB file claiming to be 4K (trash/sample)
      const tinyStream = StreamParser.parse(
        { name: 'S', title: 'Dune.2024.2160p.mkv 100 MB' },
        's',
        'S'
      )
      // 80GB oversized file
      const giantStream = StreamParser.parse(
        { name: 'S', title: 'Dune.2024.2160p.mkv 80 GB' },
        's',
        'S'
      )
      // 25GB perfect release
      const perfectStream = StreamParser.parse(
        { name: 'S', title: 'Dune.2024.2160p.mkv 25 GB' },
        's',
        'S'
      )

      const filtered = StreamFilterer.filter(
        [tinyStream, giantStream, perfectStream],
        {
          mediaType: 'movie',
          sizeLimits: {
            movieMinGb: 1.0, // Min 1 GB
            movieMaxGb: 50.0, // Max 50 GB
          },
        }
      )

      expect(filtered).toHaveLength(1)
      expect(filtered[0].sizeFormatted).toBe('25.00 GB')
    })

    it('enforces cached-only filter to drop uncached torrents', () => {
      const cachedStream = StreamParser.parse(
        { name: 'S', title: 'Movie.1080p.mkv [TB+] 5 GB' },
        's',
        'S'
      )
      cachedStream.cached = true

      const uncachedStream = StreamParser.parse(
        { name: 'S', title: 'Movie.1080p.mkv 5 GB' },
        's',
        'S'
      )
      uncachedStream.cached = false

      const filtered = StreamFilterer.filter([cachedStream, uncachedStream], {
        cachedOnly: true,
      })

      expect(filtered).toHaveLength(1)
      expect(filtered[0].cached).toBe(true)
    })

    it('automatically filters out 0 MB / 0 B placeholder dummy streams', () => {
      const zeroMbStream = StreamParser.parse(
        { name: 'Comet [TB+]\nUnknown', title: 'Itaewon Class S01 E01\nComet\nNot Ready(TB) Web Link Not Proxied\nSIZE 0 MB' },
        'comet',
        'Comet'
      )
      const validStream = StreamParser.parse(
        { name: 'Comet [TB+]\n1080p FHD', title: 'Itaewon.Class.S01E01.1080p.NF.WEB-DL.DDP2.0.x264\n1.80 GB' },
        'comet',
        'Comet'
      )

      const filtered = StreamFilterer.filter([zeroMbStream, validStream])

      expect(filtered).toHaveLength(1)
      expect(filtered[0].resolution).toBe('1080p')
      expect(filtered.some((s) => s.sizeFormatted === '0.00 MB' || s.rawTitle.includes('SIZE 0 MB'))).toBe(false)
    })
  })

  // ----------------------------------------------------
  // 1.6 Multi-Criteria Sorter Chain
  // ----------------------------------------------------
  describe('1.6 Multi-Criteria Sorter Chain', () => {
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

      // 1. In Order
      const inOrder = StreamSorter.sort([s2_a, s1_a, s2_b, s1_b], 'in_order', sourceOrder)
      expect(inOrder[0].sourceId).toBe('source1')
      expect(inOrder[1].sourceId).toBe('source1')
      expect(inOrder[2].sourceId).toBe('source2')
      expect(inOrder[3].sourceId).toBe('source2')

      // 2. Interleaved
      const interleaved = StreamSorter.sort([s1_a, s1_b, s2_a, s2_b], 'interleaved', sourceOrder)
      expect(interleaved[0].sourceId).toBe('source1')
      expect(interleaved[1].sourceId).toBe('source2')
      expect(interleaved[2].sourceId).toBe('source1')
      expect(interleaved[3].sourceId).toBe('source2')

      // 3. Priority
      const priority = StreamSorter.sort([s1_b, s1_a, s2_b, s2_a], 'priority', sourceOrder)
      expect(priority[0].resolution).toBe('2160p')
      expect(priority[1].resolution).toBe('1080p')
      expect(priority[3].resolution).toBe('720p')
    })

    it('orders by dynamic custom sort criteria (visualTag before resolution)', () => {
      const s1080p_DV = StreamParser.parse(
        { name: 'S', title: 'Movie.1080p.DV.HDR.mkv' },
        's',
        'S'
      )
      const s4k_SDR = StreamParser.parse(
        { name: 'S', title: 'Movie.2160p.SDR.mkv' },
        's',
        'S'
      )

      // When visualTag is prioritized over resolution
      const sorted = StreamSorter.sort(
        [s4k_SDR, s1080p_DV],
        'priority',
        [],
        [],
        ['visualTag', 'resolution']
      )

      expect(sorted[0].visualTags).toContain('DV')
      expect(sorted[0].resolution).toBe('1080p')
    })
  })

  // ----------------------------------------------------
  // 1.7 Stream Protocol Routing
  // ----------------------------------------------------
  describe('1.7 Stream Protocol Routing', () => {
    it('serves Stremio stream protocol endpoint /api/catalogs/:profileId/stream/:type/:id.json and /api/catalogs/stream/:type/:id', async () => {
      const app = new Hono()
      app.route('/api/catalogs', catalogsRouter)

      // Standalone route
      const resDisabled = await app.request('/api/catalogs/stream/movie/tt0137523.json')
      expect(resDisabled.status).toBe(200)
      const jsonDisabled = await resDisabled.json()
      expect(Array.isArray(jsonDisabled.streams)).toBe(true)

      // Profile stream route
      const resProfile = await app.request('/api/catalogs/default/stream/movie/tt0137523.json')
      expect(resProfile.status).toBe(200)
      const jsonProfile = await resProfile.json()
      expect(Array.isArray(jsonProfile.streams)).toBe(true)

      // Aggregator call with configured sources
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

      expect(Array.isArray(streams)).toBe(true)
    }, 15000)
  })
})
