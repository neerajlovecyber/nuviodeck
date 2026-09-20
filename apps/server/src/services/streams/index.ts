import {
  ParsedStreamMetadata,
  StremioStream,
  StreamsProfileConfig,
} from './types'
import { StreamAdapters } from './adapters'
import { StreamDeduplicator } from './deduplicator'
import { StreamFilterer } from './filterer'
import { StreamSorter } from './sorter'
import { StreamFormatter } from './formatter'

interface CachedStreamResult {
  timestamp: number
  streams: StremioStream[]
}

export class StreamAggregatorService {
  // In-memory cache for fast repeat requests (15-minute TTL)
  private cache = new Map<string, CachedStreamResult>()
  private maxCacheSize = 500
  private cacheTtlMs = 15 * 60 * 1000

  async getStreams(
    type: string,
    id: string,
    profileConfig: StreamsProfileConfig,
    cacheKey?: string
  ): Promise<StremioStream[]> {
    if (!profileConfig.enabled) {
      return []
    }

    const enabledSources = (profileConfig.sources || []).filter((s) => s.enabled)
    if (enabledSources.length === 0) {
      return []
    }

    // 1. Check in-memory cache
    const key = cacheKey ? `${cacheKey}:${type}:${id}` : `${type}:${id}`
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
      return cached.streams
    }

    // 2. Parallel source dispatch with strict 3.5s timeout
    const sourceOrder = enabledSources.map((s) => s.id)
    const fetchPromises = enabledSources.map((source) =>
      StreamAdapters.fetchFromSource(
        source,
        type,
        id,
        profileConfig.debridKeys,
        3500
      )
    )

    const settled = await Promise.allSettled(fetchPromises)
    const allParsed: ParsedStreamMetadata[] = []

    for (const res of settled) {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        allParsed.push(...res.value)
      }
    }

    if (allParsed.length === 0) {
      return []
    }

    // 3. Deduplication ("When two sources offer the same file, the higher one wins")
    const deduped = StreamDeduplicator.deduplicate(allParsed, sourceOrder)

    // 4. Filtering & Limits (CAM/TS/SCR hidden by default, mostPerResolution = 10, etc.)
    const filtered = StreamFilterer.filter(deduped, profileConfig.filters)

    // 5. Merge Strategy & Sorter (in_order, interleaved, or priority)
    const sorted = StreamSorter.sort(
      filtered,
      profileConfig.mergeStrategy || 'priority',
      sourceOrder,
      profileConfig.filters?.preferredLanguages
    )

    // 6. Formatter Engine (Prism, Xperience, StreamSense, etc.)
    const formattedStreams = sorted.map((s) =>
      StreamFormatter.format(s, profileConfig.formatter)
    )

    // 7. Save into in-memory cache
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) this.cache.delete(firstKey)
    }
    this.cache.set(key, { timestamp: Date.now(), streams: formattedStreams })

    return formattedStreams
  }

  clearCache(): void {
    this.cache.clear()
  }
}

export const streamAggregatorService = new StreamAggregatorService()
