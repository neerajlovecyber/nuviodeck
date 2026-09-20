import { Hono } from 'hono'
import path from 'path'

export const avatarsRouter = new Hono()

let cachedAvatars: any = null

async function getAvatars(): Promise<any> {
  if (cachedAvatars) return cachedAvatars
  try {
    const possiblePaths = [
      path.resolve(import.meta.dirname, '../data/avatars.json'),
      path.resolve(process.cwd(), 'src/data/avatars.json'),
      path.resolve(process.cwd(), 'apps/server/src/data/avatars.json'),
    ]
    for (const p of possiblePaths) {
      const file = Bun.file(p)
      if (await file.exists()) {
        cachedAvatars = await file.json()
        return cachedAvatars
      }
    }
  } catch (e) {
    console.error('Failed to load avatars.json:', e)
  }
  return { avatars: [] }
}

// GET /api/avatars
avatarsRouter.get('/', async (c) => {
  const data = await getAvatars()
  return c.json(data)
})
