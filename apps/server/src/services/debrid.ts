export interface DebridAccountInfo {
  valid: boolean
  provider: string
  username?: string
  email?: string
  isPremium?: boolean
  expiresAt?: string | null
  error?: string
}

export class DebridService {
  async validateToken(provider: string, token: string): Promise<DebridAccountInfo> {
    const cleanProvider = provider.toLowerCase().trim()
    const cleanToken = token.trim()

    if (!cleanToken) {
      return { valid: false, provider: cleanProvider, error: 'Token is empty' }
    }

    try {
      switch (cleanProvider) {
        case 'realdebrid':
        case 'real-debrid':
        case 'rd':
          return await this.validateRealDebrid(cleanToken)

        case 'torbox':
        case 'tb':
          return await this.validateTorbox(cleanToken)

        case 'alldebrid':
        case 'ad':
          return await this.validateAllDebrid(cleanToken)

        case 'premiumize':
        case 'pm':
          return await this.validatePremiumize(cleanToken)

        case 'debridlink':
        case 'debrid-link':
        case 'dl':
          return await this.validateDebridLink(cleanToken)

        default:
          return {
            valid: false,
            provider: cleanProvider,
            error: `Unsupported debrid provider "${provider}"`,
          }
      }
    } catch (err: any) {
      return {
        valid: false,
        provider: cleanProvider,
        error: err.message || 'Validation request failed',
      }
    }
  }

  private async validateRealDebrid(token: string): Promise<DebridAccountInfo> {
    const res = await fetch('https://api.real-debrid.com/rest/1.0/user', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(4000),
    })

    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      return {
        valid: false,
        provider: 'realdebrid',
        error: res.status === 401 ? 'Invalid Real-Debrid API token' : `Real-Debrid error (${res.status}): ${errBody}`,
      }
    }

    const data = (await res.json()) as any
    return {
      valid: true,
      provider: 'realdebrid',
      username: data.username,
      email: data.email,
      isPremium: data.type === 'premium',
      expiresAt: data.expiration || null,
    }
  }

  private async validateTorbox(token: string): Promise<DebridAccountInfo> {
    const res = await fetch('https://api.torbox.app/v1/api/user/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(4000),
    })

    if (!res.ok) {
      return {
        valid: false,
        provider: 'torbox',
        error: res.status === 401 ? 'Invalid Torbox API token' : `Torbox error (${res.status})`,
      }
    }

    const data = (await res.json()) as any
    const user = data.data || data
    return {
      valid: true,
      provider: 'torbox',
      username: user.email?.split('@')[0] || user.id,
      email: user.email,
      isPremium: Boolean(user.plan && user.plan > 0),
      expiresAt: user.subscription_expires_at || null,
    }
  }

  private async validateAllDebrid(token: string): Promise<DebridAccountInfo> {
    const res = await fetch(`https://api.alldebrid.com/v4/user?agent=nuviodeck&apikey=${encodeURIComponent(token)}`, {
      signal: AbortSignal.timeout(4000),
    })

    if (!res.ok) {
      return {
        valid: false,
        provider: 'alldebrid',
        error: `AllDebrid HTTP error (${res.status})`,
      }
    }

    const data = (await res.json()) as any
    if (data.status !== 'success' || !data.data?.user) {
      return {
        valid: false,
        provider: 'alldebrid',
        error: data.error?.message || 'Invalid AllDebrid API key',
      }
    }

    const user = data.data.user
    return {
      valid: true,
      provider: 'alldebrid',
      username: user.username,
      email: user.email,
      isPremium: Boolean(user.isPremium),
      expiresAt: user.premiumUntil ? new Date(user.premiumUntil * 1000).toISOString() : null,
    }
  }

  private async validatePremiumize(token: string): Promise<DebridAccountInfo> {
    const res = await fetch(`https://www.premiumize.me/api/account/info?apikey=${encodeURIComponent(token)}`, {
      signal: AbortSignal.timeout(4000),
    })

    if (!res.ok) {
      return {
        valid: false,
        provider: 'premiumize',
        error: `Premiumize HTTP error (${res.status})`,
      }
    }

    const data = (await res.json()) as any
    if (data.status !== 'success') {
      return {
        valid: false,
        provider: 'premiumize',
        error: data.message || 'Invalid Premiumize API PIN/key',
      }
    }

    const isPremium = Boolean(data.premium_until && data.premium_until * 1000 > Date.now())
    return {
      valid: true,
      provider: 'premiumize',
      username: data.customer_id ? `User-${data.customer_id}` : undefined,
      isPremium,
      expiresAt: data.premium_until ? new Date(data.premium_until * 1000).toISOString() : null,
    }
  }

  private async validateDebridLink(token: string): Promise<DebridAccountInfo> {
    const res = await fetch('https://debrid-link.com/api/v2/account/infos', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(4000),
    })

    if (!res.ok) {
      return {
        valid: false,
        provider: 'debridlink',
        error: res.status === 401 ? 'Invalid Debrid-Link token' : `Debrid-Link error (${res.status})`,
      }
    }

    const data = (await res.json()) as any
    const val = data.value || {}
    return {
      valid: true,
      provider: 'debridlink',
      username: val.username,
      email: val.email,
      isPremium: Boolean(val.premiumLeft && val.premiumLeft > 0),
      expiresAt: val.premiumUntil ? new Date(val.premiumUntil * 1000).toISOString() : null,
    }
  }
}

export const debridService = new DebridService()
