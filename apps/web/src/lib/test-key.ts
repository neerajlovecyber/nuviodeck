export type KeyTestResult =
  | { status: 'valid'; details?: any }
  | { status: 'invalid'; message: string }
  | { status: 'timeout'; message: string }
  | { status: 'error'; message: string }

export async function testApiKey(
  keyId: string,
  value: string,
  options?: { proxyUrl?: string }
): Promise<KeyTestResult> {
  const cleanValue = value.trim()
  if (!cleanValue) {
    return { status: 'invalid', message: 'Enter a key first.' }
  }

  try {
    const res = await fetch(`/api/verify/${encodeURIComponent(keyId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: cleanValue,
        apiKey: cleanValue,
        token: cleanValue,
        proxyUrl: options?.proxyUrl,
      }),
    })

    const data = await res.json().catch(() => ({}))

    if (res.ok && data.ok) {
      return { status: 'valid', details: data }
    }

    const message = data.error || data.message || `Validation failed (HTTP ${res.status})`
    return {
      status: 'invalid',
      message,
    }
  } catch (err: any) {
    return {
      status: 'error',
      message: err.message || 'Could not connect to validation server',
    }
  }
}

export async function testBatchApiKeys(
  apiKeys: Record<string, string>
): Promise<Record<string, KeyTestResult>> {
  try {
    const res = await fetch('/api/test-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKeys }),
    })
    const data = await res.json().catch(() => ({}))
    return data.details || {}
  } catch (err: any) {
    return {}
  }
}
