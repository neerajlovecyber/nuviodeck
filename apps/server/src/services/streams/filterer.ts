import { ParsedStreamMetadata, StreamFilterOptions } from './types'

export class StreamFilterer {
  /**
   * Filters streams based on user profile rules with sane defaults:
   * - Cams/telesync/screener rips hidden by default
   * - Most per resolution limit (default 10) prevents 4K from crowding out 1080p
   * - Language, picture, and codec exclusions
   */
  static filter(
    streams: ParsedStreamMetadata[],
    options?: StreamFilterOptions
  ): ParsedStreamMetadata[] {
    const mostPerResolution = options?.mostPerResolution ?? 10
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
    const filtered: ParsedStreamMetadata[] = []

    for (const stream of streams) {
      // 1. Excluded Qualities (e.g. CAM, TS, SCR)
      if (stream.quality && excludedQualities.has(stream.quality.toUpperCase())) {
        continue
      }

      // 2. Excluded Languages
      if (stream.languages.length > 0) {
        const hasExcludedLanguage = stream.languages.some((l) =>
          excludedLanguages.has(l.toLowerCase())
        )
        if (hasExcludedLanguage) continue
      }

      // 3. Excluded Picture / Visual Tags
      if (stream.visualTags.length > 0) {
        const hasExcludedVisualTag = stream.visualTags.some((tag) =>
          excludedPicture.has(tag.toUpperCase())
        )
        if (hasExcludedVisualTag) continue
      }

      // 4. Excluded Codecs
      if (stream.codecs.length > 0) {
        const hasExcludedCodec = stream.codecs.some((c) =>
          excludedCodecs.has(c.toUpperCase())
        )
        if (hasExcludedCodec) continue
      }

      // 5. Most per resolution cap
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
}
