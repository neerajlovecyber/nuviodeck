import { config } from '../config'

interface LogoItem {
  url: string
  lang: string
  aspect_ratio?: number
  vote_average?: number
  source: 'tmdb' | 'fanart'
}

const TARGET_ASPECT_RATIO = 4.0
const logoCache = new Map<string, { url: string; expires: number }>()
const LOGO_TTL = 24 * 60 * 60 * 1000 // 24 hours

function pickLogo(logos: LogoItem[], language: string = 'en', originalLanguage?: string): string {
  if (!logos.length) return ''

  const fullLang = language.toLowerCase()
  const baseLang = language.split('-')[0].toLowerCase()

  const scored = logos.map((logo) => {
    let score = 0
    const lLang = (logo.lang || '').toLowerCase()

    if (lLang === fullLang) score = 4
    else if (lLang.startsWith(baseLang + '-')) score = 3
    else if (lLang === baseLang) score = 2
    else if (lLang === 'en' || lLang.startsWith('en-')) score = 1
    else if (originalLanguage && lLang.startsWith(originalLanguage.toLowerCase())) score = 0.5

    const diff = logo.aspect_ratio ? Math.abs(logo.aspect_ratio - TARGET_ASPECT_RATIO) : 999

    return {
      logo,
      score,
      diff,
      votes: logo.vote_average || 0,
    }
  })

  scored.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score
    if (a.diff !== b.diff) return a.diff - b.diff
    return b.votes - a.votes
  })

  return scored[0]?.logo.url || ''
}

export async function getMediaLogo(
  type: 'movie' | 'tv' | 'series',
  tmdbId: number,
  language: string = 'en',
  originalLanguage?: string,
  tmdbKey?: string,
  proxyUrl?: string
): Promise<string> {
  const cacheKey = `${type}:${tmdbId}:${language}`
  const cached = logoCache.get(cacheKey)
  if (cached && cached.expires > Date.now()) {
    return cached.url
  }

  try {
    const key = tmdbKey || config.tmdb.apiToken || config.tmdb.apiKey
    const baseUrl = proxyUrl || config.tmdb.baseUrl
    const isToken = key.length > 50

    const headers: Record<string, string> = {
      'Accept': 'application/json',
    }
    if (isToken) {
      headers['Authorization'] = `Bearer ${key}`
    }

    const endpointType = type === 'movie' ? 'movie' : 'tv'
    const url = new URL(`${baseUrl}/${endpointType}/${tmdbId}/images`)
    if (!isToken && key) {
      url.searchParams.set('api_key', key)
    }

    const res = await fetch(url.toString(), { headers })
    if (!res.ok) {
      logoCache.set(cacheKey, { url: '', expires: Date.now() + 60 * 60 * 1000 })
      return ''
    }

    const data = await res.json()
    const logosRaw: any[] = data.logos || []

    const logos: LogoItem[] = logosRaw.map((l) => ({
      url: `https://image.tmdb.org/t/p/original${l.file_path}`,
      lang: l.iso_639_1 ? `${l.iso_639_1}${l.iso_3166_1 ? '-' + l.iso_3166_1 : ''}` : 'en',
      aspect_ratio: l.aspect_ratio,
      vote_average: l.vote_average,
      source: 'tmdb',
    }))

    const bestLogo = pickLogo(logos, language, originalLanguage)
    logoCache.set(cacheKey, { url: bestLogo, expires: Date.now() + LOGO_TTL })
    return bestLogo
  } catch (err) {
    console.error(`Error fetching logo for ${type} ${tmdbId}:`, err)
    return ''
  }
}
