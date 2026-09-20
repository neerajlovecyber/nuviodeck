import { ParsedStreamMetadata, StremioStream, StreamFormatterOptions } from './types'
import streamPresets from '../../data/stream-presets.json'

interface PresetDef {
  id: string
  label: string
  nameTemplate: string
  descriptionTemplate: string
}

export class StreamMicroSyntaxEngine {
  private static readonly REMOVE_LINE_TOKEN = '<<REMOVE_LINE>>'

  /**
   * Evaluates a template string against stream metadata context.
   */
  static render(template: string, stream: ParsedStreamMetadata): string {
    if (!template) return ''
    const context = this.buildContext(stream)
    return this.evaluateTemplate(template, context)
  }

  /**
   * Builds the comprehensive evaluation context conforming to Xperience stream properties.
   */
  static buildContext(stream: ParsedStreamMetadata): Record<string, any> {
    const serviceName = stream.debridService
      ? stream.debridService.charAt(0).toUpperCase() + stream.debridService.slice(1)
      : 'Debrid'
    const serviceShort = this.getShortDebridName(stream.debridService)

    const streamType =
      stream.type ||
      (stream.url?.startsWith('http')
        ? 'http'
        : stream.cached
        ? 'debrid'
        : stream.infoHash
        ? 'p2p'
        : 'debrid')

    const seasonEpisode: string[] = []
    if (stream.season !== undefined && stream.episode !== undefined) {
      const s = `S${String(stream.season).padStart(2, '0')}`
      const e = `E${String(stream.episode).padStart(2, '0')}`
      seasonEpisode.push(`${s}${e}`)
    }

    const sizeFormatted = stream.sizeFormatted || (stream.sizeBytes ? this.formatBytes(stream.sizeBytes) : '')

    return {
      stream: {
        resolution: stream.resolution,
        quality: stream.quality,
        visualTags: stream.visualTags || [],
        audioTags: stream.audioTags || [],
        audioChannels: stream.audioChannels ? [stream.audioChannels] : [],
        encode: stream.codecs?.join(' ') || '',
        codecs: stream.codecs || [],
        languages: stream.languages || [],
        languageCodes: (stream.languages || []).map((l) => this.toLanguageCode(l)),
        smallLanguageCodes: (stream.languages || []).map((l) => this.toSmallCapsCode(l)),
        languageEmojis: stream.languageEmojis || [],
        size: stream.sizeBytes ?? (sizeFormatted ? this.parseBytes(sizeFormatted) : 0),
        sizeFormatted,
        folderSize: stream.sizeBytes || 0,
        seeders: stream.seeders ?? 0,
        releaseGroup: stream.releaseGroup || '',
        indexer: stream.indexer || '',
        title: stream.title || stream.filename || stream.rawTitle || 'Media',
        filename: stream.filename || stream.rawTitle || '',
        year: stream.year,
        season: stream.season,
        episode: stream.episode,
        seasonEpisode,
        seasonPack: stream.season !== undefined && stream.episode === undefined,
        duration: stream.duration || 0,
        age: stream.age || '',
        network: stream.ottPlatform || '',
        message: stream.message || '',
        regexMatched: stream.movieCut || '',
        seadex: stream.seadex ?? false,
        seadexBest: stream.seadexBest ?? false,
        type: streamType,
        proxied: stream.proxied ?? false,
        library: stream.library ?? false,
      },
      service: {
        cached: stream.cached,
        name: serviceName,
        shortName: serviceShort,
        id: stream.debridService || 'debrid',
      },
      addon: {
        name: stream.sourceName || 'Addon',
      },
      tools: {
        newLine: '\n',
        removeLine: this.REMOVE_LINE_TOKEN,
      },
      // Direct short aliases
      resolution: stream.resolution,
      quality: stream.quality,
      hdr: stream.visualTags?.join(' | ') || '',
      visualTags: stream.visualTags || [],
      audio: stream.audioTags?.join(' | ') || '',
      audioTags: stream.audioTags || [],
      audioChannels: stream.audioChannels || '',
      size: sizeFormatted,
      indexer: stream.indexer || '',
      torrentTitle: stream.title || stream.rawTitle,
      title: stream.title || stream.rawTitle,
      seeders: stream.seeders ?? 0,
      releaseGroup: stream.releaseGroup || '',
      codecs: stream.codecs?.join(' ') || '',
      languages: stream.languages || [],
    }
  }

