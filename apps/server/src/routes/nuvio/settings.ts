import { Hono } from 'hono'
import { db } from '../../db'
import { userSettings } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { resolveCurrentSession } from './auth'

export const settingsRouter = new Hono()

// GET /api/nuvio/settings - Get settings for currently logged-in account
settingsRouter.get('/', async (c) => {
  try {
    const session = await resolveCurrentSession(c).catch(() => null)
    if (!session) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const [record] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, session.userId))
      .limit(1)

    if (!record) {
      return c.json({ settings: null })
    }

    try {
      const parsed = JSON.parse(record.settingsJson)
      return c.json({ settings: parsed, updatedAt: record.updatedAt })
    } catch {
      return c.json({ settings: null })
    }
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to fetch settings' }, 500)
  }
})

// PUT /api/nuvio/settings - Save settings for currently logged-in account
settingsRouter.put('/', async (c) => {
  try {
    const session = await resolveCurrentSession(c).catch(() => null)
    if (!session) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const body = await c.req.json()
    const now = new Date().toISOString()
    const settingsJson = JSON.stringify(body)

    await db
      .insert(userSettings)
      .values({
        userId: session.userId,
        settingsJson,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: {
          settingsJson,
          updatedAt: now,
        },
      })

    return c.json({ success: true, message: 'Settings saved to your account', updatedAt: now })
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to save settings' }, 500)
  }
})
