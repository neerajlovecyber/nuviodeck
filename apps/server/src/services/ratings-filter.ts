/**
 * International Age Ratings Normalization Matrix
 * Reverse-engineered from Xperience bundle chunk B9XFF0MS.js
 */

export const RATING_COUNTRIES = [
  'US',
  'GB',
  'IE',
  'AU',
  'NZ',
  'CA',
  'DE',
  'FR',
  'ES',
  'IT',
  'BR',
  'IN',
  'VN',
] as const

export type RatingCountry = typeof RATING_COUNTRIES[number]

/**
 * 5 Severity Tiers:
 * 0 = All Ages / Very Young Children
 * 1 = Older Children / Parental Guidance
 * 2 = Teens / Pre-Adults (12-14)
 * 3 = Mature / Accompanied Youth (15-17)
 * 4 = Adults Only / Restricted (18+)
 */
export const COUNTRY_RATING_TIERS: Record<RatingCountry, Record<string, number>> = {
  US: {
    G: 0,
    'TV-Y': 0,
    'TV-Y7': 0,
    'TV-G': 0,
    PG: 1,
    M: 1,
    GP: 1,
    'TV-PG': 1,
    'PG-13': 2,
    'TV-14': 2,
    R: 3,
    'TV-MA': 3,
    'NC-17': 4,
    X: 4,
  },
  GB: {
    U: 0,
    PG: 1,
    '12A': 2,
    '12': 2,
    '15': 3,
    '18': 4,
    R18: 4,
  },
  IE: {
    G: 0,
    PG: 1,
    '12A': 2,
    '12': 2,
    '15A': 3,
    '15': 3,
    '16': 3,
    '18': 4,
  },
  AU: {
    P: 0,
    C: 0,
    G: 0,
    PG: 1,
    M: 2,
    'MA 15+': 3,
    'R 18+': 4,
    'X 18+': 4,
    RC: 4,
  },
  NZ: {
    G: 0,
    PG: 1,
    M: 2,
    R13: 2,
    RP13: 2,
    R15: 3,
    R16: 3,
    RP16: 3,
    '16': 3,
    R18: 4,
    RP18: 4,
    '18': 4,
    R: 4,
  },
  CA: {
    C: 0,
    C8: 0,
    G: 0,
    PG: 1,
    '14A': 2,
    '14+': 2,
    '18A': 3,
    '18+': 3,
    R: 4,
    A: 4,
  },
  DE: {
    '0': 0,
    '6': 1,
    '12': 2,
    '16': 3,
    '18': 4,
    'FSK 0': 0,
    'FSK 6': 1,
    'FSK 12': 2,
    'FSK 16': 3,
    'FSK 18': 4,
  },
  FR: {
    TP: 0,
    U: 0,
    'TOUS PUBLICS': 0,
    '10': 1,
    '-10': 1,
    '12': 2,
    '-12': 2,
    '16': 3,
    '-16': 3,
    '18': 4,
    '-18': 4,
  },
  ES: {
    APTA: 0,
    TP: 0,
    A: 0,
    AI: 0,
    ERI: 0,
    '7': 1,
    '7I': 1,
    '10': 1,
    '12': 2,
    '13': 2,
    '16': 3,
    '18': 4,
    X: 4,
  },
  IT: {
    T: 0,
    '6+': 1,
    '6': 1,
    '10+': 1,
    BA: 1,
    '14+': 2,
    '14': 2,
    VM12: 2,
    VM14: 2,
    '18+': 4,
    '18': 4,
    VM18: 4,
  },
  BR: {
    L: 0,
    '10': 1,
    '12': 2,
    '14': 3,
    '16': 3,
    '18': 4,
  },
  IN: {
    U: 0,
    'UA 7+': 1,
    'U/A 7+': 1,
    'UA 13+': 2,
    'U/A 13+': 2,
    UA: 2,
    'U/A': 2,
    'UA 16+': 3,
    'U/A 16+': 3,
    A: 4,
    S: 4,
  },
  VN: {
    P: 0,
    K: 1,
    T13: 2,
    C13: 2,
    T16: 3,
    C16: 3,
    T18: 4,
    C18: 4,
    C: 4,
  },
}

/**
 * 11 Category Exclusions and TMDB/TVDB filter criteria
 * From B9XFF0MS.js
 */
export const EXCLUDED_CATEGORIES = [
  'anime',
  'animation',
  'reality',
  'talk_show',
  'kids',
  'family',
  'musical',
  'documentary',
  'news',
  'soap',
  'horror',
] as const

export type ExcludedCategory = typeof EXCLUDED_CATEGORIES[number]

export const CATEGORY_FILTER_MAP: Record<
  ExcludedCategory,
  {
    movieGenre: number | null
    tvGenre: number | null
    keywords: number[]
    tvdbGenres: string[]
  }
