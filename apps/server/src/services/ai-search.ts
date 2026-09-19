import { config } from '../config'
import { TmdbService } from './tmdb'

export class AiSearchService {
  private geminiKey: string
  private tmdb: TmdbService

  constructor(geminiKey?: string, tmdbService?: TmdbService) {
    this.geminiKey = geminiKey || config.ai.geminiApiKey
    this.tmdb = tmdbService || new TmdbService()
  }

  async searchWithAi(
    query: string,
    type: 'movie' | 'series' = 'movie',
    options?: { rpdbKey?: string; language?: string }
  ): Promise<any[]> {
    if (!this.geminiKey) {
      // If no AI key configured, fallback to standard TMDB search
      const tmdbRes = await this.tmdb.search(query, type === 'movie' ? 'movie' : 'tv')
      return (tmdbRes.results || []).map((item) =>
        this.tmdb.formatMetaPreview(item, type, { rpdbKey: options?.rpdbKey })
      )
    }

    try {
      const prompt = `You are a film and TV expert search engine. The user entered the natural language search query: "${query}".
Suggest 10 of the best matching real ${type === 'movie' ? 'movies' : 'TV series'} for this query.
Respond ONLY with a JSON array of title strings, like:
["Inception", "Interstellar", "The Matrix", "Blade Runner 2049"]
Do not add markdown backticks or any other text.`

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiKey}`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2 },
        }),
      })

      if (!res.ok) {
        throw new Error(`Gemini responded with ${res.status}`)
      }

      const data = await res.json()
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim()
      const titles: string[] = JSON.parse(cleaned)

      if (!Array.isArray(titles)) return []

      // Resolve each title via TMDB search in parallel
      const searchPromises = titles.map(async (title) => {
        try {
          const searchRes = await this.tmdb.search(title, type === 'movie' ? 'movie' : 'tv')
          if (searchRes.results && searchRes.results.length > 0) {
            return this.tmdb.formatMetaPreview(searchRes.results[0], type, {
              rpdbKey: options?.rpdbKey,
            })
          }
          return null
        } catch {
          return null
        }
      })

      const resolved = await Promise.all(searchPromises)
      return resolved.filter(Boolean)
    } catch (err: any) {
      console.error('AI search failed, falling back to standard search:', err.message)
      const fallback = await this.tmdb.search(query, type === 'movie' ? 'movie' : 'tv')
      return (fallback.results || []).map((item) =>
        this.tmdb.formatMetaPreview(item, type, { rpdbKey: options?.rpdbKey })
      )
    }
  }
}
