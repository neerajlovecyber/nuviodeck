import { ParsedStreamMetadata, StremioStream, StreamFormatterOptions } from './types'

export class StreamFormatter {
  static format(
    stream: ParsedStreamMetadata,
    options?: StreamFormatterOptions
  ): StremioStream {
    const preset = options?.preset || 'prism'
    const viewMode = options?.viewMode || 'full'

    if (options?.customTemplate) {
      return this.formatCustom(stream, options.customTemplate)
    }

    switch (preset) {
      case 'xperience':
        return this.formatXperience(stream, viewMode)
      case 'charcoal':
        return this.formatCharcoal(stream, viewMode)
      case 'streamsense':
        return this.formatStreamSense(stream, viewMode)
      case 'neds':
        return this.formatNeds(stream, viewMode)
      case 'linden':
        return this.formatLinden(stream, viewMode, false)
      case 'linden_monochrome':
        return this.formatLinden(stream, viewMode, true)
      case 'shota_simple':
        return this.formatShotaSimple(stream, viewMode)
      case 'prism':
      default:
        return this.formatPrism(stream, viewMode)
    }
  }

  // --- 1. Prism (Default) ---
  private static formatPrism(
    stream: ParsedStreamMetadata,
    viewMode: string
  ): StremioStream {
    const resMap: Record<string, string> = {
      '2160p': '🔥 4K UHD',
      '1440p': '✨ QHD',
      '1080p': '🚀 FHD',
      '720p': '💿 HD',
      '576p': '📺 SD',
      '480p': '📺 SD',
    }
    const name = resMap[stream.resolution] || `📺 ${stream.resolution.toUpperCase()}`

    const lines: string[] = []
    const titleStr = stream.title
      ? `${stream.title}${stream.year ? ` (${stream.year})` : ''}`
      : stream.filename || stream.rawTitle

    lines.push(`🎥 ${titleStr}`)

    const visualStr = stream.visualTags.length > 0 ? ` 📺 ${stream.visualTags.join(' | ')}` : ''
    lines.push(`🎥 ${stream.quality}${visualStr}`)

    const audioStr = stream.audioTags.length > 0 ? stream.audioTags.join(' | ') : 'Stereo'
    const chanStr = stream.audioChannels ? ` 🔊 ${stream.audioChannels}` : ''
    lines.push(`🎧 ${audioStr}${chanStr}`)

    const sizeStr = stream.sizeFormatted ? `📦 ${stream.sizeFormatted}` : ''
    const seedStr = stream.seeders !== undefined ? `🌿 ${stream.seeders}` : ''
    const sizeLine = [sizeStr, seedStr].filter(Boolean).join(' ')
    if (sizeLine) lines.push(sizeLine)

    const metaLine = [
      stream.releaseGroup ? `🏷️ ${stream.releaseGroup}` : '',
      stream.indexer ? `📡 ${stream.indexer}` : '',
      `🔍 ${stream.sourceName}`,
    ].filter(Boolean).join(' ')
    lines.push(metaLine)

    const serviceName = stream.debridService
      ? stream.debridService.charAt(0).toUpperCase() + stream.debridService.slice(1)
      : 'TB'
    const statusLine = stream.cached
      ? `⚡ Ready (${serviceName}) 🔒 Not Proxied`
      : `⏳ Downloading (${serviceName})`
    lines.push(statusLine)

    const description = this.applyViewMode(lines, viewMode)

    return {
      ...stream.originalStream,
      name,
      description,
      title: description, // for Stremio clients that use title instead of description
    }
  }

  // --- 2. Xperience ---
  private static formatXperience(
    stream: ParsedStreamMetadata,
    viewMode: string
  ): StremioStream {
    const resMap: Record<string, string> = {
      '2160p': '🖥️ UHD',
      '1440p': '🖥️ QHD',
      '1080p': '🖥️ FHD',
      '720p': '🖥️ HD',
    }
    const name = resMap[stream.resolution] || `🖥️ ${stream.resolution.toUpperCase()}`

    const lines: string[] = []
    const titleStr = stream.title
      ? `${stream.title}${stream.year ? ` (${stream.year})` : ''}`
      : stream.filename || stream.rawTitle

    lines.push(`📦 ${titleStr}`)
    if (stream.sizeFormatted) lines.push(`📦 ${stream.sizeFormatted}`)

    const serviceName = stream.debridService || 'Debrid'
    lines.push(`💚 ${serviceName} • ${stream.sourceName}`)

    const description = this.applyViewMode(lines, viewMode)

    return {
      ...stream.originalStream,
      name,
      description,
      title: description,
    }
  }

