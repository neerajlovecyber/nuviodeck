/**
 * Subtitles Bridge Engine
 * Reverse-engineered from Xperience bundle chunks B9XFF0MS.js
 */

export interface SubtitleBridgePreferences {
  languages: string[]
  max_results: number
  max_per_language: number
  hearing_impaired: 'show' | 'hide' | 'only'
  label: 'smart' | 'detailed' | 'plain'
  prefer_release_match: boolean
  sort: { key: 'releaseMatch' | 'source' | 'hearingImpaired' | 'downloads'; direction: 'asc' | 'desc' }[]
}

export interface SubtitleAddonConfig {
  id: string
  manifest_url: string
  name: string
  enabled: boolean
  position: number
  id_prefixes?: string[]
}

export interface SubtitleItem {
  id: string
  url: string
  lang: string
  format?: string
  hearingImpaired?: boolean
  downloads?: number
  releaseMatch?: boolean
  source?: string
  releaseGroup?: string
  label?: string
}

export const SUBTITLE_LANGUAGES = [
  'English',
  'Spanish',
  'Spanish (Latin America)',
  'Portuguese',
  'Portuguese (Brazil)',
  'French',
  'German',
  'Italian',
  'Dutch',
  'Greek',
  'Polish',
  'Czech',
  'Slovak',
  'Hungarian',
  'Romanian',
  'Bulgarian',
  'Croatian',
  'Serbian',
  'Slovenian',
  'Bosnian',
  'Swedish',
  'Danish',
  'Norwegian',
  'Finnish',
  'Russian',
  'Ukrainian',
  'Turkish',
  'Arabic',
  'Hebrew',
  'Persian',
  'Hindi',
  'Bengali',
  'Indonesian',
  'Vietnamese',
  'Thai',
  'Chinese',
  'Japanese',
  'Korean',
] as const

export const LANGUAGE_CODE_MAP: Record<string, string[]> = {
  English: ['en', 'eng'],
  Spanish: ['es', 'spa'],
  'Spanish (Latin America)': ['es-419', 'spa'],
  Portuguese: ['pt', 'por'],
  'Portuguese (Brazil)': ['pt-br', 'pob', 'pt'],
  French: ['fr', 'fra', 'fre'],
  German: ['de', 'deu', 'ger'],
  Italian: ['it', 'ita'],
  Dutch: ['nl', 'nld', 'dut'],
  Greek: ['el', 'ell', 'gre'],
  Polish: ['pl', 'pol'],
  Czech: ['cs', 'ces', 'cze'],
  Slovak: ['sk', 'slk', 'slo'],
  Hungarian: ['hu', 'hun'],
  Romanian: ['ro', 'ron', 'rum'],
  Bulgarian: ['bg', 'bul'],
  Croatian: ['hr', 'hrv'],
  Serbian: ['sr', 'srp'],
  Slovenian: ['sl', 'slv'],
  Bosnian: ['bs', 'bos'],
  Swedish: ['sv', 'swe'],
  Danish: ['da', 'dan'],
  Norwegian: ['no', 'nor'],
  Finnish: ['fi', 'fin'],
  Russian: ['ru', 'rus'],
  Ukrainian: ['uk', 'ukr'],
  Turkish: ['tr', 'tur'],
  Arabic: ['ar', 'ara'],
  Hebrew: ['he', 'heb'],
  Persian: ['fa', 'fas', 'per'],
  Hindi: ['hi', 'hin'],
  Bengali: ['bn', 'ben'],
  Indonesian: ['id', 'ind'],
  Vietnamese: ['vi', 'vie'],
  Thai: ['th', 'tha'],
  Chinese: ['zh', 'zho', 'chi'],
  Japanese: ['ja', 'jpn'],
  Korean: ['ko', 'kor'],
}

// Invert to map 2-letter / 3-letter code back to canonical English language name
export const CODE_TO_LANGUAGE_NAME: Record<string, string> = {}
for (const [langName, codes] of Object.entries(LANGUAGE_CODE_MAP)) {
  for (const c of codes) {
    CODE_TO_LANGUAGE_NAME[c.toLowerCase()] = langName
  }
}

export class SubtitlesBridgeService {
  private static extractReleaseTokens(text: string): string[] {
    if (!text) return []
    // Match common release groups / scene tags like SPARKS, YIFY, PSA, FGT, RARBG, DIMENSION, etc.
    const tags = text.match(/\b([A-Z0-9_\-\.]+)\b/g) || []
    return tags.map((t) => t.toUpperCase()).filter((t) => t.length >= 3)
  }

