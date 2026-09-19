import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { db } from './db'
import { users } from './db/schema'

const app = new Hono()

app.use('*', cors())

app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/api/users', async (c) => {
  try {
    const allUsers = await db.select().from(users)
    return c.json({ users: allUsers })
  } catch (error) {
    return c.json({ error: 'Failed to fetch users' }, 500)
  }
})

app.post('/api/users', async (c) => {
  try {
    const body = await c.req.json()
    if (!body.name || !body.email) {
      return c.json({ error: 'Name and email are required' }, 400)
    }

    const inserted = await db
      .insert(users)
      .values({
        name: body.name,
        email: body.email,
      })
      .returning()

    return c.json({ user: inserted[0] }, 201)
  } catch (error: any) {
    if (error?.message?.includes('UNIQUE')) {
      return c.json({ error: 'Email already exists' }, 400)
    }
    return c.json({ error: 'Failed to create user' }, 500)
  }
})

export default {
  port: 3001,
  fetch: app.fetch,
}

export { app }