  // --- 3. Charcoal ---
  private static formatCharcoal(
    stream: ParsedStreamMetadata,
    viewMode: string
  ): StremioStream {
    const sizeStr = stream.sizeFormatted ? ` | 💾 ${stream.sizeFormatted}` : ''
    const name = `🖥️ ${stream.resolution.replace('2160p', '4K')}${sizeStr}`

    const lines: string[] = []
    const audio = stream.audioTags.join(' • ') || 'Stereo'
    const chan = stream.audioChannels || '2.0'
    lines.push(`Ξ --- • ${audio} • ${chan}`)

    const visuals = stream.visualTags.join(' • ') || 'SDR'
    lines.push(`Ξ ${stream.quality} • --- • ${visuals}`)

    const serviceShort = (stream.debridService || 'TB').substring(0, 2).toUpperCase()
    const grp = stream.releaseGroup || 'P2P'
    lines.push(`Ξ ${stream.sourceName} • ${grp} • [${serviceShort}]`)

    const titleStr = stream.title || stream.filename || 'Media'
    const yr = stream.year ? ` • ${stream.year}` : ''
    lines.push(`Ξ ${titleStr}${yr}`)

    const description = this.applyViewMode(lines, viewMode)

    return {
      ...stream.originalStream,
      name,
      description,
      title: description,
    }
  }

  // --- 4. StreamSense ---
  private static formatStreamSense(
    stream: ParsedStreamMetadata,
    viewMode: string
  ): StremioStream {
    const serviceShort = (stream.debridService || 'TB').substring(0, 2).toUpperCase()
    const name = `⚜️ ${stream.resolution.replace('2160p', '4K UHD')}\n❖ ${stream.sourceName}\n[${serviceShort} ⚡]`

    const lines: string[] = []
    lines.push(`🎥 ${stream.quality}`)
    if (stream.visualTags.length > 0) lines.push(`💠 ${stream.visualTags.join(' | ')}`)

    const audio = stream.audioTags.join(' | ') || 'Stereo'
    const chan = stream.audioChannels ? ` 🎧 ${stream.audioChannels}` : ''
    lines.push(`🎧 ${audio}${chan}`)

    if (stream.sizeFormatted) lines.push(`📦 ${stream.sizeFormatted}`)
    lines.push(`🌐 Debrid`)

    const titleStr = stream.title
      ? `${stream.title}${stream.year ? ` (${stream.year})` : ''}`
      : stream.filename || stream.rawTitle
    lines.push(`🎥 ${titleStr}`)

    const description = this.applyViewMode(lines, viewMode)

    return {
      ...stream.originalStream,
      name,
      description,
      title: description,
    }
  }

  // --- 5. Ned's Formatter ---
  private static formatNeds(
    stream: ParsedStreamMetadata,
    viewMode: string
  ): StremioStream {
    const name = `✨ ${stream.resolution}`

    const lines: string[] = []
    const titleStr = stream.title
      ? `${stream.title}${stream.year ? ` (${stream.year})` : ''}`
      : stream.filename || stream.rawTitle
    lines.push(`🎟️ ${titleStr}`)

    const visualStr = stream.visualTags.length > 0 ? ` 📺 ${stream.visualTags.join(' | ')}` : ''
    lines.push(`🎥 ${stream.quality}${visualStr}`)

    const audio = stream.audioTags.join(' | ') || 'Stereo'
    const chan = stream.audioChannels ? ` 🔊 ${stream.audioChannels}` : ''
    lines.push(`🎧 ${audio}${chan}`)

    const sizeStr = stream.sizeFormatted ? `📦 ${stream.sizeFormatted}` : ''
    const grpStr = stream.releaseGroup ? `🏷️ ${stream.releaseGroup}` : ''
    lines.push([sizeStr, grpStr].filter(Boolean).join(' '))

    const description = this.applyViewMode(lines, viewMode)

    return {
      ...stream.originalStream,
      name,
      description,
      title: description,
    }
  }

