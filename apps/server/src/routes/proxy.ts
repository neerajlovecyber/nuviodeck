import { Hono } from 'hono'

export const proxyRouter = new Hono()

/**
 * High-performance byte-range video streaming proxy supporting HTTP 206 Partial Content
 * for video seek, scrub, and player playback.
 * 
 * GET /api/proxy/stream?url=<encoded_url>&token=<optional>
 */
proxyRouter.get('/stream', async (c) => {
  const targetUrl = c.req.query('url')
  if (!targetUrl) {
    return c.json({ error: 'url query parameter is required' }, 400)
  }

  try {
    const rangeHeader = c.req.header('range')
    const headers: Record<string, string> = {
      'User-Agent': c.req.header('user-agent') || 'NuvioDeck/1.0',
    }

    if (rangeHeader) {
      headers['Range'] = rangeHeader
    }

    const response = await fetch(targetUrl, {
      headers,
    })

    // Forward response headers
    const responseHeaders: Record<string, string> = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Range, Authorization, Content-Type',
      'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
      'Accept-Ranges': 'bytes',
    }

    const contentType = response.headers.get('content-type')
    if (contentType) responseHeaders['Content-Type'] = contentType

    const contentLength = response.headers.get('content-length')
    if (contentLength) responseHeaders['Content-Length'] = contentLength

    const contentRange = response.headers.get('content-range')
    if (contentRange) responseHeaders['Content-Range'] = contentRange

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    })
  } catch (err: any) {
    return c.json({ error: 'Failed to proxy video stream', details: err.message }, 502)
  }
})