  private static evaluateTemplate(template: string, context: Record<string, any>): string {
    let result = template

    // 1. Process conditional wrapper blocks: {? [prefix] {var} [suffix] ?}
    result = result.replace(/\{\?\s*([\s\S]*?)\s*\?\}/g, (_match, innerContent) => {
      // Check all variables inside innerContent
      const varMatches = innerContent.match(/\{([^{}]+)\}/g)
      if (varMatches) {
        for (const vm of varMatches) {
          const varExpr = vm.slice(1, -1).trim()
          const val = this.evaluateSingleExpression(varExpr, context)
          if (!val || val === '0' || val === this.REMOVE_LINE_TOKEN) {
            return '' // Cascade failure for conditional block
          }
        }
      }
      return this.evaluateTemplate(innerContent, context)
    })

    // 2. Process bracket grouping with cascade failure: [prefix {variable} suffix]
    // (Only if not a branch condition ["then"||"else"])
    result = result.replace(/(?<!::[=><!~]*)\[([^[\]]*?\{[^{}]+?\}[\s\S]*?)\]/g, (match, inner) => {
      if (inner.includes('||')) return match // Skip ["then"||"else"]
      const varMatches = inner.match(/\{([^{}]+)\}/g)
      if (varMatches) {
        for (const vm of varMatches) {
          const varExpr = vm.slice(1, -1).trim()
          const val = this.evaluateSingleExpression(varExpr, context)
          if (!val || val === '0') {
            return '' // Cascade failure
          }
        }
      }
      return `[${this.evaluateTemplate(inner, context)}]`
    })

    // 3. Process tags {...}
    // We repeatedly resolve innermost tags
    let maxPasses = 10
    while (result.includes('{') && maxPasses > 0) {
      maxPasses--
      const prev = result
      result = result.replace(/\{([^{}]+)\}/g, (_match, expr) => {
        return this.evaluateSingleExpression(expr.trim(), context)
      })
      if (result === prev) break
    }

    // 4. Post-processing: clean up removed lines and whitespace
    const lines = result.split('\n')
    const cleanedLines = lines
      .filter((line) => !line.includes(this.REMOVE_LINE_TOKEN))
      .map((line) => line.replace(new RegExp(this.REMOVE_LINE_TOKEN, 'g'), ''))

    // Collapse multiple consecutive empty lines to a single empty line
    const finalLines: string[] = []
    let prevEmpty = false
    for (const line of cleanedLines) {
      const trimmed = line.trim()
      if (!trimmed) {
        if (!prevEmpty && finalLines.length > 0) {
          finalLines.push('')
          prevEmpty = true
        }
      } else {
        finalLines.push(line)
        prevEmpty = false
      }
    }

    return finalLines.join('\n').trim()
  }

  private static evaluateSingleExpression(expr: string, context: Record<string, any>): string {
    // A. Tools
    if (expr === 'tools.newLine') return '\n'
    if (expr === 'tools.removeLine') return this.REMOVE_LINE_TOKEN

    // B. Ternary Conditional: {var?then_val:else_val}
    const ternaryMatch = expr.match(/^([a-zA-Z0-9_.]+)\?([^:]*):(.*)$/)
    if (ternaryMatch) {
      const [, varPath, thenVal, elseVal] = ternaryMatch
      const val = this.resolvePath(context, varPath)
      const isTruthy = this.isTruthy(val)
      return isTruthy
        ? this.evaluateTemplate(thenVal, context)
        : this.evaluateTemplate(elseVal, context)
    }

    // C. Branch condition: condition_chain["then"||"else"]
    const branchMatch = expr.match(/^([\s\S]+?)\["([\s\S]*?)"\|\|"([\s\S]*?)"\]$/)
    if (branchMatch) {
      const [, conditionChain, thenContent, elseContent] = branchMatch
      const passes = this.evaluateConditionChain(conditionChain.trim(), context)
      const selected = passes ? thenContent : elseContent
      return this.evaluateTemplate(selected, context)
    }

    // D. Fallback alternatives: {var1/var2/var3}
    if (expr.includes('/') && !expr.includes('::') && !expr.includes('"')) {
      const parts = expr.split('/')
      for (const p of parts) {
        const val = this.evaluateSingleExpression(p.trim(), context)
        if (val) return val
      }
      return ''
    }

    // E. Value expression with pipe chain (e.g. stream.visualTags::join(' | ') or size::bytes)
    return this.evaluateValueWithPipes(expr, context)
  }

