import { StremioStream, StreamProxyConfig } from './types'

export class StreamProxyService {
  /**
   * Applies proxy transformation to an array of Stremio streams based on proxyConfig.
   */
  static async proxyStreams(
    streams: StremioStream[],
    proxyConfig?: StreamProxyConfig
  ): Promise<StremioStream[]> {
    if (!proxyConfig || !proxyConfig.enabled || !proxyConfig.url) {
      return streams
    }

    const cleanBaseUrl = proxyConfig.url.replace(/\/$/, '')

    return streams.map((stream) => {
      // If stream has no direct URL (e.g. infoHash only), skip proxying
      if (!stream.url) {
        return stream
      }

      try {
        if (proxyConfig.id === 'mediaflow') {
          const proxyUrl = new URL(`${cleanBaseUrl}/proxy/stream`)
          proxyUrl.searchParams.set('destination_url', stream.url)
          if (proxyConfig.apiPassword) {
            proxyUrl.searchParams.set('api_password', proxyConfig.apiPassword)
          }

          return {
            ...stream,
            url: proxyUrl.toString(),
            behaviorHints: {
              ...stream.behaviorHints,
              proxyHeaders: {
                ...(stream.behaviorHints?.proxyHeaders || {}),
                'User-Agent': 'NuvioDeck/1.0',
              },
            },
          }
        }

        if (proxyConfig.id === 'stremthru') {
          const proxyUrl = new URL(`${cleanBaseUrl}/v1/proxy`)
          proxyUrl.searchParams.set('url', stream.url)
          if (proxyConfig.apiPassword) {
            proxyUrl.searchParams.set('token', proxyConfig.apiPassword)
          }

          return {
            ...stream,
            url: proxyUrl.toString(),
          }
        }

        // Generic proxy
        const proxyUrl = new URL(cleanBaseUrl)
        proxyUrl.searchParams.set('url', stream.url)
        return {
          ...stream,
          url: proxyUrl.toString(),
        }
      } catch (err) {
        // If URL parsing fails, return original stream safely
        return stream
      }
    })
  }

  /**
   * Generates a single proxied URL for MediaFlow or StremThru.
   */
  static generateProxiedUrl(
    targetUrl: string,
    proxyConfig: StreamProxyConfig
  ): string {
    if (!proxyConfig.enabled || !proxyConfig.url) return targetUrl

    const cleanBaseUrl = proxyConfig.url.replace(/\/$/, '')
    try {
      if (proxyConfig.id === 'mediaflow') {
        const url = new URL(`${cleanBaseUrl}/proxy/stream`)
        url.searchParams.set('destination_url', targetUrl)
        if (proxyConfig.apiPassword) {
          url.searchParams.set('api_password', proxyConfig.apiPassword)
        }
        return url.toString()
      }

      if (proxyConfig.id === 'stremthru') {
        const url = new URL(`${cleanBaseUrl}/v1/proxy`)
        url.searchParams.set('url', targetUrl)
        if (proxyConfig.apiPassword) {
          url.searchParams.set('token', proxyConfig.apiPassword)
        }
        return url.toString()
      }

      const url = new URL(cleanBaseUrl)
      url.searchParams.set('url', targetUrl)
      return url.toString()
    } catch {
      return targetUrl
    }
  }
}
