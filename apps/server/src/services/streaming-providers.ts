export interface StreamingService {
  id: string
  name: string
  icon?: string
  tmdbProviderId?: number
}

export const STREAMING_SERVICES: StreamingService[] = [
  { id: "nfx", name: "Netflix", tmdbProviderId: 8 },
  { id: "nfk", name: "Netflix Kids", tmdbProviderId: 8 },
  { id: "hbm", name: "HBO Max", tmdbProviderId: 384 },
  { id: "dnp", name: "Disney+", tmdbProviderId: 337 },
  { id: "amp", name: "Prime Video", tmdbProviderId: 9 },
  { id: "atp", name: "Apple TV+", tmdbProviderId: 350 },
  { id: "pmp", name: "Paramount+", tmdbProviderId: 531 },
  { id: "pcp", name: "Peacock Premium", tmdbProviderId: 386 },
  { id: "hlu", name: "Hulu", tmdbProviderId: 15 },
  { id: "cts", name: "Curiosity Stream", tmdbProviderId: 190 },
  { id: "mgl", name: "MagellanTV", tmdbProviderId: 551 },
  { id: "cru", name: "Crunchyroll", tmdbProviderId: 283 },
  { id: "hay", name: "Hayu", tmdbProviderId: 29 },
  { id: "clv", name: "Clarovideo", tmdbProviderId: 167 },
  { id: "gop", name: "Globoplay", tmdbProviderId: 307 },
  { id: "hst", name: "Hotstar", tmdbProviderId: 122 },
  { id: "zee", name: "Zee5", tmdbProviderId: 232 },
  { id: "nlz", name: "NLZIET", tmdbProviderId: 564 },
  { id: "vil", name: "Videoland", tmdbProviderId: 72 },
  { id: "sst", name: "SkyShowtime", tmdbProviderId: 1773 },
  { id: "blv", name: "BluTV", tmdbProviderId: 341 },
  { id: "cpd", name: "Canal+", tmdbProviderId: 381 },
  { id: "dpe", name: "Discovery+", tmdbProviderId: 520 }
]

export const STREAMING_REGIONS: Record<string, string[]> = {
  'United States': ['nfx', 'nfk', 'dnp', 'amp', 'atp', 'hbm', 'cru', 'pmp', 'mgl', 'cts', 'hlu', 'pcp', 'dpe'],
  'Brazil': ['nfx', 'nfk', 'dnp', 'atp', 'amp', 'pmp', 'hbm', 'cru', 'clv', 'gop', 'mgl', 'cts'],
  'India': ['hay', 'nfx', 'nfk', 'atp', 'amp', 'cru', 'zee', 'hst', 'mgl', 'cts', 'dpe'],
  'United Kingdom': ['nfx', 'nfk', 'dnp', 'amp', 'atp', 'hbm', 'cru', 'pmp', 'hay', 'dpe'],
  'Turkey': ['nfx', 'nfk', 'dnp', 'atp', 'amp', 'cru', 'blv', 'mgl', 'cts'],
  'Netherlands': ['nfx', 'nfk', 'dnp', 'amp', 'atp', 'hbm', 'cru', 'hay', 'vil', 'sst', 'mgl', 'cts', 'nlz', 'dpe'],
  'France': ['nfx', 'nfk', 'dnp', 'amp', 'atp', 'hbm', 'hay', 'cpd'],
  'Any': [
    'nfx', 'nfk', 'dnp', 'amp', 'atp', 'hbm', 'pmp', 'hlu', 'pcp', 'clv', 'gop', 'blv',
    'zee', 'hst', 'hay', 'vil', 'sst', 'mgl', 'cts', 'cru', 'nlz', 'cpd', 'dpe'
  ]
}

export class StreamingProviderService {
  static getAll(): StreamingService[] {
    return STREAMING_SERVICES
  }

  static getRegions(): string[] {
    return Object.keys(STREAMING_REGIONS)
  }

  static getByRegion(region: string): StreamingService[] {
    const serviceIds = STREAMING_REGIONS[region] || STREAMING_REGIONS['Any']
    return serviceIds
      .map((id) => STREAMING_SERVICES.find((s) => s.id === id))
      .filter((s): s is StreamingService => Boolean(s))
  }

  static getById(id: string): StreamingService | undefined {
    return STREAMING_SERVICES.find((s) => s.id === id)
  }
}
