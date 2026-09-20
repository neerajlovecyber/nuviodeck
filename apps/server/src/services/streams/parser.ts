import {
  ParsedStreamMetadata,
  StremioStream,
  StreamAudioTag,
  StreamCodec,
  StreamQuality,
  StreamResolution,
  StreamVisualTag,
} from './types'

export class StreamParser {
  static parse(
    stream: StremioStream,
    sourceId: string,
    sourceName: string,
    debridService?: string
  ): ParsedStreamMetadata {
    const rawText = `${stream.name || ''} ${stream.title || ''} ${stream.description || ''}`
    const id = stream.url || stream.infoHash || `${sourceId}:${Math.random().toString(36).substring(2, 9)}`

    const resolution = this.detectResolution(rawText)
    const quality = this.detectQuality(rawText)
    const visualTags = this.detectVisualTags(rawText)
    const audioTags = this.detectAudioTags(rawText)
    const audioChannels = this.detectAudioChannels(rawText)
    const codecs = this.detectCodecs(rawText)
    const { languages, languageEmojis } = this.detectLanguages(rawText)
    const { sizeBytes, sizeFormatted } = this.detectSize(rawText)
    const seeders = this.detectSeeders(rawText)
    const releaseGroup = this.detectReleaseGroup(rawText)
    const indexer = this.detectIndexer(rawText)
    const cached = this.detectCached(rawText, stream)
    const filename = this.detectFilename(rawText)
    const { title, year, season, episode } = this.detectMediaTitle(rawText, filename)

    return {
      id,
      sourceId,
      sourceName,
      debridService,
      cached,
      rawTitle: rawText.trim(),
      filename,
      title,
      year,
      season,
      episode,
      resolution,
      quality,
      visualTags,
      audioTags,
      audioChannels,
      codecs,
      languages,
      languageEmojis,
      sizeBytes,
      sizeFormatted,
      seeders,
      releaseGroup,
      indexer,
      url: stream.url,
      infoHash: stream.infoHash,
      fileIdx: stream.fileIdx,
      originalStream: stream,
    }
  }

  private static detectResolution(text: string): StreamResolution {
    const lower = text.toLowerCase()
    if (/\b(2160p|4k|uhd)\b/.test(lower) || lower.includes('3840x2160')) return '2160p'
    if (/\b(1440p|2k|qhd)\b/.test(lower) || lower.includes('2560x1440')) return '1440p'
    if (/\b(1080p|fhd)\b/.test(lower) || lower.includes('1920x1080')) return '1080p'
    if (/\b(720p|hd)\b/.test(lower) || lower.includes('1280x720')) return '720p'
    if (/\b(576p|ed)\b/.test(lower)) return '576p'
    if (/\b(480p|sd|360p)\b/.test(lower)) return '480p'
    return 'unknown'
  }

  private static detectQuality(text: string): StreamQuality {
    const lower = text.toLowerCase()
    if (/\b(remux|bluray[- ._]?remux|bdremux)\b/.test(lower)) return 'BluRay REMUX'
    if (/\b(bluray|bdrip|brrip)\b/.test(lower)) return 'BluRay'
    if (/\b(web[- ._]?dl|webdl)\b/.test(lower)) return 'WEB-DL'
    if (/\b(web[- ._]?rip|webrip)\b/.test(lower)) return 'WEBRip'
    if (/\b(hdtv|pdtv|dsr)\b/.test(lower)) return 'HDTV'
    if (/\b(dvdrip|dvd[- ._]?r)\b/.test(lower)) return 'DVDRip'
    if (/\b(camrip|cam[- ._]?rip|hdcam|\bcam\b)\b/.test(lower)) return 'CAM'
    if (/\b(telesync|ts[- ._]?rip|\bts\b|hdts)\b/.test(lower)) return 'TS'
    if (/\b(screener|dvdscr|\bscr\b)\b/.test(lower)) return 'SCR'
    return 'Unknown'
  }

