export interface AgeRating {
  id: string
  name: string
  description: string
  order: number
  badge: {
    text: string
    color: string
  }
}

export const AGE_RATINGS: AgeRating[] = [
  {
    id: "NONE",
    name: "No Restriction",
    description: "Show all content without age restrictions",
    order: 0,
    badge: {
      text: "ALL",
      color: "bg-muted text-muted-foreground"
    }
  },
  {
    id: "G",
    name: "General Audience",
    description: "All ages admitted. There is no content that would be objectionable to most parents.",
    order: 1,
    badge: {
      text: "G",
      color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
    }
  },
  {
    id: "PG",
    name: "Parental Guidance",
    description: "Some material may not be suitable for children under 10. May contain mild language, crude/suggestive humor, scary moments and/or violence.",
    order: 2,
    badge: {
      text: "PG",
      color: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30"
    }
  },
  {
    id: "PG-13",
    name: "Parental Guidance 13",
    description: "Some material may be inappropriate for children under 13. May contain sexual content, brief nudity, strong language, mature themes and intense action violence.",
    order: 3,
    badge: {
      text: "PG-13",
      color: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
    }
  },
  {
    id: "R",
    name: "Restricted",
    description: "Under 17 requires accompanying parent or adult guardian. May contain strong profanity, graphic sexuality, nudity, strong violence, horror, gore, and drug use.",
    order: 4,
    badge: {
      text: "R",
      color: "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30"
    }
  },
  {
    id: "NC-17",
    name: "Adults Only",
    description: "Adults only. Contains excessive graphic violence, intense sex, explicit drug abuse or any other elements beyond R rating.",
    order: 5,
    badge: {
      text: "NC-17",
      color: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30"
    }
  }
]

const RATING_ORDER_MAP = new Map<string, number>(
  AGE_RATINGS.map((r) => [r.id.toUpperCase(), r.order])
)

// Also map common TV / international certification codes
const ALIAS_ORDER_MAP: Record<string, number> = {
  'TV-Y': 1,
  'TV-Y7': 1,
  'TV-G': 1,
  'TV-PG': 2,
  'TV-14': 3,
  'TV-MA': 4,
  'U': 1,
  'UA': 2,
  'A': 4,
  '12': 2,
  '12A': 2,
  '15': 4,
  '18': 5,
}

export class AgeRatingService {
  static getAll(): AgeRating[] {
    return AGE_RATINGS
  }

  static getById(id: string): AgeRating | undefined {
    return AGE_RATINGS.find((r) => r.id.toUpperCase() === id.toUpperCase())
  }

  static getOrder(rating: string): number {
    const clean = rating.trim().toUpperCase()
    if (RATING_ORDER_MAP.has(clean)) {
      return RATING_ORDER_MAP.get(clean)!
    }
    if (ALIAS_ORDER_MAP[clean] !== undefined) {
      return ALIAS_ORDER_MAP[clean]
    }
    return 99
  }

  static isAllowed(contentRating: string | null | undefined, maxAllowedRating: string): boolean {
    if (!maxAllowedRating || maxAllowedRating.toUpperCase() === 'NONE' || maxAllowedRating.toUpperCase() === 'NC-17') {
      return true
    }
    if (!contentRating) {
      return true
    }
    const maxOrder = this.getOrder(maxAllowedRating)
    const contentOrder = this.getOrder(contentRating)
    return contentOrder <= maxOrder
  }

  static toTmdbCertificationFilter(maxRating: string, country = 'US'): Record<string, string> {
    const clean = maxRating.toUpperCase()
    if (clean === 'NONE' || !clean) return {}

    return {
      certification_country: country,
      'certification.lte': clean,
    }
  }
}
