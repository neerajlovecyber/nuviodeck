import { ParsedStreamMetadata, StreamFilterOptions } from './types'

export class StreamFilterer {
  private static readonly PRE_DIGITAL_QUALITIES = new Set([
    'CAM', 'TS', 'TELESYNC', 'HDTS', 'HDCAM', 'TC', 'TELE-SYNC', 'SCR', 'SCREENER', 'R5', 'DVDSCR', 'WORKPRINT'
  ])

  /**
   * Filters streams based on user profile rules with sane defaults:
   * - Cams/telesync/screener rips hidden by default or via excludePreDigital
   * - Most per resolution limit (default 10) prevents 4K from crowding out 1080p
   * - Max per service limit to prevent one service dominating results
   * - Cached-only filter
   * - Mismatched title exclusion
   * - Language, picture, and codec exclusions
   */
  static filter(
    streams: ParsedStreamMetadata[],
    options?: StreamFilterOptions
  ): ParsedStreamMetadata[] {
    const mostPerResolution = options?.mostPerResolution ?? 10
    const maxPerService = options?.maxPerService ?? 0
    const cachedOnly = options?.cachedOnly ?? false
    const excludePreDigital = options?.excludePreDigital ?? false
    const excludeMismatched = options?.excludeMismatchedTitles ?? false
    const targetTitle = options?.targetTitle ? this.normalizeTitle(options.targetTitle) : ''

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

    const resolutionCounts = new Map<string, number>()
    const serviceCounts = new Map<string, number>()
    const filtered: ParsedStreamMetadata[] = []

    for (const stream of streams) {
      // 1. Cached Only Filter
      if (cachedOnly && !stream.cached) {
        continue
      }

      // 2. Pre-Digital / Cam Filters
      const qUpper = (stream.quality || '').toUpperCase()
      if (excludePreDigital && (this.PRE_DIGITAL_QUALITIES.has(qUpper) || this.hasPreDigitalKeywords(stream.filename || stream.rawTitle))) {
        continue
      }

      // 3. Excluded Qualities (e.g. CAM, TS, SCR)
      if (stream.quality && excludedQualities.has(qUpper)) {
        continue
      }

      // 4. Exclude Mismatched Titles
      if (excludeMismatched && targetTitle) {
        const streamTitleNorm = this.normalizeTitle(stream.title || stream.filename || stream.rawTitle)
        if (streamTitleNorm && !this.isTitleMatch(targetTitle, streamTitleNorm)) {
          continue
        }
      }

      // 5. Excluded Languages
      if (stream.languages.length > 0) {
        const hasExcludedLanguage = stream.languages.some((l) =>
          excludedLanguages.has(l.toLowerCase())
        )
        if (hasExcludedLanguage) continue
      }

      // 6. Excluded Picture / Visual Tags
      if (stream.visualTags.length > 0) {
        const hasExcludedVisualTag = stream.visualTags.some((tag) =>
          excludedPicture.has(tag.toUpperCase())
        )
        if (hasExcludedVisualTag) continue
      }

      // 7. Excluded Codecs
      if (stream.codecs.length > 0) {
        const hasExcludedCodec = stream.codecs.some((c) =>
          excludedCodecs.has(c.toUpperCase())
        )
        if (hasExcludedCodec) continue
      }

      // 8. Max per service cap (e.g. max 5 per Real-Debrid / TorBox)
      if (maxPerService > 0) {
        const sKey = stream.debridService || stream.sourceName || 'unknown'
        const currentServiceCount = serviceCounts.get(sKey) || 0
        if (currentServiceCount >= maxPerService) {
          continue
        }
        serviceCounts.set(sKey, currentServiceCount + 1)
      }

      // 9. Most per resolution cap
      if (mostPerResolution > 0) {
        const resKey = stream.resolution || 'unknown'
        const currentCount = resolutionCounts.get(resKey) || 0
        if (currentCount >= mostPerResolution) {
          continue // Exceeded resolution quota, skip to allow lower resolutions to appear
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