  private static evaluateConditionChain(chain: string, context: Record<string, any>): boolean {
    // Split by ::or:: first (lower precedence than ::and::)
    const orSegments = chain.split(/\s*::or::\s*/)
    for (const orSeg of orSegments) {
      const andSegments = orSeg.split(/\s*::and::\s*/)
      let andPasses = true
      for (const andSeg of andSegments) {
        if (!this.evaluateSingleCondition(andSeg.trim(), context)) {
          andPasses = false
          break
        }
      }
      if (andPasses) return true
    }
    return false
  }

  private static evaluateSingleCondition(cond: string, context: Record<string, any>): boolean {
    if (!cond) return false

    // Check operator
    // 1. ::exists
    if (cond.endsWith('::exists')) {
      const path = cond.slice(0, -8)
      const val = this.resolvePath(context, path)
      return this.isExists(val)
    }

    // 2. ::istrue
    if (cond.endsWith('::istrue')) {
      const path = cond.slice(0, -8)
      const val = this.resolvePath(context, path)
      return val === true || val === 'true' || val === 1
    }

    // 3. ::isfalse
    if (cond.endsWith('::isfalse')) {
      const path = cond.slice(0, -9)
      const val = this.resolvePath(context, path)
      return val === false || val === 'false' || val === 0 || !this.isExists(val)
    }

    // 4. Comparison operators: ::=, ::!=, ::~, ::>=, ::<=, ::>, ::<
    const compMatch = cond.match(/^([\s\S]+?)::(=|!=|~|>=|<=|>|<)([\s\S]*)$/)
    if (compMatch) {
      const [, path, op, targetRaw] = compMatch
      const target = targetRaw.trim().replace(/^['"]|['"]$/g, '')
      const val = this.resolvePath(context, path)

      switch (op) {
        case '=':
          return String(val ?? '').toLowerCase() === target.toLowerCase()
        case '!=':
          return String(val ?? '').toLowerCase() !== target.toLowerCase()
        case '~':
          return String(val ?? '').toLowerCase().includes(target.toLowerCase())
        case '>=':
          if (!this.isExists(val) || typeof val === 'boolean') return false
          return Number(val) >= Number(target)
        case '<=':
          if (!this.isExists(val) || typeof val === 'boolean') return false
          return Number(val) <= Number(target)
        case '>':
          if (!this.isExists(val) || typeof val === 'boolean') return false
          return Number(val) > Number(target)
        case '<':
          if (!this.isExists(val) || typeof val === 'boolean') return false
          return Number(val) < Number(target)
      }
    }

    // Default: boolean truthiness of path
    const val = this.resolvePath(context, cond)
    return this.isTruthy(val)
  }

  private static evaluateValueWithPipes(expr: string, context: Record<string, any>): string {
    // Check pipes separated by :: or :
    // Handle quotes inside join('...') or replace('...')
    const segments = this.splitPipes(expr)
    const basePath = segments[0].trim()
    let val: any = this.resolvePath(context, basePath)

    for (let i = 1; i < segments.length; i++) {
      const pipe = segments[i].trim()
      val = this.applyPipe(val, pipe, context)
    }

    if (val === undefined || val === null) return ''
    if (Array.isArray(val)) return val.join(', ')
    return String(val)
  }

  private static splitPipes(expr: string): string[] {
    const parts: string[] = []
    let current = ''
    let inQuotes = false
    let quoteChar = ''
    let inParens = 0

    for (let i = 0; i < expr.length; i++) {
      const char = expr[i]
      const next = expr[i + 1]

      if ((char === "'" || char === '"') && expr[i - 1] !== '\\') {
        if (!inQuotes) {
          inQuotes = true
          quoteChar = char
        } else if (quoteChar === char) {
          inQuotes = false
        }
      } else if (char === '(' && !inQuotes) {
        inParens++
      } else if (char === ')' && !inQuotes) {
        inParens--
      }

      if (!inQuotes && inParens === 0 && char === ':' && next === ':') {
        parts.push(current)
        current = ''
        i++ // skip second colon
        continue
      } else if (!inQuotes && inParens === 0 && char === ':' && next !== ':' && expr[i - 1] !== ':') {
        // Single colon pipe
        parts.push(current)
        current = ''
        continue
      }

      current += char
    }
    if (current) parts.push(current)
    return parts
  }

  private static applyPipe(val: any, pipe: string, _context: Record<string, any>): any {
    // 1. bytes / sbytes
    if (pipe === 'bytes') {
      const bytesNum = Number(val)
      return !isNaN(bytesNum) && bytesNum > 0 ? this.formatBytes(bytesNum) : (val || '')
    }
    if (pipe === 'sbytes') {
      const bytesNum = Number(val)
      return !isNaN(bytesNum) && bytesNum > 0 ? this.formatShortBytes(bytesNum) : (val || '')
    }

    // 2. title / upper / lower / round
    if (pipe.toLowerCase() === 'title') {
      return String(val || '')
        .toLowerCase()
        .replace(/(?:^|\s|-|_)\S/g, (c) => c.toUpperCase())
    }
    if (pipe.toLowerCase() === 'upper' || pipe.toLowerCase() === 'uppercase') {
      return String(val || '').toUpperCase()
    }
    if (pipe.toLowerCase() === 'lower' || pipe.toLowerCase() === 'lowercase') {
      return String(val || '').toLowerCase()
    }
    if (pipe === 'round') {
      return Math.round(Number(val || 0))
    }

    // 3. time
    if (pipe === 'time') {
      const secs = Number(val)
      if (isNaN(secs) || secs <= 0) return ''
      const hrs = Math.floor(secs / 3600)
      const mins = Math.floor((secs % 3600) / 60)
      if (hrs > 0) return `${hrs}h ${mins}m`
      return `${mins}m`
    }

    // 4. first / last / rsort
    if (pipe === 'first') {
      return Array.isArray(val) ? val[0] ?? '' : val
    }
    if (pipe === 'last') {
      return Array.isArray(val) ? val[val.length - 1] ?? '' : val
    }
    if (pipe === 'rsort') {
      return Array.isArray(val) ? [...val].reverse() : val
    }

    // 5. join(separator)
    const joinMatch = pipe.match(/^join\(([\s\S]*)\)$/i)
    if (joinMatch) {
      const sep = joinMatch[1].trim().replace(/^['"]|['"]$/g, '')
      return Array.isArray(val) ? val.join(sep) : String(val ?? '')
    }

    // 6. replace(find, replaceWith)
    const repMatch = pipe.match(/^replace\(([\s\S]*?),\s*([\s\S]*?)\)$/i)
    if (repMatch) {
      const find = repMatch[1].trim().replace(/^['"]|['"]$/g, '')
      const rep = repMatch[2].trim().replace(/^['"]|['"]$/g, '')
      return String(val ?? '').replaceAll(find, rep)
    }

    // 7. default(fallback) / fallback(fallback)
    const defMatch = pipe.match(/^(?:default|fallback)\(([\s\S]*)\)$/i)
    if (defMatch) {
      const def = defMatch[1].trim().replace(/^['"]|['"]$/g, '')
      return this.isExists(val) ? val : def
    }

    return val
  }

  private static resolvePath(obj: Record<string, any>, path: string): any {
    if (!path) return undefined
    if (path in obj) return obj[path]

    const parts = path.split('.')
    let curr: any = obj
    for (const p of parts) {
      if (curr === undefined || curr === null) return undefined
      curr = curr[p]
    }
    return curr
  }

  private static isExists(val: any): boolean {
    if (val === undefined || val === null) return false
    if (typeof val === 'string') return val.trim().length > 0
    if (Array.isArray(val)) return val.length > 0
    if (typeof val === 'number') return !isNaN(val)
    return Boolean(val)
  }

  private static isTruthy(val: any): boolean {
    if (!this.isExists(val)) return false
    if (val === false || val === 'false') return false
    return true
  }

  private static formatBytes(bytes: number): string {
    if (bytes >= 1024 * 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024 * 1024)).toFixed(2)} TB`
    }
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
    }
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    }
    return `${(bytes / 1024).toFixed(2)} KB`
  }

  private static formatShortBytes(bytes: number): string {
    if (bytes >= 1024 * 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024 * 1024)).toFixed(1)}TB`
    }
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`
    }
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
    }
    return `${(bytes / 1024).toFixed(0)}KB`
  }

  private static parseBytes(str: string): number {
    const m = str.match(/([\d.]+)\s*(TB|GB|MB|KB)/i)
    if (!m) return 0
    const val = parseFloat(m[1])
    const unit = m[2].toUpperCase()
    if (unit === 'TB') return val * 1024 * 1024 * 1024 * 1024
    if (unit === 'GB') return val * 1024 * 1024 * 1024
    if (unit === 'MB') return val * 1024 * 1024
    return val * 1024
  }

  private static toLanguageCode(lang: string): string {
    const map: Record<string, string> = {
      english: 'EN',
      spanish: 'ES',
      french: 'FR',
      german: 'DE',
      italian: 'IT',
      portuguese: 'PT',
      russian: 'RU',
      japanese: 'JA',
      korean: 'KO',
      hindi: 'HI',
      chinese: 'ZH',
      multi: 'MULTI',
      'dual audio': 'DUAL',
    }
    return map[lang.toLowerCase()] || lang.substring(0, 2).toUpperCase()
  }

  private static toSmallCapsCode(lang: string): string {
    const map: Record<string, string> = {
      english: 'ᴇɴ',
      spanish: 'ᴇs',
      french: 'ғʀ',
      german: 'ᴅᴇ',
      italian: 'ɪᴛ',
      portuguese: 'ᴘᴛ',
      russian: 'ʀᴜ',
      japanese: 'ᴊᴀ',
      korean: 'ᴋᴏ',
      hindi: 'ʜɪ',
      chinese: 'ᴢʜ',
      multi: 'ᴍᴜʟᴛɪ',
      'dual audio': 'ᴅᴜᴏ',
      dubbed: 'ᴅᴜʙ',
    }
    return map[lang.toLowerCase()] || lang.toLowerCase()
  }

  private static getShortDebridName(service?: string): string {
    if (!service) return 'TB'
    const lower = service.toLowerCase()
    if (lower.includes('torbox') || lower === 'tb') return 'TB'
    if (lower.includes('realdebrid') || lower.includes('real-debrid') || lower === 'rd') return 'RD'
    if (lower.includes('alldebrid') || lower.includes('all-debrid') || lower === 'ad') return 'AD'
    if (lower.includes('premiumize') || lower === 'pm') return 'PM'
    if (lower.includes('debridlink') || lower === 'dl') return 'DL'
    return service.substring(0, 2).toUpperCase()
  }
}

export class StreamFormatter {
  static getPresets() {
    return streamPresets
  }

  static format(
    stream: ParsedStreamMetadata,
    options?: StreamFormatterOptions
  ): StremioStream {
    const presetKey = (options?.preset || 'prism').toLowerCase()
    const viewMode = options?.viewMode || 'full'

    // 1. Custom Template Override
    if (options?.customTemplate) {
      const description = StreamMicroSyntaxEngine.render(options.customTemplate, stream)
      return {
        ...stream.originalStream,
        name: stream.resolution,
        description,
        title: description,
      }
    }

    // 2. Preset Normalization
    const normalizedKey = this.normalizePresetKey(presetKey)
    const presetsMap = streamPresets as Record<string, PresetDef>
    const presetDef = presetsMap[normalizedKey] || presetsMap['prism']

    if (!presetDef) {
      return {
        ...stream.originalStream,
        name: stream.resolution,
        description: stream.rawTitle,
        title: stream.rawTitle,
      }
    }

    // 3. Render name & description using full Micro-Syntax Template Engine
    const name = StreamMicroSyntaxEngine.render(presetDef.nameTemplate, stream) || stream.resolution
    const rawDescription = StreamMicroSyntaxEngine.render(presetDef.descriptionTemplate, stream)
    const description = this.applyViewMode(rawDescription, viewMode)

    return {
      ...stream.originalStream,
      name,
      description,
      title: description,
    }
  }

  private static normalizePresetKey(preset: string): string {
    switch (preset) {
      case 'xperience':
      case 'nuvio':
        return 'nuvio'
      case 'neds':
      case 'ned':
        return 'ned'
      case 'linden_monochrome':
      case 'lindenmono':
        return 'lindenmono'
      case 'linden':
        return 'linden'
      case 'shota_simple':
      case 'shota':
        return 'shota'
      case 'charcoal':
        return 'charcoal'
      case 'streamsense':
        return 'streamsense'
      case 'tamtaro':
        return 'tamtaro'
      case 'plain':
        return 'plain'
      case 'prism':
      default:
        return 'prism'
    }
  }

  private static applyViewMode(description: string, viewMode: string): string {
    const lines = description.split('\n').filter((l) => l.trim().length > 0)
    if (viewMode === 'sparse') {
      return lines.slice(0, 2).join('\n')
    }
    if (viewMode === 'episode') {
      return lines.slice(0, 3).join('\n')
    }
    return description
  }
}
