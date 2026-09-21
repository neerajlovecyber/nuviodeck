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
    const { sizeBytes, sizeFormatted, folderSizeBytes, folderSizeFormatted } = this.detectSize(rawText)
    const seeders = this.detectSeeders(rawText)
    const releaseGroup = this.detectReleaseGroup(rawText)
    const indexer = this.detectIndexer(rawText)
    const ottPlatform = this.detectOttPlatform(rawText)
    const movieCut = this.detectMovieCut(rawText)
    const cached = this.detectCached(rawText, stream)
    const filename = this.detectFilename(rawText, stream)
    const { title, year, season, episode } = this.detectMediaTitle(rawText, filename, stream)
    const seadex = this.detectSeaDex(rawText)
    const seadexBest = this.detectSeaDexBest(rawText)
    const duration = this.detectDuration(rawText)
    const age = this.detectAge(rawText)
    const streamType = this.detectStreamType(rawText, stream, cached)
    const proxied = this.detectProxied(rawText)
    const library = this.detectLibrary(rawText)
    const message = this.detectMessage(rawText)

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
      folderSizeBytes,
      folderSizeFormatted,
      seeders,
      releaseGroup,
      indexer,
      ottPlatform,
      movieCut,
      duration,
      age,
      message,
      type: streamType,
      proxied,
      library,
      seadex,
      seadexBest,
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
    if (/\b(web[- ._]?dl|webdl)\b|[⟨<]web(?:[- ._]?(?:dl|di))?[⟩>]|\bweb\b/i.test(lower)) return 'WEB-DL'
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

  private static normalizeUnicodeText(text: string): string {
    const smallCapsMap: Record<string, string> = {
      'ᴀ': 'a', 'ʙ': 'b', 'ᴄ': 'c', 'ᴅ': 'd', 'ᴇ': 'e', 'ғ': 'f', 'ɢ': 'g', 'ʜ': 'h',
      'ɪ': 'i', 'ᴊ': 'j', 'ᴋ': 'k', 'ʟ': 'l', 'ᴍ': 'm', 'ɴ': 'n', 'ᴏ': 'o', 'ᴘ': 'p',
      'ǫ': 'q', 'ʀ': 'r', 's': 's', 'ᴛ': 't', 'ᴜ': 'u', 'ᴠ': 'v', 'ᴡ': 'w', 'x': 'x',
      'ʏ': 'y', 'ᴢ': 'z'
    }
    let norm = text.replace(/[ᴀ-ᴢ]/g, (ch) => smallCapsMap[ch] || ch)
    if (norm.includes('🇮🇳')) norm += ' hindi '
    if (norm.includes('🇰🇷')) norm += ' korean '
    if (norm.includes('🇯🇵')) norm += ' japanese '
    if (norm.includes('🇷🇺')) norm += ' russian '
    if (norm.includes('🇪🇸')) norm += ' spanish '
    if (norm.includes('🇫🇷')) norm += ' french '
    if (norm.includes('🇩🇪')) norm += ' german '
    if (norm.includes('🇮🇹')) norm += ' italian '
    if (norm.includes('🇧🇷')) norm += ' portuguese '
    if (norm.includes('🇨🇳')) norm += ' chinese '
    if (norm.includes('🇬🇧') || norm.includes('🇺🇸')) norm += ' english '
    return norm
  }

  private static detectLanguages(text: string): { languages: string[]; languageEmojis: string[] } {
    const languages: string[] = []
    const languageEmojis: string[] = []
    const lower = this.normalizeUnicodeText(text).toLowerCase()

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
      { name: 'Telugu', emoji: '🇮🇳', regex: /\b(telugu|tel|te)\b/ },
      { name: 'Tamil', emoji: '🇮🇳', regex: /\b(tamil|tam|ta)\b/ },
      { name: 'Malayalam', emoji: '🇮🇳', regex: /\b(malayalam|mal|ml)\b/ },
      { name: 'Kannada', emoji: '🇮🇳', regex: /\b(kannada|kan|kn)\b/ },
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

  private static detectSize(text: string): {
    sizeBytes?: number
    sizeFormatted?: string
    folderSizeBytes?: number
    folderSizeFormatted?: string
  } {
    const match = text.match(
      /(?:📦|💾|size:?\s*)?(\d+(?:\.\d+)?)\s*(GB|MB|GiB|MiB|TB|Gb|Mb)\b(?:\s*(?:\/|\band\b)\s*(?:📦|💾)?\s*(\d+(?:\.\d+)?)\s*(GB|MB|GiB|MiB|TB|Gb|Mb)\b)?/i
    )
    if (!match) return {}

    const value1 = parseFloat(match[1])
    const unit1 = match[2].toUpperCase().replace('IB', 'B').replace('GB', 'GB').replace('MB', 'MB').replace('TB', 'TB')
    const sizeBytes = this.toBytes(value1, unit1)
    const sizeFormatted = `${value1.toFixed(2)} ${unit1}`

    let folderSizeBytes: number | undefined
    let folderSizeFormatted: string | undefined

    if (match[3] && match[4]) {
      const value2 = parseFloat(match[3])
      const unit2 = match[4].toUpperCase().replace('IB', 'B')
      const bytes2 = this.toBytes(value2, unit2)
      if (bytes2 > sizeBytes) {
        folderSizeBytes = bytes2
        folderSizeFormatted = `${value2.toFixed(2)} ${unit2}`
      }
    }

    return { sizeBytes, sizeFormatted, folderSizeBytes, folderSizeFormatted }
  }

  private static toBytes(val: number, unit: string): number {
    const u = unit.toUpperCase()
    if (u.startsWith('TB')) return val * 1024 * 1024 * 1024 * 1024
    if (u.startsWith('GB')) return val * 1024 * 1024 * 1024
    if (u.startsWith('MB')) return val * 1024 * 1024
    return val * 1024
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
      /\[[A-Za-z0-9]+\+\]/.test(text) ||
      lower.includes('ready') ||
      lower.includes('instant') ||
      lower.includes('cached') ||
      (stream.url && stream.url.includes('/resolve/'))
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

  private static detectFilename(text: string, stream?: StremioStream): string | undefined {
    const candidates = [stream?.title, text]
    for (const cand of candidates) {
      if (!cand) continue
      const lines = cand.split('\n')
      for (const line of lines) {
        const fileMatch = line.match(/([a-zA-Z0-9_. \-+()[\]]+\.(?:mkv|mp4|avi|ts|m4v|webm))/i)
        if (fileMatch) return fileMatch[1].trim()
      }
    }
    return undefined
  }

  private static detectMediaTitle(
    text: string,
    filename?: string,
    stream?: StremioStream
  ): { title?: string; year?: number; season?: number; episode?: number } {
    let targetLine = ''

    // 1. Pick the single line that represents the media/show release
    const candidates = [stream?.title, stream?.description, filename, text].filter(Boolean) as string[]
    for (const cand of candidates) {
      const lines = cand.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)
      for (const line of lines) {
        if (
          /[✏️🎬📁🎟️]/.test(line) ||
          /[Ss](\d{1,2})[·.\s_-]?[Ee](\d{1,3})/.test(line) ||
          /\b(19\d\d|20\d\d)\b/.test(line) ||
          /\.(?:mkv|mp4|avi|ts)/i.test(line)
        ) {
          targetLine = line
          break
        }
      }
      if (targetLine) break
      if (lines.length > 0 && !targetLine) {
        targetLine = lines[0]
      }
    }

    if (!targetLine && filename) {
      targetLine = filename
    }
    if (!targetLine) {
      targetLine = text.split('\n')[0]?.trim() || ''
    }

    // 2. Strip leading scraper/metadata badges, bracketed tags, rating stars, and emojis
    let clean = targetLine
      .replace(/^[a-zA-Z0-9_\-+]+\[.*?\]\s*/, '')
      .replace(/^\[.*?\]\s*/, '')
      .replace(/^[🔥⚡⭐🌟★✨🎬📁🎟️✏️📽️📺🎞️📦💾🌐🌎]+\s*/u, '')
      .replace(/^(?:\d+k|\d+p|\([^)]*\)|\[[^\]]*\]|⟨[^⟩]*⟩|[★☆·•\-|\s])+/iu, '')
      .replace(/^[🔥⚡⭐🌟★✨🎬📁🎟️✏️📽️📺🎞️📦💾🌐🌎]+\s*/u, '')
      .trim()

    // 3. Detect Season & Episode: S01E01, S01·E01, s1 e1, 1x01
    let season: number | undefined
    let episode: number | undefined
    const seMatch = clean.match(/[Ss](\d{1,2})[·.\s_-]?[Ee](\d{1,3})/)
    const xMatch = clean.match(/\b(\d{1,2})x(\d{1,3})\b/)
    if (seMatch) {
      season = parseInt(seMatch[1], 10)
      episode = parseInt(seMatch[2], 10)
    } else if (xMatch) {
      season = parseInt(xMatch[1], 10)
      episode = parseInt(xMatch[2], 10)
    }

    // 4. Detect Year: 19xx or 20xx
    const yearMatch = clean.match(/\b(19\d\d|20\d\d)\b/)
    const year = yearMatch ? parseInt(yearMatch[1], 10) : undefined

    // 5. Extract clean Title
    let title: string | undefined
    if (seMatch) {
      const idx = clean.indexOf(seMatch[0])
      if (idx > 0) {
        title = clean.substring(0, idx)
      }
    } else if (xMatch) {
      const idx = clean.indexOf(xMatch[0])
      if (idx > 0) {
        title = clean.substring(0, idx)
      }
    } else if (yearMatch) {
      const idx = clean.indexOf(yearMatch[1])
      if (idx > 0) {
        title = clean.substring(0, idx)
      }
    } else if (filename) {
      title = filename.replace(/\.(?:mkv|mp4|avi|ts|m4v|webm)$/i, '')
    } else {
      title = clean
    }

    if (title) {
      title = title
        .replace(/\b(2160p|1440p|1080p|720p|576p|480p|4k|uhd|fhd|hd|sd)\b/gi, '')
        .replace(/\b(web[- ._]?dl|webrip|bluray|remux|hdtv|dvdrip|cam|ts|scr)\b/gi, '')
        .replace(/\b(hevc|avc|x265|x264|h265|h264|10bit|hdr|dv|ddp|dd\+|aac|dts)\b/gi, '')
        .replace(/\.(mkv|mp4|avi|ts)$/i, '')
        .replace(/[._]/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/^[^\w\s]+|[^\w\s]+$/g, '')
        .trim()
    }

    if (title && title.includes('\n')) {
      title = title.split('\n')[0].trim()
    }

    return { title: title || undefined, year, season, episode }
  }

  private static detectOttPlatform(text: string): string | undefined {
    const lower = text.toLowerCase()
    if (/\b(amzn|prime\s*video|prme)\b/.test(lower)) return 'Prime Video'
    if (/\b(netflix|\bnf\b)\b/.test(lower)) return 'Netflix'
    if (/\b(disney\+?|dsnp)\b/.test(lower)) return 'Disney+'
    if (/\b(hbo\s*max|hmax|max)\b/.test(lower)) return 'HBO Max'
    if (/\b(apple\s*tv\+?|aptv)\b/.test(lower)) return 'Apple TV+'
    if (/\bhulu\b/.test(lower)) return 'Hulu'
    if (/\b(paramount\+?|pmtp)\b/.test(lower)) return 'Paramount+'
    if (/\b(peacock|pckk)\b/.test(lower)) return 'Peacock'
    if (/\b(crunchyroll|crtc)\b/.test(lower)) return 'Crunchyroll'
    if (/\b(anime\s*plex|anpx)\b/.test(lower)) return 'Anime Plex'
    if (/\b(starz|stz)\b/.test(lower)) return 'Starz'
    if (/\b(discovery\+?|dscv)\b/.test(lower)) return 'Discovery+'
    return undefined
  }

  private static detectMovieCut(text: string): string | undefined {
    const lower = text.toLowerCase()
    if (/\bextended(\s*cut|\s*edition)?\b/.test(lower)) return 'Extended Cut'
    if (/\b(director'?s\s*cut|\.dc\.)\b/.test(lower)) return "Director's Cut"
    if (/\btheatrical(\s*cut|\s*edition)?\b/.test(lower)) return 'Theatrical Cut'
    if (/\bultimate(\s*cut|\s*edition)?\b/.test(lower)) return 'Ultimate Edition'
    if (/\balternate(\s*cut|\s*edition)?\b/.test(lower)) return 'Alternate Edition'
    if (/\bredux\b/.test(lower)) return 'Redux'
    if (/\bcomplete(\s*cut|\s*edition)?\b/.test(lower)) return 'Complete Edition'
    if (/\banniversary(\s*cut|\s*edition)?\b/.test(lower)) return 'Anniversary Edition'
    if (/\bremastered\b/.test(lower)) return 'Remastered'
    if (/\bspecial\s*edition\b/.test(lower)) return 'Special Edition'
    if (/\bcollector'?s\s*edition\b/.test(lower)) return "Collector's Edition"
    if (/\bunrated(\s*cut)?\b/.test(lower)) return 'Unrated Cut'
    if (/\buncensored\b/.test(lower)) return 'Uncensored'
    if (/\bworkprint\b/.test(lower)) return 'Workprint'
    if (/\bpreview(\s*cut)?\b/.test(lower)) return 'Preview Cut'
    if (/\bfestival(\s*cut)?\b/.test(lower)) return 'Festival Cut'
    if (/\bsuperfan(\s*edition)?\b/.test(lower)) return 'Superfan Edition'
    if (/\bseadex\b/.test(lower)) return 'SeaDex'
    return undefined
  }

  private static detectSeaDex(text: string): boolean {
    const lower = text.toLowerCase()
    return lower.includes('seadex') || text.includes('🌊') || text.includes('💦')
  }

  private static detectSeaDexBest(text: string): boolean {
    const lower = text.toLowerCase()
    return lower.includes('seadex best') || lower.includes('seadex-best') || text.includes('🌊')
  }

  private static detectDuration(text: string): number | undefined {
    // Check 1h 45m or 105m or duration: 6300
    const hmMatch = text.match(/(?:duration:?\s*|⏱️\s*)?(\d+)\s*h(?:ours?)?\s*(\d+)?\s*m(?:in(?:utes?)?)?/i)
    if (hmMatch) {
      const h = parseInt(hmMatch[1], 10)
      const m = hmMatch[2] ? parseInt(hmMatch[2], 10) : 0
      return h * 3600 + m * 60
    }
    const minMatch = text.match(/(?:duration:?\s*|⏱️\s*)(\d+)\s*m(?:in(?:utes?)?)?\b/i)
    if (minMatch) {
      return parseInt(minMatch[1], 10) * 60
    }
    return undefined
  }

  private static detectAge(text: string): string | undefined {
    const match = text.match(/(?:📅\s*|age:?\s*)(\d+\s*[dwmy])\b/i)
    if (match) return match[1].trim()
    return undefined
  }

  private static detectStreamType(text: string, stream: StremioStream, cached: boolean): string {
    const lower = text.toLowerCase()
    if (lower.includes('usenet') || lower.includes('📰 usenet') || lower.includes('♻️ usenet')) return 'usenet'
    if (lower.includes('live') || lower.includes('📡 live')) return 'live'
    if (lower.includes('youtube') || lower.includes('▶️ youtube')) return 'youtube'
    if (stream.url && (stream.url.startsWith('http://') || stream.url.startsWith('https://'))) {
      if (cached) return 'debrid'
      return 'http'
    }
    if (stream.infoHash) {
      return cached ? 'debrid' : 'p2p'
    }
    return cached ? 'debrid' : 'external'
  }

  private static detectProxied(text: string): boolean {
    const lower = text.toLowerCase()
    return (
      text.includes('🔒') ||
      text.includes('🕵️‍♂️') ||
      lower.includes('proxied') ||
      text.includes('☷')
    ) && !lower.includes('not proxied') && !text.includes('🔓')
  }

  private static detectLibrary(text: string): boolean {
    const lower = text.toLowerCase()
    return text.includes('📌') || text.includes('🔰') || text.includes('📚') || lower.includes('library')
  }

  private static detectMessage(text: string): string | undefined {
    const match = text.match(/(?:ℹ️|⌗|ⓘ)\s*([^\n\r]+)/)
    if (match) return match[1].trim()
    return undefined
  }
}

