export const config = {
  port: Number(process.env.PORT || 3001),
  nuvio: {
    baseUrl: process.env.NUVIO_API_URL || 'https://api.nuvio.tv',
    publishableKey:
      process.env.NUVIO_PUBLISHABLE_KEY ||
      'sb_publishable_1Clq8rlTVACkdcZuqr6_AD__xUUC_EN',
  },
  tmdb: {
    apiToken: process.env.TMDB_API_TOKEN || process.env.TMDB_READ_ACCESS_TOKEN || '',
    apiKey: process.env.TMDB_API_KEY || '2215ae8009b15b0c42119df2960f807a',
    baseUrl: process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3',
    imageBaseUrl: process.env.TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p',
    proxyUrl: process.env.TMDB_PROXY_URL || process.env.HTTP_PROXY || '',
  },
  mdblist: {
    apiKey: process.env.MDBLIST_API_KEY || '',
    baseUrl: 'https://mdblist.com/api',
  },
  ai: {
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    groqApiKey: process.env.GROQ_API_KEY || '',
  },
  rpdb: {
    apiKey: process.env.RPDB_API_KEY || '',
  },
  betterposters: {
    url: process.env.BETTERPOSTERS_URL || '',
  },
}

