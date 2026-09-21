import {
  ParsedStreamMetadata,
  StremioStream,
  StreamsProfileConfig,
} from './types'
import { StreamAdapters } from './adapters'
import { StreamParser } from './parser'
import { StreamDeduplicator } from './deduplicator'
import { StreamFilterer } from './filterer'
import { StreamSorter } from './sorter'
import { StreamFormatter } from './formatter'
import { StreamProxyService } from './proxy'
import { idResolverService } from '../metadata/id-resolver'
import { config } from '../../config'

interface CachedStreamResult {
  timestamp: number
  streams: StremioStream[]
  ttl?: number
}

export class StreamAggregatorService {
  // In-memory cache for fast repeat requests (15-minute TTL for full results, 30s for partials)
  private cache = new Map<string, CachedStreamResult>()
  private maxCacheSize = 500
  private cacheTtlMs = 15 * 60 * 1000

  async getStreams(
    type: string,
    id: string,
    profileConfig: StreamsProfileConfig,
    cacheKey?: string,
    forceRefresh?: boolean
  ): Promise<StremioStream[]> {
    if (!profileConfig.enabled) {
      return []
    }

    const enabledSources = (profileConfig.sources || []).filter((s) => s.enabled)
    if (enabledSources.length === 0) {
      return []
    }

    // 1. Resolve media ID to canonical format (e.g. tmdb:687163 -> tt12042730)
    let queryId = id
    try {
      const resolved = await idResolverService.resolve(id, type as any)
      if (resolved.streamQueryId) {
        queryId = resolved.streamQueryId
      }
    } catch {
      // Fallback to original id
    }

    // Merge debrid keys with environment fallback
    const mergedDebridKeys: Record<string, string> = {
      torbox: profileConfig.debridKeys?.torbox || config.debrid.torboxApiKey || '',
      realdebrid: profileConfig.debridKeys?.realdebrid || config.debrid.realDebridApiKey || '',
      alldebrid: profileConfig.debridKeys?.alldebrid || config.debrid.allDebridApiKey || '',
      premiumize: profileConfig.debridKeys?.premiumize || config.debrid.premiumizeApiKey || '',
      debridlink: profileConfig.debridKeys?.debridlink || config.debrid.debridLinkApiKey || '',
    }

    // 2. Check in-memory cache (unless forceRefresh is requested)
    const key = cacheKey ? `${cacheKey}:${type}:${queryId}` : `${type}:${queryId}`
    if (!forceRefresh) {
      const cached = this.cache.get(key)
      const effectiveTtl = cached?.ttl || this.cacheTtlMs
      if (cached && Date.now() - cached.timestamp < effectiveTtl) {
        return cached.streams
      }
    }

    // 3. Parallel source dispatch with configurable timeout (default 7s)
    const timeoutMs = profileConfig.timeoutMs || 7000
    const sourceOrder = enabledSources.map((s) => s.id)
    const fetchPromises = enabledSources.map((source) =>
      StreamAdapters.fetchFromSource(
        source,
        type,
        queryId,
        mergedDebridKeys,
        timeoutMs
      )
    )

    const settled = await Promise.allSettled(fetchPromises)
    const allParsed: ParsedStreamMetadata[] = []
    let successfulSources = 0
    StreamParser._debugCount = 0 // Reset debug counter for new request

    for (const res of settled) {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        if (res.value.length > 0) {
          successfulSources++
        }
        allParsed.push(...res.value)
      }
    }

    if (allParsed.length === 0) {
      return []
    }

    // 3. Deduplication ("When two sources offer the same file, the higher one wins")
    const deduped = StreamDeduplicator.deduplicate(allParsed, sourceOrder)

    // DEBUG: Trace SeaDex streams through pipeline
    const seaRaw = allParsed.filter(s => s.seadex || s.seadexBest)
    const seaDedup = deduped.filter(s => s.seadex || s.seadexBest)
    if (seaRaw.length > 0 || seaDedup.length > 0) {
      console.log(`[SeaDex Debug] Raw: ${seaRaw.length} seadex streams (${seaRaw.filter(s=>s.seadexBest).length} best)`)
      console.log(`[SeaDex Debug] After dedup: ${seaDedup.length} seadex streams (${seaDedup.filter(s=>s.seadexBest).length} best)`)
      for (const s of seaDedup) {
        console.log(`  → ${s.title} | ${s.resolution} | ${s.quality} | best=${s.seadexBest} | src=${s.sourceName}`)
      }
    }

    // 4. Hard Filtering (CAM/TS/SCR hidden by default, spam elimination, size limits, excluded codecs/languages, etc.)
    const filtered = StreamFilterer.filter(deduped, {
      ...profileConfig.filters,
      mostPerResolution: 0,
      maxPerService: 0,
    })

    const seaFiltered = filtered.filter(s => s.seadex || s.seadexBest)
    if (seaDedup.length > 0 && seaFiltered.length !== seaDedup.length) {
      console.log(`[SeaDex Debug] After filter: ${seaFiltered.length} seadex streams (lost ${seaDedup.length - seaFiltered.length} during filtering!)`)
    }

    // 5. Merge Strategy & Sorter (in_order, interleaved, or priority)
    const sorted = StreamSorter.sort(
      filtered,
      profileConfig.mergeStrategy || 'priority',
      sourceOrder,
      profileConfig.filters?.preferredLanguages,
      profileConfig.sortCriteria || profileConfig.filters?.sortCriteria
    )

    // 6. Quotas & Limits (Apply mostPerResolution and maxPerService on the sorted stream list so top 5-star releases are preserved)
    const capped = StreamFilterer.applyQuotas(sorted, profileConfig.filters)

    // 7. Formatter Engine (Prism, Nuvio Deck, StreamSense, Tamtaro, etc.)
    const formattedStreams = capped.map((s) =>
      StreamFormatter.format(s, profileConfig.formatter)
    )

    // 7. Proxy Engine (MediaFlow / StremThru URL rewriting)
    const finalStreams = await StreamProxyService.proxyStreams(
      formattedStreams,
      profileConfig.proxy
    )

    // 8. Save into in-memory cache
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) this.cache.delete(firstKey)
    }

    // If only partial sources responded, cache for only 30s so a reload will re-query all sources
    const ttl = successfulSources < enabledSources.length ? 30 * 1000 : this.cacheTtlMs
    this.cache.set(key, { timestamp: Date.now(), streams: finalStreams, ttl })

    return finalStreams
  }

  clearCache(): void {
    this.cache.clear()
  }
}

export const streamAggregatorService = new StreamAggregatorService()