  // --- 6 & 7. Linden & Linden Monochrome ---
  private static formatLinden(
    stream: ParsedStreamMetadata,
    viewMode: string,
    monochrome: boolean
  ): StremioStream {
    const visuals = stream.visualTags.join(' ° ')
    const name = `${stream.resolution.replace('2160p', '4K')}${visuals ? ` | ${visuals}` : ''}\n${monochrome ? '' : '🔱 '}${stream.sourceName}`

    const lines: string[] = []
    lines.push(`${monochrome ? '' : '🎥 '}${stream.title || stream.filename || 'Media'}`)
    lines.push(`${monochrome ? '' : '🎥 '}${stream.quality}`)

    const audio = stream.audioTags.join(' • ') || 'Stereo'
    const chan = stream.audioChannels ? ` 「${stream.audioChannels}」` : ''
    lines.push(`${monochrome ? '' : '🎧 '}${audio}${chan}`)

    const sizeStr = stream.sizeFormatted ? `${monochrome ? '' : '📦 '}${stream.sizeFormatted}` : ''
    const seedStr = stream.seeders !== undefined ? `${monochrome ? '' : '🌿 '}${stream.seeders}` : ''
    const idxStr = stream.indexer ? `( ${stream.indexer} )` : ''
    lines.push([sizeStr, seedStr, idxStr].filter(Boolean).join(' | '))

    const description = this.applyViewMode(lines, viewMode)

    return {
      ...stream.originalStream,
      name,
      description,
      title: description,
    }
  }

  // --- 8. Shota Simple ---
  private static formatShotaSimple(
    stream: ParsedStreamMetadata,
    viewMode: string
  ): StremioStream {
    const serviceName = (stream.debridService || 'RD').substring(0, 2).toUpperCase()
    const name = `[${serviceName}] ${stream.resolution} - ${stream.quality}`

    const titleStr = stream.title
      ? `${stream.title}${stream.year ? ` (${stream.year})` : ''}`
      : stream.filename || stream.rawTitle
    const sizeStr = stream.sizeFormatted ? ` - ${stream.sizeFormatted}` : ''
    const description = `📁 ${titleStr}${sizeStr}`

    return {
      ...stream.originalStream,
      name,
      description,
      title: description,
    }
  }

  // --- Custom Template Engine ---
  private static formatCustom(
    stream: ParsedStreamMetadata,
    template: string
  ): StremioStream {
    const replacements: Record<string, string> = {
      '{stream.resolution}': stream.resolution,
      '{stream.quality}': stream.quality,
      '{stream.size}': stream.sizeFormatted || '',
      '{stream.seeders}': stream.seeders !== undefined ? String(stream.seeders) : '',
      '{stream.releaseGroup}': stream.releaseGroup || '',
      '{stream.indexer}': stream.indexer || '',
      '{stream.visualTags}': stream.visualTags.join(' | '),
      '{stream.audioTags}': stream.audioTags.join(' | '),
      '{stream.audioChannels}': stream.audioChannels || '',
      '{stream.title}': stream.title || stream.rawTitle,
      '{stream.year}': stream.year ? String(stream.year) : '',
      '{addon.name}': stream.sourceName,
      '{service.name}': stream.debridService || '',
      '{service.shortName}': (stream.debridService || 'TB').substring(0, 2).toUpperCase(),
    }

    let formatted = template
    for (const [key, val] of Object.entries(replacements)) {
      formatted = formatted.replaceAll(key, val)
    }

    return {
      ...stream.originalStream,
      name: stream.resolution,
      description: formatted,
      title: formatted,
    }
  }

  private static applyViewMode(lines: string[], viewMode: string): string {
    if (viewMode === 'sparse') {
      return lines.slice(0, 2).join('\n')
    }
    if (viewMode === 'episode') {
      // Prioritize top title line + quality line + size/debrid line
      return lines.slice(0, 3).join('\n')
    }
    return lines.join('\n')
  }
}
