import { ParsedStreamMetadata, StremioStream, StreamSourceConfig } from './types'
import { StreamParser } from './parser'

const DEFAULT_COMET_URL = 'https://comet.elfhosted.com'
const DEFAULT_STREMTHRU_URL = 'https://stremthru.elfhosted.com'
const DEFAULT_MEDIAFUSION_URL = 'https://mediafusion.elfhosted.com'

export class StreamAdapters {
  static async fetchFromSource(
    source: StreamSourceConfig,
    type: string,
    id: string,
    debridKeys?: Record<string, string>,
    timeoutMs: number = 3500
  ): Promise<ParsedStreamMetadata[]> {
    try {
      switch (source.type) {
        case 'comet':
          return await this.fetchComet(source, type, id, debridKeys, timeoutMs)

        case 'stremthru':
          return await this.fetchStremThru(source, type, id, debridKeys, timeoutMs)

        case 'mediafusion':
          return await this.fetchMediaFusion(source, type, id, debridKeys, timeoutMs)

        case 'custom':
        default:
          return await this.fetchCustom(source, type, id, timeoutMs)
      }
    } catch (err: any) {
      console.warn(`[StreamAdapter] Source "${source.name}" (${source.type}) error:`, err.message)
      return []
    }
  }

  // --- 1. Comet Adapter ---
  private static async fetchComet(
    source: StreamSourceConfig,
    type: string,
    id: string,
    debridKeys?: Record<string, string>,
    timeoutMs: number = 3500
  ): Promise<ParsedStreamMetadata[]> {
    const service = source.debridService || 'torbox'
    const apiKey = debridKeys?.[service] || ''

    const baseUrl = (source.url || DEFAULT_COMET_URL).replace(/\/manifest\.json$/, '').replace(/\/$/, '')

    // Encode Comet config matching reference/aiostreams/packages/core/src/presets/comet.ts
    const configObj = {
      maxResultsPerResolution: 0,
      maxSize: 0,
      cachedOnly: false,
      removeTrash: true,
      resultFormat: ['all'],
      debridServices: [
        {
          service: service === 'realdebrid' ? 'realdebrid' : service,
          apiKey: apiKey,
        },
      ],
      enableTorrent: false,
    }

    const b64 = Buffer.from(JSON.stringify(configObj)).toString('base64url')
    const fetchUrl = `${baseUrl}/${b64}/stream/${type}/${id}.json`

    const streams = await this.fetchStreamJson(fetchUrl, timeoutMs)
    return streams.map((s) => StreamParser.parse(s, source.id, source.name, service))
  }

  // --- 2. StremThru Torz Adapter ---
  private static async fetchStremThru(
    source: StreamSourceConfig,
    type: string,
    id: string,
    debridKeys?: Record<string, string>,
    timeoutMs: number = 3500
  ): Promise<ParsedStreamMetadata[]> {
    const service = source.debridService || 'torbox'
    const apiKey = debridKeys?.[service] || ''

    const baseUrl = (source.url || DEFAULT_STREMTHRU_URL).replace(/\/manifest\.json$/, '').replace(/\/$/, '')

    // StremThru format
    const fetchUrl = `${baseUrl}/stremthru:${service}:${apiKey}/stream/${type}/${id}.json`

    const streams = await this.fetchStreamJson(fetchUrl, timeoutMs)
    return streams.map((s) => StreamParser.parse(s, source.id, source.name, service))
  }

  // --- 3. MediaFusion Adapter ---
  private static async fetchMediaFusion(
    source: StreamSourceConfig,
    type: string,
    id: string,
    debridKeys?: Record<string, string>,
    timeoutMs: number = 3500
  ): Promise<ParsedStreamMetadata[]> {
    const service = source.debridService || 'realdebrid'
    const apiKey = debridKeys?.[service] || ''

    const baseUrl = (source.url || DEFAULT_MEDIAFUSION_URL).replace(/\/manifest\.json$/, '').replace(/\/$/, '')

    const configData = {
      streaming_provider: {
        service: service,
        token: apiKey,
      },
    }
    const b64 = Buffer.from(JSON.stringify(configData)).toString('base64url')
    const fetchUrl = `${baseUrl}/${b64}/stream/${type}/${id}.json`

    const streams = await this.fetchStreamJson(fetchUrl, timeoutMs)
    return streams.map((s) => StreamParser.parse(s, source.id, source.name, service))
  }

  // --- 4. Custom External Addon Adapter ---
  private static async fetchCustom(
    source: StreamSourceConfig,
    type: string,
    id: string,
    timeoutMs: number = 3500
  ): Promise<ParsedStreamMetadata[]> {
    if (!source.url) return []

    const baseUrl = source.url.replace(/\/manifest\.json$/, '').replace(/\/$/, '')
    const fetchUrl = `${baseUrl}/stream/${type}/${id}.json`

    const streams = await this.fetchStreamJson(fetchUrl, timeoutMs)
    return streams.map((s) => StreamParser.parse(s, source.id, source.name, source.debridService))
  }

  // Common fetch with strict timeout
  private static async fetchStreamJson(url: string, timeoutMs: number): Promise<StremioStream[]> {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Nuviodeck-Engine/1.0',
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(timeoutMs),
      })

      if (!res.ok) {
        return []
      }

      const data = (await res.json()) as any
      if (Array.isArray(data?.streams)) {
        return data.streams
      }
      return []
    } catch {
      return []
    }
  }
}
