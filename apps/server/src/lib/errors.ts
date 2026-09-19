export class NuvioApiError extends Error {
  status: number
  code?: string
  details?: any

  constructor(message: string, status = 500, code?: string, details?: any) {
    super(message)
    this.name = 'NuvioApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return {} as T
  }

  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const body = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    const message =
      typeof body === 'object' && body?.message
        ? body.message
        : typeof body === 'object' && body?.error_description
          ? body.error_description
          : typeof body === 'string' && body.length > 0
            ? body
            : `Nuvio request failed with status ${response.status}`

    const code = typeof body === 'object' ? body?.code || body?.error : undefined
    throw new NuvioApiError(message, response.status, code, body)
  }

  return body as T
}