> = {
  anime: { movieGenre: null, tvGenre: null, keywords: [210024], tvdbGenres: ['Anime'] },
  animation: { movieGenre: 16, tvGenre: 16, keywords: [], tvdbGenres: [] },
  reality: { movieGenre: null, tvGenre: 10764, keywords: [], tvdbGenres: [] },
  talk_show: { movieGenre: null, tvGenre: 10767, keywords: [], tvdbGenres: [] },
  kids: { movieGenre: null, tvGenre: 10762, keywords: [], tvdbGenres: [] },
  family: { movieGenre: 10751, tvGenre: 10751, keywords: [], tvdbGenres: [] },
  musical: { movieGenre: 10402, tvGenre: null, keywords: [], tvdbGenres: ['Musical'] },
  documentary: { movieGenre: 99, tvGenre: 99, keywords: [], tvdbGenres: [] },
  news: { movieGenre: null, tvGenre: 10763, keywords: [], tvdbGenres: [] },
  soap: { movieGenre: null, tvGenre: 10766, keywords: [], tvdbGenres: [] },
  horror: { movieGenre: 27, tvGenre: null, keywords: [315058, 12339], tvdbGenres: ['Horror'] },
}

/**
 * Resolve country code from setting or timezone
 */
export function resolveRatingCountry(country?: string, timezone?: string): RatingCountry {
  if (country && country !== 'auto') {
    const uc = country.toUpperCase() as RatingCountry
    if (RATING_COUNTRIES.includes(uc)) return uc
  }

  if (timezone) {
    const tz = timezone.toLowerCase()
    if (tz.includes('london') || tz.includes('belfast')) return 'GB'
    if (tz.includes('dublin')) return 'IE'
    if (tz.includes('sydney') || tz.includes('melbourne') || tz.includes('brisbane') || tz.includes('perth')) return 'AU'
    if (tz.includes('auckland')) return 'NZ'
    if (tz.includes('toronto') || tz.includes('vancouver') || tz.includes('montreal')) return 'CA'
    if (tz.includes('berlin')) return 'DE'
    if (tz.includes('paris')) return 'FR'
    if (tz.includes('madrid')) return 'ES'
    if (tz.includes('rome')) return 'IT'
    if (tz.includes('sao_paulo')) return 'BR'
    if (tz.includes('kolkata') || tz.includes('calcutta')) return 'IN'
    if (tz.includes('ho_chi_minh') || tz.includes('saigon')) return 'VN'
  }

  return 'US'
}

/**
 * Normalizes any country certification string into a 0-4 severity tier
 */
export function getRatingTier(cert: string, country: RatingCountry = 'US'): number | null {
  if (!cert) return null
  const clean = cert.trim().toUpperCase()
  const map = COUNTRY_RATING_TIERS[country] || COUNTRY_RATING_TIERS.US
  if (clean in map) return map[clean]

  // Fallback check against US standard if not found in localized map
  if (clean in COUNTRY_RATING_TIERS.US) {
    return COUNTRY_RATING_TIERS.US[clean]
  }

  return null
}

/**
 * Builds TMDB Discover certification params for maxRating cap in specified country.
 */
export function buildCertificationFilter(
  maxRating: string,
  country: RatingCountry = 'US',
  isMovie: boolean = true
): { certification_country?: string; certification?: string; 'certification.lte'?: string } | null {
  if (!maxRating || maxRating === 'any' || maxRating === 'NONE') {
    return null
  }

  const countryTiers = COUNTRY_RATING_TIERS[country] || COUNTRY_RATING_TIERS.US
  const maxTier = getRatingTier(maxRating, country)

  if (maxTier === null) {
    return {
      certification_country: country,
      certification: maxRating,
    }
  }

  // Find all certifications in that country that are <= maxTier
  const allowedCerts = Object.entries(countryTiers)
    .filter(([_, tier]) => tier <= maxTier)
    .map(([cert]) => cert)

  // Filter to appropriate movie vs TV certs if in US
  let filtered = allowedCerts
  if (country === 'US') {
    filtered = isMovie
      ? allowedCerts.filter((c) => !c.startsWith('TV-'))
      : allowedCerts.filter((c) => c.startsWith('TV-') || c === 'G')
  }

  return {
    certification_country: country,
    certification: [...new Set(filtered)].join('|'),
  }
}

/**
 * Builds TMDB without_genres and without_keywords strings for excluded categories
 */
export function buildCategoryExclusionsFilter(
  excludedCategories: string[],
  isMovie: boolean = true
): { without_genres?: string; without_keywords?: string } {
  if (!Array.isArray(excludedCategories) || excludedCategories.length === 0) {
    return {}
  }

  const genreIds = new Set<number>()
  const keywordIds = new Set<number>()

  for (const cat of excludedCategories) {
    const config = CATEGORY_FILTER_MAP[cat as ExcludedCategory]
    if (!config) continue

    const genre = isMovie ? config.movieGenre : config.tvGenre
    if (genre !== null) {
      genreIds.add(genre)
    }

    for (const kw of config.keywords) {
      keywordIds.add(kw)
    }
  }

  const result: { without_genres?: string; without_keywords?: string } = {}
  if (genreIds.size > 0) {
    result.without_genres = Array.from(genreIds).join(',')
  }
  if (keywordIds.size > 0) {
    result.without_keywords = Array.from(keywordIds).join(',')
  }

  return result
}
