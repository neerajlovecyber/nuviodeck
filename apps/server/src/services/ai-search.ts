import { config } from '../config'
import { TmdbService } from './tmdb'

export const GROQ_MODELS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
] as const

export const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-120b'

export const GEMINI_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemma-4-31b-it',
  'gemma-4-26b-a4b-it',
] as const

export const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash-lite'

export const DEEPSEEK_MODELS = [
  'deepseek-v4-flash',
] as const

export const DEFAULT_DEEPSEEK_MODEL = 'deepseek-v4-flash'

export interface AiSearchOptions {
  rpdbKey?: string
  posterConfig?: any
  language?: string
  model?: string
  provider?: 'gemini' | 'groq' | 'deepseek' | string
  geminiKey?: string
  groqKey?: string
  deepseekKey?: string
}

export function getAvailableAiModels(provider: string = 'gemini') {
  const p = provider.toLowerCase()
  if (p.includes('groq')) {
    return {
      provider: 'groq',
      name: 'Groq',
      defaultModel: DEFAULT_GROQ_MODEL,
      models: [...GROQ_MODELS],
    }
  }
  if (p.includes('deepseek')) {
    return {
      provider: 'deepseek',
      name: 'DeepSeek',
      defaultModel: DEFAULT_DEEPSEEK_MODEL,
      models: [...DEEPSEEK_MODELS],
    }
  }
  return {
    provider: 'gemini',
    name: 'Google Gemini',
    defaultModel: DEFAULT_GEMINI_MODEL,
    models: [...GEMINI_MODELS],
  }
}

export class AiSearchService {
  private geminiKey: string
  private groqKey: string
  private deepseekKey: string
  private tmdb: TmdbService

  constructor(
    keysOrGeminiKey?: { geminiKey?: string; groqKey?: string; deepseekKey?: string } | string,
    tmdbService?: TmdbService
  ) {
    if (typeof keysOrGeminiKey === 'string') {
      this.geminiKey = keysOrGeminiKey || config.ai.geminiApiKey
      this.groqKey = config.ai.groqApiKey
      this.deepseekKey = config.ai.deepseekApiKey
    } else {
      this.geminiKey = keysOrGeminiKey?.geminiKey || config.ai.geminiApiKey
      this.groqKey = keysOrGeminiKey?.groqKey || config.ai.groqApiKey
      this.deepseekKey = keysOrGeminiKey?.deepseekKey || config.ai.deepseekApiKey
    }
    this.tmdb = tmdbService || new TmdbService()
  }

