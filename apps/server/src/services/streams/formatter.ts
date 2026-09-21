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
    const cleanTitle =
      stream.title ||
      (stream.filename ? stream.filename.replace(/\.[a-z0-9]+$/i, '').replace(/[._]/g, ' ') : '') ||
      (stream.rawTitle ? stream.rawTitle.split('\n')[0].replace(/^[^\w\s]+|[^\w\s]+$/g, '').trim() : '') ||
      'Media'

    const folderSize =
      stream.folderSizeBytes && stream.folderSizeBytes > (stream.sizeBytes || 0)
        ? stream.folderSizeBytes
        : 0

    // Quality Score (0-100) for star ratings and release ranking (Only top releases get scores)
    const visualTags = stream.visualTags || []
    const audioTags = stream.audioTags || []
    const rls = (stream.releaseGroup || '').toLowerCase()
    const isTopTierGroup = [
      'framestor', 'flux', 'sic', 'thefarm', 'hallowed', 'bhdstudio',
      'epsilon', 'ctrlhd', 'don', 'tayto', 'd-z0n3', 'playbd', 'bmf'
    ].includes(rls)

    let qualityScore: number | null = null
    let seScore: number | null = null
    const rseMatched: string[] = []

    if (stream.seadexBest) {
      qualityScore = 100
      seScore = 2000
      rseMatched.push('BEST RELEASE')
    } else if (stream.seadex) {
      qualityScore = 80
      seScore = 1500
      rseMatched.push('ALT BEST RELEASE')
    } else if (stream.quality === 'BluRay REMUX' && isTopTierGroup) {
      qualityScore = 100
      seScore = 1200
      rseMatched.push('Remux T1')
    } else if (
      stream.quality === 'BluRay REMUX' &&
      (visualTags.includes('DV') || visualTags.includes('HDR10+')) &&
      (audioTags.includes('Atmos') || audioTags.includes('TrueHD') || audioTags.includes('DTS-HD MA'))
    ) {
      qualityScore = 80
      seScore = 1000
      rseMatched.push('Remux T1')
    } else if (stream.quality === 'BluRay REMUX') {
      qualityScore = 75
      seScore = 900
      rseMatched.push('Remux T2')
    } else if (stream.resolution === '2160p' && isTopTierGroup && (visualTags.includes('DV') || visualTags.includes('HDR10+'))) {
      qualityScore = 70
      seScore = 800
      rseMatched.push('UHD Bluray T1')
    } else {
      // Standard streams: null score -> no star ratings rendered, matching official Tam-Taro
      qualityScore = null
      seScore = null
    }

    if (visualTags.includes('DV') && !rseMatched.includes('DV')) rseMatched.push('DV')
    if (visualTags.includes('HDR10+') && !rseMatched.includes('HDR10+')) rseMatched.push('HDR10+')
    if (audioTags.includes('Atmos') && !rseMatched.includes('ATMOS')) rseMatched.push('ATMOS')
    if (audioTags.includes('TrueHD') && !rseMatched.includes('TrueHD')) rseMatched.push('TrueHD')

    const languages = stream.languages || []
    const languageCodes = languages.map((l) => this.toLanguageCode(l))
    const smallLanguageCodes = languages.map((l) => this.toSmallCapsCode(l))
    const subtitles = (stream as any).subtitles || []
    const smallSubtitleCodes = subtitles.map((s: string) => this.toSmallCapsCode(s))

    return {
      stream: {
        resolution: stream.resolution,
        quality: stream.quality && stream.quality !== 'Unknown' ? stream.quality : '',
        visualTags: stream.visualTags || [],
        audioTags: stream.audioTags || [],
        audioChannels: stream.audioChannels ? [stream.audioChannels] : [],
        encode: stream.codecs?.join(' ') || '',
        codecs: stream.codecs || [],
        languages,
        uLanguages: languages,
        languageCodes,
        uLanguageCodes: languageCodes,
        smallLanguageCodes,
        uSmallLanguageCodes: smallLanguageCodes,
        subtitles,
        uSubtitles: subtitles,
        smallSubtitleCodes,
        uSmallSubtitleCodes: smallSubtitleCodes,
        subbed: subtitles.length > 0,
        languageEmojis: stream.languageEmojis || [],
        size: stream.sizeBytes ?? (sizeFormatted ? this.parseBytes(sizeFormatted) : 0),
        sizeFormatted,
        folderSize,
        bitrate: stream.bitrate || 0,
        seeders: stream.seeders ?? 0,
        releaseGroup: stream.releaseGroup || '',
        indexer: stream.indexer || '',
        title: cleanTitle,
        filename: stream.filename || cleanTitle,
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
        rseMatched,
        editions: stream.movieCut ? [stream.movieCut] : [],
        movieCut: stream.movieCut || '',
        seadex: stream.seadex ?? false,
        seadexBest: stream.seadexBest ?? false,
        nSeScore: qualityScore,
        seScore: seScore,
        type: streamType,
        proxied: stream.proxied ?? false,
        library: stream.library ?? false,
        preloading: false,
        private: false,
        date: new Date().toISOString().split('T')[0],
      },
      metadata: {
        queryType: stream.season !== undefined ? 'series' : 'movie',
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
      torrentTitle: cleanTitle,
      title: cleanTitle,
      seeders: stream.seeders ?? 0,
      releaseGroup: stream.releaseGroup || '',
      codecs: stream.codecs?.join(' ') || '',
      languages: stream.languages || [],
      nSeScore: qualityScore,
      seScore: seScore,
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

    // 4. Post-processing: clean up removed lines and blank empty lines
    const lines = result.split('\n')
    const cleanedLines = lines
      .filter((line) => !line.includes(this.REMOVE_LINE_TOKEN))
      .map((line) => line.replace(new RegExp(this.REMOVE_LINE_TOKEN, 'g'), '').trim())
      .filter((line) => line.length > 0)

    return cleanedLines.join('\n').trim()
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

    // C. Branch conditions: condition_chain["branch1"||"branch2"||"branch3"]
    const branchMatch = expr.match(/^([\s\S]+?)\[([\s\S]+)\]$/)
    if (branchMatch && branchMatch[2].includes('"')) {
      const conditionChain = branchMatch[1].trim()
      const branches = this.splitBranches(branchMatch[2])
      if (branches.length > 0) {
        if (branches.length === 3) {
          const val = this.resolvePath(context, conditionChain)
          let selected = branches[2]
          if (val === true || val === 'true' || val === 1) selected = branches[0]
          else if (val === false || val === 'false' || val === 0) selected = branches[1]
          else if (this.isExists(val)) selected = branches[0]
          return this.evaluateTemplate(selected, context)
        } else {
          const passes = this.evaluateConditionChain(conditionChain, context)
          const selected = passes ? branches[0] : (branches[1] ?? '')
          return this.evaluateTemplate(selected, context)
        }
      }
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

    // 7. remove(item1, item2, ...)
    const removeMatch = pipe.match(/^remove\(([\s\S]*)\)$/i)
    if (removeMatch) {
      const targets = removeMatch[1].split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
      if (Array.isArray(val)) {
        return val.filter((item) => !targets.includes(String(item)))
      }
      let str = String(val ?? '')
      for (const t of targets) {
        str = str.replaceAll(t, '')
      }
      return str
    }

    // 8. truncate(limit)
    const truncMatch = pipe.match(/^truncate\((\d+)\)$/i)
    if (truncMatch) {
      const maxLen = parseInt(truncMatch[1], 10)
      const str = String(val ?? '')
      return str.length > maxLen ? str.substring(0, maxLen) : str
    }

    // 9. smallcaps
    if (pipe === 'smallcaps') {
      const smallCapsMap: Record<string, string> = {
        a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ғ', g: 'ɢ', h: 'ʜ', i: 'ɪ', j: 'ᴊ', k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'ϙ', r: 'ʀ', s: 's', t: 'ᴛ', u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'х', y: 'ʏ', z: 'ᴢ',
        A: 'ᴀ', B: 'ʙ', C: 'ᴄ', D: 'ᴅ', E: 'ᴇ', F: 'ғ', G: 'ɢ', H: 'ʜ', I: 'ɪ', J: 'ᴊ', K: 'ᴋ', L: 'ʟ', M: 'ᴍ', N: 'ɴ', O: 'ᴏ', P: 'ᴘ', Q: 'ϙ', R: 'ʀ', S: 's', T: 'ᴛ', U: 'ᴜ', V: 'ᴠ', W: 'ᴡ', X: 'х', Y: 'ʏ', Z: 'ᴢ',
      }
      return String(val ?? '')
        .split('')
        .map((c) => smallCapsMap[c] || c)
        .join('')
    }

    // 10. sbitrate
    if (pipe === 'sbitrate') {
      const bps = typeof val === 'number' ? val : parseFloat(String(val || '0'))
      if (isNaN(bps) || bps <= 0) return ''
      if (bps >= 1000000) return `${(bps / 1000000).toFixed(1)} Mbps`
      if (bps >= 1000) return `${(bps / 1000).toFixed(0)} Kbps`
      return `${bps} bps`
    }

    // 11. sort / lsort
    if (pipe === 'sort') {
      return Array.isArray(val) ? [...val].sort() : val
    }
    if (pipe === 'lsort') {
      return Array.isArray(val)
        ? [...val].sort((a, b) =>
            String(a).localeCompare(String(b), undefined, { sensitivity: 'base' })
          )
        : val
    }

    // 12. default(fallback) / fallback(fallback)
    const defMatch = pipe.match(/^(?:default|fallback)\(([\s\S]*)\)$/i)
    if (defMatch) {
      const def = defMatch[1].trim().replace(/^['"]|['"]$/g, '')
      return this.isExists(val) ? val : def
    }

    // 13. string / length
    if (pipe === 'string') {
      return String(val ?? '')
    }
    if (pipe === 'length') {
      if (Array.isArray(val)) return val.length
      return String(val ?? '').length
    }

    // 14. date
    const dateMatch = pipe.match(/^date\(([\s\S]*)\)$/i)
    if (dateMatch) {
      const d = val ? new Date(val) : new Date()
      if (isNaN(d.getTime())) return String(val || '')
      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    }

    // 15. in(...)
    const inMatch = pipe.match(/^in\(([\s\S]*)\)$/i)
    if (inMatch) {
      const targets = inMatch[1].split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
      if (Array.isArray(val)) {
        return val.some((v) => targets.includes(String(v)))
      }
      return targets.includes(String(val ?? ''))
    }

    // 16. star / pstar pipe (renders e.g. ★★★★★ / ★★★★ without empty padding)
    // Returns '' for null/undefined/0 so streams without a quality score show no stars
    if (pipe === 'star') {
      if (val === null || val === undefined || val === 0 || val === '0' || val === '') return ''
      const num = Math.min(100, Math.max(1, Number(val)))
      const count = Math.min(5, Math.round(num / 20))
      return count > 0 ? '★'.repeat(count) : ''
    }
    if (pipe === 'pstar') {
      if (val === null || val === undefined || val === 0 || val === '0' || val === '') return ''
      const num = Math.min(100, Math.max(1, Number(val)))
      const count = Math.min(5, Math.round(num / 20))
      if (count <= 0) return ''
      return '★'.repeat(count) + '☆'.repeat(5 - count)
    }

    // 17. translate(fromChars, toChars)
    const transMatch = pipe.match(/^translate\(([\s\S]*?),\s*([\s\S]*?)\)$/i)
    if (transMatch) {
      const from = transMatch[1].trim().replace(/^['"]|['"]$/g, '')
      const to = transMatch[2].trim().replace(/^['"]|['"]$/g, '')
      const str = String(val ?? '')
      return str
        .split('')
        .map((c) => {
          const idx = from.indexOf(c)
          return idx !== -1 ? to[idx] || c : c
        })
        .join('')
    }

    return val
  }

  private static splitBranches(raw: string): string[] {
    const branches: string[] = []
    let current = ''
    let inQuotes = false
    let quoteChar = ''
    let depth = 0

    for (let i = 0; i < raw.length; i++) {
      const char = raw[i]
      const next = raw[i + 1]

      if ((char === "'" || char === '"') && raw[i - 1] !== '\\') {
        if (!inQuotes) {
          inQuotes = true
          quoteChar = char
        } else if (quoteChar === char) {
          inQuotes = false
        }
      } else if (char === '[' && !inQuotes) {
        depth++
      } else if (char === ']' && !inQuotes) {
        depth--
      }

      if (!inQuotes && depth === 0 && char === '|' && next === '|') {
        branches.push(this.cleanBranch(current))
        current = ''
        i++ // skip second |
        continue
      }
      current += char
    }
    if (current) branches.push(this.cleanBranch(current))
    return branches
  }

  private static cleanBranch(str: string): string {
    const trimmed = str.trim()
    if (
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
      return trimmed.slice(1, -1)
    }
    return trimmed
  }

  private static resolvePath(obj: Record<string, any>, path: string): any {
    if (!path) return undefined
    if (
      (path.startsWith("'") && path.endsWith("'")) ||
      (path.startsWith('"') && path.endsWith('"'))
    ) {
      return path.slice(1, -1)
    }
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
    const presetKey = (options?.preset || 'nuvio').toLowerCase()
    const viewMode = options?.viewMode || 'full'

    // 0. Disable Formatter / Raw Addon Passthrough
    if (
      options?.enabled === false ||
      presetKey === 'none' ||
      presetKey === 'raw' ||
      presetKey === 'disabled' ||
      presetKey === 'passthrough'
    ) {
      return stream.originalStream
    }

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
    const presetDef = presetsMap[normalizedKey] || presetsMap['nuvio']

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