  /**
   * Fetches subtitles from built-in OpenSubtitles v3 and custom chained addons
   */
  async fetchSubtitles(
    type: 'movie' | 'series',
    id: string,
    extraParams?: Record<string, string>,
    config?: {
      addons?: SubtitleAddonConfig[]
      preferences?: Partial<SubtitleBridgePreferences>
      timeout_ms?: number
    }
  ): Promise<SubtitleItem[]> {
    const preferences: SubtitleBridgePreferences = {
      languages: ['English'],
      max_results: 20,
      max_per_language: 8,
      hearing_impaired: 'show',
      label: 'smart',
      prefer_release_match: true,
      sort: [
        { key: 'releaseMatch', direction: 'desc' },
        { key: 'source', direction: 'desc' },
        { key: 'downloads', direction: 'desc' },
      ],
      ...(config?.preferences || {}),
    }

    const timeout = config?.timeout_ms || 5000
    const videoFilename = extraParams?.filename || extraParams?.videoHash || ''
    const releaseTokens = SubtitlesBridgeService.extractReleaseTokens(videoFilename)

    // Build query params
    const queryParts: string[] = []
    if (extraParams) {
      for (const [k, v] of Object.entries(extraParams)) {
        if (v) queryParts.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      }
    }
    const extraString = queryParts.length > 0 ? queryParts.join('&') : ''

    const tasks: Promise<SubtitleItem[]>[] = []

    // 1. Built-in OpenSubtitles v3 upstream
    const osUrl = `https://opensubtitles-v3.strem.io/subtitles/${type}/${encodeURIComponent(id)}${
      extraString ? `/${extraString}` : ''
    }.json`

    tasks.push(
      fetch(osUrl, {
        signal: AbortSignal.timeout(timeout),
        headers: { 'User-Agent': 'Nuviodeck Subtitles Bridge v1.0' },
      })
        .then((res) => (res.ok ? res.json() : { subtitles: [] }))
        .then((data) => {
          const subs: any[] = data.subtitles || []
          return subs.map((s, idx) => {
            const langCode = (s.lang || 'eng').toLowerCase()
            const langName = CODE_TO_LANGUAGE_NAME[langCode] || langCode
            const url = s.url || ''
            const isHI =
              Boolean(s.hearingImpaired) ||
              url.toLowerCase().includes('.hi.') ||
              (s.id || '').toLowerCase().includes('.hi.')

            const subTokens = SubtitlesBridgeService.extractReleaseTokens(url + ' ' + (s.id || ''))
            const hasMatch = releaseTokens.some((t) => subTokens.includes(t))

            return {
              id: s.id || `os-${idx}`,
              url: s.url,
              lang: langName,
              format: s.format || 'srt',
              hearingImpaired: isHI,
              downloads: s.downloads || 0,
              releaseMatch: hasMatch,
              source: 'OpenSubtitles v3',
              releaseGroup: subTokens[0] || undefined,
            } as SubtitleItem
          })
        })
        .catch(() => [])
    )

    // 2. Chained custom addons
    const customAddons = (config?.addons || []).filter((a) => a.enabled)
    for (const addon of customAddons) {
      try {
        const base = addon.manifest_url.replace(/\/manifest\.json$/, '')
        const addonUrl = `${base}/subtitles/${type}/${encodeURIComponent(id)}${
          extraString ? `/${extraString}` : ''
        }.json`

        tasks.push(
          fetch(addonUrl, { signal: AbortSignal.timeout(timeout) })
            .then((res) => (res.ok ? res.json() : { subtitles: [] }))
            .then((data) => {
              const subs: any[] = data.subtitles || []
              return subs.map((s, idx) => {
                const langCode = (s.lang || 'eng').toLowerCase()
                const langName = CODE_TO_LANGUAGE_NAME[langCode] || langCode
                return {
                  id: s.id || `${addon.id}-${idx}`,
                  url: s.url,
                  lang: langName,
                  format: s.format || 'srt',
                  hearingImpaired: Boolean(s.hearingImpaired),
                  downloads: s.downloads || 0,
                  releaseMatch: false,
                  source: addon.name || 'Custom Addon',
                } as SubtitleItem
              })
            })
            .catch(() => [])
        )
      } catch {}
    }

    const allResults = await Promise.all(tasks)
    let merged = allResults.flat()

    // 3. Filter by configured languages if specified
    if (preferences.languages && preferences.languages.length > 0) {
      const allowed = new Set(preferences.languages.map((l) => l.toLowerCase()))
      merged = merged.filter((item) => allowed.has(item.lang.toLowerCase()))
    }

    // 4. Hearing Impaired Filter
    if (preferences.hearing_impaired === 'hide') {
      merged = merged.filter((item) => !item.hearingImpaired)
    } else if (preferences.hearing_impaired === 'only') {
      // Only keep hearing impaired if any source has labeled them, per decoded patch note
      const hiItems = merged.filter((item) => item.hearingImpaired)
      if (hiItems.length > 0) {
        merged = hiItems
      }
    }

    // 5. Sort by preferences
    merged.sort((a, b) => {
      for (const rule of preferences.sort) {
        let diff = 0
        if (rule.key === 'releaseMatch') {
          diff = (a.releaseMatch ? 1 : 0) - (b.releaseMatch ? 1 : 0)
        } else if (rule.key === 'downloads') {
          diff = (a.downloads || 0) - (b.downloads || 0)
        } else if (rule.key === 'hearingImpaired') {
          diff = (a.hearingImpaired ? 1 : 0) - (b.hearingImpaired ? 1 : 0)
        }
        if (diff !== 0) {
          return rule.direction === 'asc' ? diff : -diff
        }
      }
      return 0
    })

    // 6. Max per language cap
    const perLangCount: Record<string, number> = {}
    const cappedByLang: SubtitleItem[] = []
    for (const item of merged) {
      const cnt = perLangCount[item.lang] || 0
      if (cnt < preferences.max_per_language) {
        perLangCount[item.lang] = cnt + 1
        cappedByLang.push(item)
      }
    }

    // 7. Overall max_results cap
    const finalResults = cappedByLang.slice(0, preferences.max_results)

    // 8. Format labels according to 'smart' | 'detailed' | 'plain'
    return finalResults.map((item) => {
      let formattedLabel = item.lang

      if (preferences.label === 'smart') {
        const tags: string[] = []
        if (item.releaseGroup) tags.push(item.releaseGroup)
        if (item.hearingImpaired) tags.push('HI')
        if (tags.length > 0) formattedLabel += ` [${tags.join(' ')}]`
      } else if (preferences.label === 'detailed') {
        const tags: string[] = []
        if (item.source) tags.push(item.source)
        if (item.releaseGroup) tags.push(item.releaseGroup)
        if (item.hearingImpaired) tags.push('Hearing Impaired')
        if (tags.length > 0) formattedLabel += ` (${tags.join(' • ')})`
      }

      return {
        ...item,
        label: formattedLabel,
      }
    })
  }
}
