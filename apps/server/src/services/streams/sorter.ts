import { ParsedStreamMetadata, StreamMergeStrategy, StreamSortCriterion } from './types'

const RESOLUTION_WEIGHT: Record<string, number> = {
  '2160p': 60,
  '1440p': 50,
  '1080p': 40,
  '720p': 30,
  '576p': 20,
  '480p': 10,
  unknown: 0,
}

const QUALITY_WEIGHT: Record<string, number> = {
  'BluRay REMUX': 50,
  BluRay: 40,
  'WEB-DL': 30,
  WEBRip: 25,
  HDTV: 20,
  DVDRip: 15,
  Unknown: 0,
}

const VISUAL_TAG_WEIGHT: Record<string, number> = {
  DV: 50,
  'HDR10+': 45,
  HDR10: 40,
  HDR: 35,
  IMAX: 30,
  '10bit': 20,
  '3D': 10,
}

const AUDIO_TAG_WEIGHT: Record<string, number> = {
  Atmos: 50,
  TrueHD: 45,
  'DTS-HD MA': 40,
  'DTS-HD': 35,
  DTS: 30,
  'DD+': 25,
  FLAC: 20,
  DD: 15,
  AAC: 10,
  Opus: 8,
}

export class StreamSorter {
  static sort(
    streams: ParsedStreamMetadata[],
    strategy: StreamMergeStrategy = 'priority',
    sourceOrder: string[] = [],
    preferredLanguages: string[] = [],
    sortCriteria?: StreamSortCriterion[]
  ): ParsedStreamMetadata[] {
    if (sortCriteria && sortCriteria.length > 0) {
      return this.sortByCustomCriteria(streams, sortCriteria, preferredLanguages)
    }

    switch (strategy) {
      case 'in_order':
        return this.sortInOrder(streams, sourceOrder)

      case 'interleaved':
        return this.sortInterleaved(streams, sourceOrder)

      case 'priority':
      default:
        return this.sortByPriority(streams, preferredLanguages)
    }
  }

  private static sortInOrder(
    streams: ParsedStreamMetadata[],
    sourceOrder: string[]
  ): ParsedStreamMetadata[] {
    const sourceRank = new Map<string, number>()
    sourceOrder.forEach((id, idx) => sourceRank.set(id, idx))

    // Group streams by source, preserving inner quality/resolution sorting
    const bySource = new Map<string, ParsedStreamMetadata[]>()
    for (const s of streams) {
      const list = bySource.get(s.sourceId) || []
      list.push(s)
      bySource.set(s.sourceId, list)
    }

    const result: ParsedStreamMetadata[] = []

    // Take all from source 0, then source 1, etc.
    for (const sourceId of sourceOrder) {
      const list = bySource.get(sourceId)
      if (list && list.length > 0) {
        // Sort each source's streams internally by priority
        const sorted = this.sortByPriority(list)
        result.push(...sorted)
        bySource.delete(sourceId)
      }
    }

    // Append any remaining sources not in sourceOrder
    for (const [, remainingList] of bySource) {
      result.push(...this.sortByPriority(remainingList))
    }

    return result
  }

  private static sortInterleaved(
    streams: ParsedStreamMetadata[],
    sourceOrder: string[]
  ): ParsedStreamMetadata[] {
    // Group streams by source and sort each source internally
    const streamsBySource: ParsedStreamMetadata[][] = []
    const sourceMap = new Map<string, ParsedStreamMetadata[]>()

    for (const s of streams) {
      const list = sourceMap.get(s.sourceId) || []
      list.push(s)
      sourceMap.set(s.sourceId, list)
    }

    for (const sourceId of sourceOrder) {
      const list = sourceMap.get(sourceId)
      if (list && list.length > 0) {
        streamsBySource.push(this.sortByPriority(list))
        sourceMap.delete(sourceId)
      }
    }

    for (const [, remainingList] of sourceMap) {
      streamsBySource.push(this.sortByPriority(remainingList))
    }

    const result: ParsedStreamMetadata[] = []
    const maxLength = Math.max(0, ...streamsBySource.map((arr) => arr.length))

    for (let i = 0; i < maxLength; i++) {
      for (const sourceList of streamsBySource) {
        if (i < sourceList.length) {
          result.push(sourceList[i])
        }
      }
    }

    return result
  }

