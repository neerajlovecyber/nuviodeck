import { ParsedStreamMetadata } from './types'

export class StreamDeduplicator {
  /**
   * Deduplicates streams based on user-defined stream source priority order:
   * "Checked in this order. When two sources offer the same file, the higher one wins."
   */
  static deduplicate(
    streams: ParsedStreamMetadata[],
    sourceOrder: string[]
  ): ParsedStreamMetadata[] {
    const sourceRank = new Map<string, number>()
    sourceOrder.forEach((id, index) => sourceRank.set(id, index))

    // Sort initially by source priority order so higher source is inspected first
    const sorted = [...streams].sort((a, b) => {
      const rankA = sourceRank.get(a.sourceId) ?? 999
      const rankB = sourceRank.get(b.sourceId) ?? 999
      return rankA - rankB
    })

    const seenInfoHashes = new Set<string>()
    const seenSignatures = new Set<string>()
    const uniqueStreams: ParsedStreamMetadata[] = []

    for (const stream of sorted) {
      // 1. Exact infoHash match
      if (stream.infoHash) {
        const hash = stream.infoHash.toLowerCase()
        if (seenInfoHashes.has(hash)) {
          continue // Duplicate from lower-ranked source skipped
        }
        seenInfoHashes.add(hash)
      }

      // 2. Structural release signature match
      const signature = this.buildReleaseSignature(stream)
      if (signature) {
        if (seenSignatures.has(signature)) {
          continue // Duplicate release skipped
        }
        seenSignatures.add(signature)
      }

      uniqueStreams.push(stream)
    }

    return uniqueStreams
  }

  private static buildReleaseSignature(stream: ParsedStreamMetadata): string | null {
    // If we have release group, resolution, and title/filename
    const cleanTitle = (stream.filename || stream.title || stream.rawTitle)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 30)

    if (!cleanTitle) return null

    const sizeBucket = stream.sizeBytes
      ? Math.round(stream.sizeBytes / (1024 * 1024 * 50)) // 50MB buckets
      : 'nosize'

    const seasonEp = stream.season !== undefined && stream.episode !== undefined
      ? `s${stream.season}e${stream.episode}`
      : 'movie'

    return `${cleanTitle}:${seasonEp}:${stream.resolution}:${stream.releaseGroup || 'nogroup'}:${sizeBucket}`
  }
}