  private static detectVisualTags(text: string): StreamVisualTag[] {
    const tags: StreamVisualTag[] = []
    const lower = text.toLowerCase()

    if (/\b(dv|dovi|dolby[- ._]?vision)\b/.test(lower)) tags.push('DV')
    if (/\bhdr10\+(?!\w)|\bhdr10plus\b/.test(lower)) tags.push('HDR10+')
    else if (/\bhdr10\b/.test(lower)) tags.push('HDR10')
    else if (/\bhdr\b/.test(lower)) tags.push('HDR')
    if (/\bhlg\b/.test(lower)) tags.push('HLG')
    if (/\b(10bit|10-bit|hi10p)\b/.test(lower)) tags.push('10bit')
    if (/\bimax\b/.test(lower)) tags.push('IMAX')
    if (/\b3d\b/.test(lower)) tags.push('3D')

    return tags
  }

  private static detectAudioTags(text: string): StreamAudioTag[] {
    const tags: StreamAudioTag[] = []
    const lower = text.toLowerCase()

    if (/\batmos\b/.test(lower)) tags.push('Atmos')
    if (/\btruehd\b/.test(lower)) tags.push('TrueHD')
    if (/\b(dts[- ._]?hd[- ._]?ma|dts[- ._]?ma)\b/.test(lower)) tags.push('DTS-HD MA')
    else if (/\bdts[- ._]?hd\b/.test(lower)) tags.push('DTS-HD')
    else if (/\bdts\b/.test(lower)) tags.push('DTS')
    if (/\b(dd\+|eac3|e-ac-3|ddp)\b/.test(lower)) tags.push('DD+')
    else if (/\b(dd|ac3|ac-3|dolby[- ._]?digital)\b/.test(lower)) tags.push('DD')
    if (/\baac\b/.test(lower)) tags.push('AAC')
    if (/\bflac\b/.test(lower)) tags.push('FLAC')
    if (/\bopus\b/.test(lower)) tags.push('Opus')

    return tags
  }

  private static detectAudioChannels(text: string): string | undefined {
    if (/\b7\.1\b/.test(text)) return '7.1'
    if (/\b5\.1\b/.test(text)) return '5.1'
    if (/\b2\.0\b/.test(text)) return '2.0'
    return undefined
  }

  private static detectCodecs(text: string): StreamCodec[] {
    const codecs: StreamCodec[] = []
    const lower = text.toLowerCase()

    if (/\b(hevc|x265|h265|h\.265)\b/.test(lower)) codecs.push('HEVC')
    if (/\b(avc|x264|h264|h\.264)\b/.test(lower)) codecs.push('AVC')
    if (/\bav1\b/.test(lower)) codecs.push('AV1')
    if (/\bxvid\b/.test(lower)) codecs.push('XviD')

    return codecs
  }

  private static detectLanguages(text: string): { languages: string[]; languageEmojis: string[] } {
    const languages: string[] = []
    const languageEmojis: string[] = []
    const lower = text.toLowerCase()

    const map: Array<{ name: string; emoji: string; regex: RegExp }> = [
      { name: 'English', emoji: '🇬🇧', regex: /\b(english|eng|en)\b/ },
      { name: 'Spanish', emoji: '🇪🇸', regex: /\b(spanish|spa|es|castellano|latino)\b/ },
      { name: 'French', emoji: '🇫🇷', regex: /\b(french|fre|fr|vff|vfq)\b/ },
      { name: 'German', emoji: '🇩🇪', regex: /\b(german|ger|de|deutsch)\b/ },
      { name: 'Italian', emoji: '🇮🇹', regex: /\b(italian|ita|it)\b/ },
      { name: 'Portuguese', emoji: '🇧🇷', regex: /\b(portuguese|por|pt|pt-br)\b/ },
      { name: 'Russian', emoji: '🇷🇺', regex: /\b(russian|rus|ru)\b/ },
      { name: 'Japanese', emoji: '🇯🇵', regex: /\b(japanese|jpn|ja|jp)\b/ },
      { name: 'Korean', emoji: '🇰🇷', regex: /\b(korean|kor|ko)\b/ },
      { name: 'Hindi', emoji: '🇮🇳', regex: /\b(hindi|hin|hi)\b/ },
      { name: 'Chinese', emoji: '🇨🇳', regex: /\b(chinese|chi|zh)\b/ },
      { name: 'Multi', emoji: '🌐', regex: /\b(multi|multisubs?)\b/ },
      { name: 'Dual audio', emoji: '👥', regex: /\b(dual[- ._]?audio)\b/ },
    ]

    for (const item of map) {
      if (item.regex.test(lower)) {
        languages.push(item.name)
        languageEmojis.push(item.emoji)
      }
    }

    return { languages, languageEmojis }
  }

