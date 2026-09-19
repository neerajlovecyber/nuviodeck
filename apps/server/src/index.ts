import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

app.use('*', cors())

app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/api/hello', (c) => {
  return c.json({ message: 'Hello from Hono on Bun!' })
})

export default {
  port: 3001,
  fetch: app.fetch,
}

export { app }
