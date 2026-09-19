export interface StreamingService {
  id: string
  name: string
  icon?: string
}

export const STREAMING_SERVICES: StreamingService[] = [
  { id: "nfx", name: "Netflix" },
  { id: "nfk", name: "Netflix Kids" },
  { id: "hbm", name: "HBO Max" },
  { id: "dnp", name: "Disney+" },
  { id: "amp", name: "Prime Video" },
  { id: "atp", name: "Apple TV+" },
  { id: "pmp", name: "Paramount+" },
  { id: "pcp", name: "Peacock Premium" },
  { id: "hlu", name: "Hulu" },
  { id: "cts", name: "Curiosity Stream" },
  { id: "mgl", name: "MagellanTV" },
  { id: "cru", name: "Crunchyroll" },
  { id: "hay", name: "Hayu" },
  { id: "clv", name: "Clarovideo" },
  { id: "gop", name: "Globoplay" },
  { id: "hst", name: "Hotstar" },
  { id: "zee", name: "Zee5" },
  { id: "nlz", name: "NLZIET" },
  { id: "vil", name: "Videoland" },
  { id: "sst", name: "SkyShowtime" },
  { id: "blv", name: "BluTV" },
  { id: "cpd", name: "Canal+" },
  { id: "dpe", name: "Discovery+" }
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