  private static detectSize(text: string): { sizeBytes?: number; sizeFormatted?: string } {
    const match = text.match(/(?:📦|💾|size:?\s*)?(\d+(?:\.\d+)?)\s*(GB|MB|GiB|MiB|TB)\b/i)
    if (!match) return {}

    const value = parseFloat(match[1])
    const unit = match[2].toUpperCase()
    let sizeBytes = 0

    if (unit.startsWith('TB')) sizeBytes = value * 1024 * 1024 * 1024 * 1024
    else if (unit.startsWith('GB') || unit.startsWith('GIB')) sizeBytes = value * 1024 * 1024 * 1024
    else if (unit.startsWith('MB') || unit.startsWith('MIB')) sizeBytes = value * 1024 * 1024

    const formatted = `${value.toFixed(2)} ${unit.replace('IB', 'B')}`
    return { sizeBytes, sizeFormatted: formatted }
  }

  private static detectSeeders(text: string): number | undefined {
    const match = text.match(/(?:👥|👤|🌱|🌿|seeders?:?)\s*(\d+)/i)
    if (match) return parseInt(match[1], 10)
    return undefined
  }

  private static detectReleaseGroup(text: string): string | undefined {
    const commonGroups = [
      'FraMeSToR',
      'FLUX',
      'GalaxyRG',
      'YTS',
      'TGx',
      'RARBG',
      'BHDStudio',
      'hallowed',
      'SWTYBLZ',
      'NTb',
      'KONTRAST',
      'playBD',
      'CRFW',
      'SiC',
      'ION10',
    ]

    for (const grp of commonGroups) {
      const reg = new RegExp(`\\b${grp}\\b`, 'i')
      if (reg.test(text)) return grp
    }

    const trailingMatch = text.match(/[-_]([A-Za-z0-9]+)(?:\.[a-z0-9]{2,4})?(?:\s|$)/)
    if (trailingMatch && trailingMatch[1].length >= 2 && trailingMatch[1].length <= 15) {
      return trailingMatch[1]
    }

    return undefined
  }

  private static detectIndexer(text: string): string | undefined {
    const indexers = [
      'TorrentGalaxy',
      '1337x',
      'YTS',
      'EZTV',
      'ThePirateBay',
      'Nyaa',
      'AnimeTosho',
      'BitSearch',
      'SolidTorrents',
      'MagnetDL',
    ]
    for (const idx of indexers) {
      if (new RegExp(`\\b${idx}\\b`, 'i').test(text)) return idx
    }
    return undefined
  }

  private static detectCached(text: string, stream: StremioStream): boolean {
    const lower = text.toLowerCase()
    if (
      text.includes('⚡') ||
      text.includes('[+]') ||
      lower.includes('ready') ||
      lower.includes('instant') ||
      lower.includes('cached')
    ) {
      return true
    }
    if (lower.includes('download]') || lower.includes('uncached') || lower.includes('not ready')) {
      return false
    }
    // If stream has a direct HTTP playback URL (e.g. from Torbox/RD link generator), it is cached
    if (stream.url && (stream.url.includes('torbox.app') || stream.url.includes('real-debrid.com'))) {
      return true
    }
    return false
  }

  private static detectFilename(text: string): string | undefined {
    const fileMatch = text.match(/([a-zA-Z0-9_. -]+\.(?:mkv|mp4|avi|ts))/i)
    if (fileMatch) return fileMatch[1].trim()
    return undefined
  }

  private static detectMediaTitle(
    text: string,
    filename?: string
  ): { title?: string; year?: number; season?: number; episode?: number } {
    const src = filename || text
    const yearMatch = src.match(/\b(19\d\d|20\d\d)\b/)
    const year = yearMatch ? parseInt(yearMatch[1], 10) : undefined

    const seMatch = src.match(/[Ss](\d{1,2})[Ee](\d{1,3})/)
    let season: number | undefined
    let episode: number | undefined
    if (seMatch) {
      season = parseInt(seMatch[1], 10)
      episode = parseInt(seMatch[2], 10)
    }

    let title: string | undefined
    if (yearMatch) {
      const idx = src.indexOf(yearMatch[1])
      if (idx > 0) {
        title = src.substring(0, idx).replace(/[._]/g, ' ').trim()
      }
    }

    return { title, year, season, episode }
  }
}
