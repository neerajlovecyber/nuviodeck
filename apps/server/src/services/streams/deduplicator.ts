import { ParsedStreamMetadata } from './types'

const QUALITY_SCORE: Record<string, number> = {
  'BluRay REMUX': 60,
  BluRay: 50,
  'WEB-DL': 40,
  WEBRip: 30,
  HDTV: 20,
  DVDRip: 10,
  Unknown: 0,
}

const RES_SCORE: Record<string, number> = {
  '2160p': 60,
  '1440p': 50,
  '1080p': 40,
  '720p': 30,
  '576p': 20,
  '480p': 10,
  unknown: 0,
}

export class StreamDeduplicator {
  /**
   * Deduplicates streams based on user-defined stream source priority order:
   * "Checked in this order. When two sources offer the same file, the higher one wins."
   * Also merges languages/metadata and resolves higher-quality streams when duplicates occur.
   */
  static deduplicate(
    streams: ParsedStreamMetadata[],
    sourceOrder: string[] = []
  ): ParsedStreamMetadata[] {
    const sourceRank = new Map<string, number>()
    sourceOrder.forEach((id, index) => sourceRank.set(id, index))

    // Map release signature / hash to canonical stream
    const canonicalMap = new Map<string, ParsedStreamMetadata>()
    const canonicalKeys: string[] = []

    for (const stream of streams) {
      const hashKey = stream.infoHash ? `hash:${stream.infoHash.toLowerCase()}` : null
      const sigKey = this.buildReleaseSignature(stream)

      const key = hashKey || sigKey || `id:${stream.id}`
      const existing = canonicalMap.get(key)

      if (!existing) {
        canonicalMap.set(key, { ...stream })
        canonicalKeys.push(key)
      } else {
        // Compare existing vs new candidate
        const rankExisting = sourceRank.get(existing.sourceId) ?? 999
        const rankNew = sourceRank.get(stream.sourceId) ?? 999

        const qExisting = (RES_SCORE[existing.resolution] || 0) + (QUALITY_SCORE[existing.quality] || 0)
        const qNew = (RES_SCORE[stream.resolution] || 0) + (QUALITY_SCORE[stream.quality] || 0)

        const newWins =
          rankNew < rankExisting ||
          (rankNew === rankExisting && qNew > qExisting) ||
          (rankNew === rankExisting && !existing.cached && stream.cached)

        // Tiered metadata merge: merge unique languages, visual tags, audio tags
        const mergedLanguages = Array.from(
          new Set([...(existing.languages || []), ...(stream.languages || [])])
        )
        const mergedEmojis = Array.from(
          new Set([...(existing.languageEmojis || []), ...(stream.languageEmojis || [])])
        )
        const mergedVisuals = Array.from(
          new Set([...(existing.visualTags || []), ...(stream.visualTags || [])])
        )
        const mergedAudio = Array.from(
          new Set([...(existing.audioTags || []), ...(stream.audioTags || [])])
        )

        const winner = newWins ? { ...stream } : { ...existing }
        winner.languages = mergedLanguages
        winner.languageEmojis = mergedEmojis
        winner.visualTags = mergedVisuals
        winner.audioTags = mergedAudio

        // Merge SeaDex flags: if EITHER copy has the flag, the winner keeps it
        if (existing.seadex || stream.seadex) winner.seadex = true
        if (existing.seadexBest || stream.seadexBest) winner.seadexBest = true

        // Merge quality: prefer the more specific (non-Unknown) quality
        if (winner.quality === 'Unknown' && (existing.quality !== 'Unknown' || stream.quality !== 'Unknown')) {
          winner.quality = (existing.quality !== 'Unknown' ? existing.quality : stream.quality)
        }

        // Merge message: prefer the one with SeaDex/release info
        if (!winner.message && (existing.message || stream.message)) {
          winner.message = existing.message || stream.message
        }

        if (!winner.indexer && (existing.indexer || stream.indexer)) {
          winner.indexer = existing.indexer || stream.indexer
        }
        if (!winner.releaseGroup && (existing.releaseGroup || stream.releaseGroup)) {
          winner.releaseGroup = existing.releaseGroup || stream.releaseGroup
        }

        canonicalMap.set(key, winner)
      }
    }

    return canonicalKeys.map((k) => canonicalMap.get(k)!)
  }

  private static buildReleaseSignature(stream: ParsedStreamMetadata): string | null {
    const cleanTitle = (stream.filename || stream.title || stream.rawTitle || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 30)

    if (!cleanTitle) return null

    const sizeBucket = stream.sizeBytes
      ? Math.round(stream.sizeBytes / (1024 * 1024 * 50)) // 50MB buckets
      : 'nosize'

    const seasonEp =
      stream.season !== undefined && stream.episode !== undefined
        ? `s${stream.season}e${stream.episode}`
        : 'movie'

    return `sig:${cleanTitle}:${seasonEp}:${stream.resolution}:${stream.releaseGroup || 'nogroup'}:${sizeBucket}`
  }
}
