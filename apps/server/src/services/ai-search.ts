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

export interface AiSearchOptions {
  rpdbKey?: string
  posterConfig?: any
  language?: string
  model?: string
  provider?: 'gemini' | 'groq' | string
  geminiKey?: string
  groqKey?: string
}

export function getAvailableAiModels(provider: string = 'gemini') {
  const isGroq = provider.toLowerCase().includes('groq')
  if (isGroq) {
    return {
      provider: 'groq',
      name: 'Groq',
      defaultModel: DEFAULT_GROQ_MODEL,
      models: [...GROQ_MODELS],
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
  private tmdb: TmdbService

  constructor(
    keysOrGeminiKey?: { geminiKey?: string; groqKey?: string } | string,
    tmdbService?: TmdbService
  ) {
    if (typeof keysOrGeminiKey === 'string') {
      this.geminiKey = keysOrGeminiKey || config.ai.geminiApiKey
      this.groqKey = config.ai.groqApiKey
    } else {
      this.geminiKey = keysOrGeminiKey?.geminiKey || config.ai.geminiApiKey
      this.groqKey = keysOrGeminiKey?.groqKey || config.ai.groqApiKey
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

  private async callGemini(model: string, prompt: string, apiKey: string): Promise<string[]> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 },
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
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    return this.parseTitles(rawText)
  }

  private async callGroq(model: string, prompt: string, apiKey: string): Promise<string[]> {
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
              'You are a movie and TV show expert. Analyze the user query in any language, but ALWAYS return the titles in English. Respond ONLY with a JSON array of title strings, like: ["Inception", "Interstellar"]. Do not add markdown or explanations.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
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
    const rawText = data.choices?.[0]?.message?.content || ''
    return this.parseTitles(rawText)
  }

  async searchWithAi(
    query: string,
    type: 'movie' | 'series' = 'movie',
    options?: AiSearchOptions
  ): Promise<any[]> {
    const geminiApiKey = options?.geminiKey || this.geminiKey
    const groqApiKey = options?.groqKey || this.groqKey

    const isGroq =
      (options?.provider?.toLowerCase().includes('groq')) ||
      (groqApiKey && !geminiApiKey)

    if (!geminiApiKey && !groqApiKey) {
      // Fallback to standard TMDB search if no AI credentials configured
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

    let titles: string[] = []

    if (isGroq && groqApiKey) {
      const selectedModel = options?.model || DEFAULT_GROQ_MODEL
      const groqPool = [
        selectedModel,
        ...GROQ_MODELS,
      ].filter((m, idx, arr) => arr.indexOf(m) === idx)

      for (const model of groqPool) {
        try {
          titles = await this.callGroq(model, prompt, groqApiKey)
          if (titles.length > 0) break
        } catch (err: any) {
          console.warn(`[AI Search] Groq model ${model} error: ${err.message}`)
          if (err.message.startsWith('RATE_LIMIT')) continue
        }
      }

      // If Groq completely failed and Gemini is available, failover to Gemini
      if (titles.length === 0 && geminiApiKey) {
        console.warn('[AI Search] Groq exhausted, failing over to Gemini...')
        const geminiPool = [DEFAULT_GEMINI_MODEL, ...GEMINI_MODELS]
        for (const model of geminiPool) {
          try {
            titles = await this.callGemini(model, prompt, geminiApiKey)
            if (titles.length > 0) break
          } catch {
            continue
          }
        }
      }
    } else if (geminiApiKey) {
      const selectedModel = options?.model || DEFAULT_GEMINI_MODEL
      const geminiPool = [
        selectedModel,
        ...GEMINI_MODELS,
      ].filter((m, idx, arr) => arr.indexOf(m) === idx)

      for (const model of geminiPool) {
        try {
          titles = await this.callGemini(model, prompt, geminiApiKey)
          if (titles.length > 0) break
        } catch (err: any) {
          console.warn(`[AI Search] Gemini model ${model} error: ${err.message}`)
          if (err.message.startsWith('RATE_LIMIT')) continue
        }
      }

      // If Gemini completely failed and Groq is available, failover to Groq
      if (titles.length === 0 && groqApiKey) {
        console.warn('[AI Search] Gemini exhausted, failing over to Groq...')
        const groqPool = [DEFAULT_GROQ_MODEL, ...GROQ_MODELS]
        for (const model of groqPool) {
          try {
            titles = await this.callGroq(model, prompt, groqApiKey)
            if (titles.length > 0) break
          } catch {
            continue
          }
        }
      }
    }

    if (!Array.isArray(titles) || titles.length === 0) {
      const fallback = await this.tmdb.search(query, type === 'movie' ? 'movie' : 'tv')
      return (fallback.results || []).map((item) =>
        this.tmdb.formatMetaPreview(item, type, {
          rpdbKey: options?.rpdbKey,
          posterConfig: options?.posterConfig,
        })
      )
    }

    // Resolve titles in parallel
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

