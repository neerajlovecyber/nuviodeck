import { ParsedStreamMetadata, StreamFilterOptions } from './types'

export class StreamFilterer {
  private static readonly PRE_DIGITAL_QUALITIES = new Set([
    'CAM', 'TS', 'TELESYNC', 'HDTS', 'HDCAM', 'TC', 'TELE-SYNC', 'SCR', 'SCREENER', 'R5', 'DVDSCR', 'WORKPRINT'
  ])

  private static readonly DEFAULT_SPAM_REGEX = /\b(sample|trailer|featurette|bonus\.disc|password\.txt|\.rar\b|\.zip\b|\.exe\b)\b/i

  /**
   * Filters streams based on user profile rules & anti-trash heuristics:
   * - Cams/telesync/screener rips hidden by default or via excludePreDigital
   * - Spam/sample file elimination (samples, trailers, passworded archives)
   * - Blocklisted infoHashes and release groups
   * - Excluded keywords & user filters
   * - File size limits (min/max GB for movies and series)
   * - Min seeders for uncached torrents
   * - Cached-only filter for instant Debrid playback
   * - Mismatched title exclusion
   * - Language, picture tags, and video codec exclusions
   * - Quotas: most per resolution (default 10) & max per service
   */
  static filter(
    streams: ParsedStreamMetadata[],
    options?: StreamFilterOptions
  ): ParsedStreamMetadata[] {
    const mostPerResolution = options?.mostPerResolution ?? 10
    const maxPerService = options?.maxPerService ?? 0
    const cachedOnly = options?.cachedOnly ?? false
    const minSeeders = options?.minSeeders ?? 0
    const excludePreDigital = options?.excludePreDigital ?? false
    const excludeMismatched = options?.excludeMismatchedTitles ?? false
    const targetTitle = options?.targetTitle ? this.normalizeTitle(options.targetTitle) : ''
    const mediaType = options?.mediaType || 'movie'
    const excludeZeroSize = options?.excludeZeroSize ?? true
    const allowUnknownResolution = options?.allowUnknownResolution ?? true
    const allowUnknownQuality = options?.allowUnknownQuality ?? true

    const excludedQualities = new Set(
      (options?.excludedQualities || ['CAM', 'TS', 'SCR']).map((q) => q.toUpperCase())
    )
    const excludedLanguages = new Set(
      (options?.excludedLanguages || []).map((l) => l.toLowerCase())
    )
    const excludedPicture = new Set(
      (options?.excludedPicture || []).map((p) => p.toUpperCase())
    )
    const excludedCodecs = new Set(
      (options?.excludedCodecs || []).map((c) => c.toUpperCase())
    )
    const excludedReleaseGroups = new Set(
      (options?.excludedReleaseGroups || []).map((g) => g.toLowerCase().trim())
    )
    const excludedKeywords = (options?.excludedKeywords || []).map((k) => k.toLowerCase().trim())
    const blocklistHashes = new Set(
      (options?.blocklistHashes || []).map((h) => h.toLowerCase().trim())
    )

    const sizeLimits = options?.sizeLimits
    const minGb = mediaType === 'movie' ? (sizeLimits?.movieMinGb || 0) : (sizeLimits?.seriesMinGb || 0)
    const maxGb = mediaType === 'movie' ? (sizeLimits?.movieMaxGb || 0) : (sizeLimits?.seriesMaxGb || 0)

    const resolutionCounts = new Map<string, number>()
    const serviceCounts = new Map<string, number>()
    const filtered: ParsedStreamMetadata[] = []

    for (const stream of streams) {
      const fullTitle = `${stream.title || ''} ${stream.filename || ''} ${stream.rawTitle || ''}`

      // 0. Zero Size / Dead Placeholder Link Filter
      if (excludeZeroSize && stream.type !== 'live' && stream.type !== 'youtube') {
        if (stream.sizeBytes !== undefined && stream.sizeBytes <= 0) {
          continue
        }
        if (stream.sizeFormatted && (stream.sizeFormatted.startsWith('0.00') || stream.sizeFormatted === '0 MB' || stream.sizeFormatted === '0.00 MB' || stream.sizeFormatted === '0 B')) {
          continue
        }
        // Dead dummy stream with no resolution, no quality, not cached, and no valid size
        if (stream.resolution === 'unknown' && stream.quality === 'Unknown' && !stream.cached && (!stream.sizeBytes || stream.sizeBytes <= 0)) {
          continue
        }
      }

      // 0b. Unknown Resolution / Quality gate
      if (!allowUnknownResolution && stream.resolution === 'unknown') {
        continue
      }
      if (!allowUnknownQuality && stream.quality === 'Unknown') {
        continue
      }

      // 1. InfoHash Blocklist Filter
      if (stream.infoHash && blocklistHashes.has(stream.infoHash.toLowerCase())) {
        continue
      }

      // 2. Cached Only Filter
      if (cachedOnly && !stream.cached) {
        continue
      }

      // 3. Min Seeders for uncached P2P streams
      if (!stream.cached && minSeeders > 0 && (stream.seeders === undefined || stream.seeders < minSeeders)) {
        continue
      }

      // 4. Default Spam / Sample / Corrupt Payload Elimination
      if (this.DEFAULT_SPAM_REGEX.test(fullTitle)) {
        continue
      }

      // 5. Pre-Digital / CAM Filters
      const qUpper = (stream.quality || '').toUpperCase()
      if (excludePreDigital && (this.PRE_DIGITAL_QUALITIES.has(qUpper) || this.hasPreDigitalKeywords(fullTitle))) {
        continue
      }

      // 6. Excluded Qualities (e.g. CAM, TS, SCR)
      if (stream.quality && excludedQualities.has(qUpper)) {
        continue
      }

      // 7. Excluded Release Groups
      if (stream.releaseGroup && excludedReleaseGroups.has(stream.releaseGroup.toLowerCase())) {
        continue
      }

      // 8. Excluded Keywords
      if (excludedKeywords.length > 0) {
        const lowerTitle = fullTitle.toLowerCase()
        const hasExcludedKeyword = excludedKeywords.some((kw) => lowerTitle.includes(kw))
        if (hasExcludedKeyword) continue
      }

      // 9. File Size Threshold Limits (Min/Max GB)
      if (stream.sizeBytes && stream.sizeBytes > 0) {
        const sizeGb = stream.sizeBytes / (1024 * 1024 * 1024)
        if (minGb > 0 && sizeGb < minGb) {
          continue
        }
        if (maxGb > 0 && sizeGb > maxGb) {
          continue
        }
      }

      // 10. Exclude Mismatched Titles
      if (excludeMismatched && targetTitle) {
        const streamTitleNorm = this.normalizeTitle(stream.title || stream.filename || stream.rawTitle)
        if (streamTitleNorm && !this.isTitleMatch(targetTitle, streamTitleNorm)) {
          continue
        }
      }

      // 11. Excluded Languages
      if (stream.languages.length > 0) {
        const hasExcludedLanguage = stream.languages.some((l) =>
          excludedLanguages.has(l.toLowerCase())
        )
        if (hasExcludedLanguage) continue
      }

      // 12. Excluded Picture / Visual Tags
      if (stream.visualTags.length > 0) {
        const hasExcludedVisualTag = stream.visualTags.some((tag) =>
          excludedPicture.has(tag.toUpperCase())
        )
        if (hasExcludedVisualTag) continue
      }

      // 13. Excluded Codecs
      if (stream.codecs.length > 0) {
        const hasExcludedCodec = stream.codecs.some((c) =>
          excludedCodecs.has(c.toUpperCase())
        )
        if (hasExcludedCodec) continue
      }

      // 14. Max per service cap (e.g. max 5 per Real-Debrid / TorBox)
      if (maxPerService > 0) {
        const sKey = stream.debridService || stream.sourceName || 'unknown'
        const currentServiceCount = serviceCounts.get(sKey) || 0
        if (currentServiceCount >= maxPerService) {
          continue
        }
        serviceCounts.set(sKey, currentServiceCount + 1)
      }

      // 15. Most per resolution cap
      if (mostPerResolution > 0) {
        const resKey = stream.resolution || 'unknown'
        const currentCount = resolutionCounts.get(resKey) || 0
        if (currentCount >= mostPerResolution) {
          continue
        }
        resolutionCounts.set(resKey, currentCount + 1)
      }

      filtered.push(stream)
    }

    return filtered
  }

  private static hasPreDigitalKeywords(title: string): boolean {
    const upper = title.toUpperCase()
    return (
      upper.includes('HDCAM') ||
      upper.includes('HDTS') ||
      upper.includes('TELESYNC') ||
      upper.includes('DVDSCR') ||
      upper.includes('WORKPRINT')
    )
  }

  private static normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[._\-+:]/g, ' ')
      .replace(/[^a-z0-9 ]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  private static isTitleMatch(target: string, streamTitle: string): boolean {
    if (streamTitle.includes(target)) return true
    const targetWords = target.split(' ').filter((w) => w.length > 2)
    if (targetWords.length === 0) return true
    const matches = targetWords.filter((word) => streamTitle.includes(word))
    return matches.length / targetWords.length >= 0.75
  }
}