  private parseTitles(rawText: string): string[] {
    if (!rawText) return []
    const cleaned = rawText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim()

    try {
      const parsed = JSON.parse(cleaned)
      if (Array.isArray(parsed)) {
        return parsed.map((t) => String(t).trim()).filter(Boolean)
      }
    } catch {
      // Fallback: parse comma or newline separated list
    }

    return cleaned
      .split(/[,\n]/)
      .map((t) => t.trim().replace(/^[-*•\d\.\)]\s*/, ''))
      .filter(
        (t) =>
          t.length > 1 &&
          !t.toLowerCase().includes('here are') &&
          !t.toLowerCase().includes('titles:') &&
          !t.toLowerCase().includes('response:')
      )
  }

  private async callGemini(model: string, prompt: string, apiKey: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3 },
      }),
    })

    if (!res.ok) {
      const errStatus = res.status
      if (errStatus === 429 || errStatus === 503) {
        throw new Error(`RATE_LIMIT:${errStatus}`)
      }
      throw new Error(`Gemini responded with status ${errStatus}`)
    }

    const data = await res.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  }

  private async callGroq(model: string, prompt: string, apiKey: string): Promise<string> {
    const url = 'https://api.groq.com/openai/v1/chat/completions'
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content:
              'You are a movie and TV show curation expert. Always output title names in standard international English. Follow the exact output format requested.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
      }),
    })

    if (!res.ok) {
      const errStatus = res.status
      if (errStatus === 429 || errStatus === 503) {
        throw new Error(`RATE_LIMIT:${errStatus}`)
      }
      throw new Error(`Groq responded with status ${errStatus}`)
    }

    const data = await res.json()
    return data.choices?.[0]?.message?.content || ''
  }

  private async callDeepSeek(model: string, prompt: string, apiKey: string): Promise<string> {
    const url = 'https://api.deepseek.com/chat/completions'
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content:
              'You are a movie and TV show curation expert. Always output title names in standard international English. Follow the exact output format requested.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
      }),
    })

    if (!res.ok) {
      const errStatus = res.status
      if (errStatus === 429 || errStatus === 503) {
        throw new Error(`RATE_LIMIT:${errStatus}`)
      }
      throw new Error(`DeepSeek responded with status ${errStatus}`)
    }

    const data = await res.json()
    return data.choices?.[0]?.message?.content || ''
  }

  /**
   * Cascade executor that calls user-specified provider/model and seamlessly
   * falls back across alternative models and secondary providers.
   */
  async queryAiText(prompt: string, options?: AiSearchOptions): Promise<string> {
    const geminiKey = options?.geminiKey || this.geminiKey
    const groqKey = options?.groqKey || this.groqKey
    const deepseekKey = options?.deepseekKey || this.deepseekKey

    const requestedProvider = (options?.provider || 'gemini').toLowerCase()

    // 1. Try Groq if selected or if only Groq key present
    if (requestedProvider.includes('groq') && groqKey) {
      const selectedModel = options?.model || DEFAULT_GROQ_MODEL
      const pool = [selectedModel, ...GROQ_MODELS].filter((m, i, a) => a.indexOf(m) === i)
      for (const model of pool) {
        try {
          const res = await this.callGroq(model, prompt, groqKey)
          if (res?.trim()) return res
        } catch (err: any) {
          console.warn(`[AI Engine] Groq model ${model} failed: ${err.message}`)
        }
      }
    }

    // 2. Try DeepSeek if selected
    if (requestedProvider.includes('deepseek') && deepseekKey) {
      const selectedModel = options?.model || DEFAULT_DEEPSEEK_MODEL
      const pool = [selectedModel, ...DEEPSEEK_MODELS].filter((m, i, a) => a.indexOf(m) === i)
      for (const model of pool) {
        try {
          const res = await this.callDeepSeek(model, prompt, deepseekKey)
          if (res?.trim()) return res
        } catch (err: any) {
          console.warn(`[AI Engine] DeepSeek model ${model} failed: ${err.message}`)
        }
      }
    }

    // 3. Try Gemini (default)
    if (geminiKey) {
      const selectedModel = options?.model || DEFAULT_GEMINI_MODEL
      const pool = [selectedModel, ...GEMINI_MODELS].filter((m, i, a) => a.indexOf(m) === i)
      for (const model of pool) {
        try {
          const res = await this.callGemini(model, prompt, geminiKey)
          if (res?.trim()) return res
        } catch (err: any) {
          console.warn(`[AI Engine] Gemini model ${model} failed: ${err.message}`)
        }
      }
    }

    // 4. Secondary fallback: try whatever key is available
    if (groqKey) {
      for (const model of GROQ_MODELS) {
        try {
          const res = await this.callGroq(model, prompt, groqKey)
          if (res?.trim()) return res
        } catch {}
      }
    }

    if (deepseekKey) {
      for (const model of DEEPSEEK_MODELS) {
        try {
          const res = await this.callDeepSeek(model, prompt, deepseekKey)
          if (res?.trim()) return res
        } catch {}
      }
    }

    return ''
  }

  /**
   * Generates a concise, evocative collection/row title (2 to 4 words).
   * Exact endpoint parity for POST /api/profile/:id/ai-catalog-title
   */
  async generateCatalogTitle(
    prompt: string,
    kind: 'movie' | 'series' = 'movie',
    options?: AiSearchOptions
  ): Promise<string> {
    const aiPrompt = `Summarize the following user request into a concise, evocative 2 to 4 word title for a ${kind === 'movie' ? 'movie' : 'TV show'} row/shelf:
"${prompt}"

Rules:
- 2 to 4 words only.
- Output ONLY the title text. Do not wrap in quotes or add markdown.
- Examples: "90s Sci-Fi Thrillers", "Cyberpunk Noir", "Cozy British Mysteries", "Mind-Bending Heists".`

    const raw = await this.queryAiText(aiPrompt, options)
    const cleaned = raw.replace(/["'\`]/g, '').trim()
    if (!cleaned) {
      return kind === 'movie' ? 'Curated Movies' : 'Curated Series'
    }
    return cleaned
  }

  /**
   * Generates full AI catalog list items (up to count titles) with seed/rev support.
   */
  async generateAiCatalog(
    prompt: string,
    kind: 'movie' | 'series' = 'movie',
    count: number = 75,
    rev: number = 0,
    options?: AiSearchOptions
  ): Promise<any[]> {
    const typeLabel = kind === 'movie' ? 'movies' : 'TV series'
    const seedNote = rev > 0 ? `\n(Seed iteration ${rev}: focus on fresh, less obvious, high-quality entries while remaining true to the theme)` : ''

    const aiPrompt = `You are a film and television expert curator.
Recommend up to ${Math.min(count, 40)} real, acclaimed ${typeLabel} matching this theme:
"${prompt}"${seedNote}

Respond ONLY with a JSON array of title strings, like:
["Title 1", "Title 2", "Title 3"]
Do not add markdown formatting or explanation.`

    const raw = await this.queryAiText(aiPrompt, options)
    const titles = this.parseTitles(raw)

    if (titles.length === 0) {
      // Fallback to TMDB search
      const fallback = await this.tmdb.search(prompt, kind === 'movie' ? 'movie' : 'tv')
      return (fallback.results || []).map((item) =>
        this.tmdb.formatMetaPreview(item, kind, {
          rpdbKey: options?.rpdbKey,
          posterConfig: options?.posterConfig,
        })
      )
    }

    // Resolve titles via TMDB
    const promises = titles.map(async (title) => {
      try {
        const searchRes = await this.tmdb.search(title, kind === 'movie' ? 'movie' : 'tv')
        if (searchRes.results && searchRes.results.length > 0) {
          return this.tmdb.formatMetaPreview(searchRes.results[0], kind, {
            rpdbKey: options?.rpdbKey,
            posterConfig: options?.posterConfig,
          })
        }
        return null
      } catch {
        return null
      }
    })

    const resolved = await Promise.all(promises)
    return resolved.filter(Boolean)
  }

  /**
   * Generates "Because You Watched" AI recommendations based on user's watch history.
   * Excludes categories like anime if requested in profile settings.
   */
  async generateRecommendations(
    watchedTitles: string[],
    kind: 'movie' | 'series' = 'movie',
    options?: { excludeCategories?: string[] } & AiSearchOptions
  ): Promise<any[]> {
    if (!watchedTitles || watchedTitles.length === 0) {
      const pop = await this.tmdb.getTrending(kind === 'movie' ? 'movie' : 'tv', 'week', 1)
      return (pop.results || []).map((item: any) =>
        this.tmdb.formatMetaPreview(item, kind, {
          rpdbKey: options?.rpdbKey,
          posterConfig: options?.posterConfig,
        })
      )
    }

    const typeLabel = kind === 'movie' ? 'movies' : 'TV series'
    const exclude = options?.excludeCategories || []
    const excludeInstruction = exclude.length > 0 ? `\nDo NOT recommend anything belonging to these categories: ${exclude.join(', ')}.` : ''

    const aiPrompt = `The user recently enjoyed the following titles:
${watchedTitles.slice(0, 5).map((t) => `- ${t}`).join('\n')}

Recommend 15 highly rated real ${typeLabel} with similar storytelling, atmosphere, tone, or director style.${excludeInstruction}
Respond ONLY with a JSON array of title strings, like:
["Title 1", "Title 2"]`

    const raw = await this.queryAiText(aiPrompt, options)
    const titles = this.parseTitles(raw)

    const promises = titles.map(async (title) => {
      try {
        const searchRes = await this.tmdb.search(title, kind === 'movie' ? 'movie' : 'tv')
        if (searchRes.results && searchRes.results.length > 0) {
          return this.tmdb.formatMetaPreview(searchRes.results[0], kind, {
            rpdbKey: options?.rpdbKey,
            posterConfig: options?.posterConfig,
          })
        }
        return null
      } catch {
        return null
      }
    })

    const resolved = await Promise.all(promises)
    return resolved.filter(Boolean)
  }

  /**
   * Performs natural language search via AI
   */
  async searchWithAi(
    query: string,
    type: 'movie' | 'series' = 'movie',
    options?: AiSearchOptions
  ): Promise<any[]> {
    const geminiApiKey = options?.geminiKey || this.geminiKey
    const groqApiKey = options?.groqKey || this.groqKey
    const deepseekApiKey = options?.deepseekKey || this.deepseekKey

    if (!geminiApiKey && !groqApiKey && !deepseekApiKey) {
      const tmdbRes = await this.tmdb.search(query, type === 'movie' ? 'movie' : 'tv')
      return (tmdbRes.results || []).map((item) =>
        this.tmdb.formatMetaPreview(item, type, {
          rpdbKey: options?.rpdbKey,
          posterConfig: options?.posterConfig,
        })
      )
    }

    const prompt = `You are a film and TV expert search engine. The user entered the natural language search query: "${query}".
Suggest 10 of the best matching real ${type === 'movie' ? 'movies' : 'TV series'} for this query.
Respond ONLY with a JSON array of title strings, like:
["Inception", "Interstellar", "The Matrix", "Blade Runner 2049"]
Do not add markdown backticks or any other text.`

    const raw = await this.queryAiText(prompt, options)
    const titles = this.parseTitles(raw)

    if (!Array.isArray(titles) || titles.length === 0) {
      const fallback = await this.tmdb.search(query, type === 'movie' ? 'movie' : 'tv')
      return (fallback.results || []).map((item) =>
        this.tmdb.formatMetaPreview(item, type, {
          rpdbKey: options?.rpdbKey,
          posterConfig: options?.posterConfig,
        })
      )
    }

    const searchPromises = titles.map(async (title) => {
      try {
        const searchRes = await this.tmdb.search(title, type === 'movie' ? 'movie' : 'tv')
        if (searchRes.results && searchRes.results.length > 0) {
          return this.tmdb.formatMetaPreview(searchRes.results[0], type, {
            rpdbKey: options?.rpdbKey,
            posterConfig: options?.posterConfig,
          })
        }
        return null
      } catch {
        return null
      }
    })

    const resolved = await Promise.all(searchPromises)
    return resolved.filter(Boolean)
  }
}