  private static sortByPriority(
    streams: ParsedStreamMetadata[],
    preferredLanguages: string[] = []
  ): ParsedStreamMetadata[] {
    const langRank = new Map<string, number>()
    preferredLanguages.forEach((lang, idx) => langRank.set(lang.toLowerCase(), idx + 1))

    return [...streams].sort((a, b) => {
      // 0. SeaDex Best/Alt releases float to the top
      const seaA = a.seadexBest ? 2 : a.seadex ? 1 : 0
      const seaB = b.seadexBest ? 2 : b.seadex ? 1 : 0
      if (seaA !== seaB) return seaB - seaA

      // 1. Cached on debrid service first (Ready > Uncached)
      if (a.cached !== b.cached) {
        return a.cached ? -1 : 1
      }

      // 2. Preferred Languages
      if (preferredLanguages.length > 0) {
        const aLangScore = a.languages.reduce((best, l) => {
          const rank = langRank.get(l.toLowerCase()) || 999
          return Math.min(best, rank)
        }, 999)

        const bLangScore = b.languages.reduce((best, l) => {
          const rank = langRank.get(l.toLowerCase()) || 999
          return Math.min(best, rank)
        }, 999)

        if (aLangScore !== bLangScore) {
          return aLangScore - bLangScore
        }
      }

      // 3. Resolution
      const resA = RESOLUTION_WEIGHT[a.resolution] ?? 0
      const resB = RESOLUTION_WEIGHT[b.resolution] ?? 0
      if (resA !== resB) {
        return resB - resA
      }

      // 4. Quality (BluRay REMUX > BluRay > WEB-DL...)
      const qA = QUALITY_WEIGHT[a.quality] ?? 0
      const qB = QUALITY_WEIGHT[b.quality] ?? 0
      if (qA !== qB) {
        return qB - qA
      }

      // 5. Seeders (if torrent) or Size
      if (a.seeders !== undefined && b.seeders !== undefined && a.seeders !== b.seeders) {
        return b.seeders - a.seeders
      }

      if (a.sizeBytes && b.sizeBytes && a.sizeBytes !== b.sizeBytes) {
        return b.sizeBytes - a.sizeBytes
      }

      return 0
    })
  }

  private static sortByCustomCriteria(
    streams: ParsedStreamMetadata[],
    criteria: StreamSortCriterion[],
    preferredLanguages: string[] = []
  ): ParsedStreamMetadata[] {
    const langRank = new Map<string, number>()
    preferredLanguages.forEach((lang, idx) => langRank.set(lang.toLowerCase(), idx + 1))

    return [...streams].sort((a, b) => {
      for (const crit of criteria) {
        let diff = 0
        switch (crit) {
          case 'cached':
            if (a.cached !== b.cached) {
              return a.cached ? -1 : 1
            }
            break

          case 'resolution':
            const resA = RESOLUTION_WEIGHT[a.resolution] ?? 0
            const resB = RESOLUTION_WEIGHT[b.resolution] ?? 0
            diff = resB - resA
            if (diff !== 0) return diff
            break

          case 'visualTag':
            const vScoreA = Math.max(0, ...a.visualTags.map((t) => VISUAL_TAG_WEIGHT[t] || 0))
            const vScoreB = Math.max(0, ...b.visualTags.map((t) => VISUAL_TAG_WEIGHT[t] || 0))
            diff = vScoreB - vScoreA
            if (diff !== 0) return diff
            break

          case 'audioTag':
            const aScoreA = Math.max(0, ...a.audioTags.map((t) => AUDIO_TAG_WEIGHT[t] || 0))
            const aScoreB = Math.max(0, ...b.audioTags.map((t) => AUDIO_TAG_WEIGHT[t] || 0))
            diff = aScoreB - aScoreA
            if (diff !== 0) return diff
            break

          case 'quality':
            const qA = QUALITY_WEIGHT[a.quality] ?? 0
            const qB = QUALITY_WEIGHT[b.quality] ?? 0
            diff = qB - qA
            if (diff !== 0) return diff
            break

          case 'language':
            if (preferredLanguages.length > 0) {
              const aLangScore = a.languages.reduce((best, l) => Math.min(best, langRank.get(l.toLowerCase()) || 999), 999)
              const bLangScore = b.languages.reduce((best, l) => Math.min(best, langRank.get(l.toLowerCase()) || 999), 999)
              diff = aLangScore - bLangScore
              if (diff !== 0) return diff
            }
            break

          case 'size':
            if (a.sizeBytes && b.sizeBytes && a.sizeBytes !== b.sizeBytes) {
              return b.sizeBytes - a.sizeBytes
            }
            break

          case 'seeders':
            if (a.seeders !== undefined && b.seeders !== undefined && a.seeders !== b.seeders) {
              return b.seeders - a.seeders
            }
            break
        }
      }

      return 0
    })
  }
}
