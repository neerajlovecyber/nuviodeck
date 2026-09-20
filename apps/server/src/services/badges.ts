import path from 'path'

export interface BadgeGroup {
  id: string
  name: string
  color?: string
  isExpanded?: boolean
}

export interface BadgeItem {
  id: string
  name: string
  pattern?: string
  tagColor?: string
  borderColor?: string
  textColor?: string
  tagStyle?: string
  imageURL?: string
  isEnabled?: boolean
  type?: string
  groupId?: string
}

export interface BadgeSetPreset {
  id: string
  label: string
  creator: string
  style: string
  description?: string
  signature?: boolean
  file?: string
  badgeCount?: number
  groupsCount?: number
  groups: BadgeGroup[]
  badges?: BadgeItem[]
}

export class BadgesEngineService {
  private cachedBadgeSets: BadgeSetPreset[] | null = null
  private badgeImageCache = new Map<string, string>()

  async getBadgeSets(): Promise<BadgeSetPreset[]> {
    if (this.cachedBadgeSets) return this.cachedBadgeSets
    try {
      const possiblePaths = [
        path.resolve(import.meta.dirname, '../data/badge-sets.json'),
        path.resolve(import.meta.dirname, '../../../apps/web/src/data/badge-sets-signature.json'),
        path.resolve(process.cwd(), '../web/src/data/badge-sets-signature.json'),
        path.resolve(process.cwd(), 'apps/web/src/data/badge-sets-signature.json'),
        path.resolve(process.cwd(), 'apps/server/src/data/badge-sets.json'),
        path.resolve(process.cwd(), 'src/data/badge-sets.json'),
      ]
      for (const p of possiblePaths) {
        const file = Bun.file(p)
        if (await file.exists()) {
          this.cachedBadgeSets = (await file.json()) as BadgeSetPreset[]
          return this.cachedBadgeSets || []
        }
      }
    } catch (e) {
      console.error('Failed to load badge-sets.json:', e)
    }
    return []
  }

  async getBadgeSetById(id: string): Promise<BadgeSetPreset | null> {
    const sets = await this.getBadgeSets()
    return sets.find((s) => s.id === id) || null
  }

  /**
   * Resolves a badge image URL for a given rating service/key (e.g. imdb, rt_critic, rt_audience, metacritic, trakt, mdblist)
   */
  async resolveBadgeImageUrl(presetId: string, ratingKey: string): Promise<string | null> {
    const cacheKey = `${presetId}:${ratingKey}`
    if (this.badgeImageCache.has(cacheKey)) {
      return this.badgeImageCache.get(cacheKey)!
    }

    const set = await this.getBadgeSetById(presetId)
    if (!set || !set.badges) return null

    const keyLower = ratingKey.toLowerCase()
    const match = set.badges.find((b) => {
      const nameLower = (b.name || '').toLowerCase()
      const idLower = (b.id || '').toLowerCase()
      if (nameLower === keyLower || idLower === keyLower) return true
      if (idLower.includes(keyLower) || nameLower.includes(keyLower)) return true
      if (b.pattern) {
        try {
          const cleanPattern = b.pattern.replace(/\(\?[a-z]+\)/gi, '')
          return new RegExp(cleanPattern, 'i').test(ratingKey)
        } catch {
          // ignore invalid regex patterns
        }
      }
      return false
    })

    if (match && match.imageURL) {
      this.badgeImageCache.set(cacheKey, match.imageURL)
      return match.imageURL
    }

    return null
  }

  clearCache(): void {
    this.cachedBadgeSets = null
    this.badgeImageCache.clear()
  }
}

export const badgesEngineService = new BadgesEngineService()
