import { Hono } from 'hono'
import { db } from '../../db'
import { deckProfiles, nuvioSessions } from '../../db/schema'
import { eq, desc } from 'drizzle-orm'
import { nuvioClient } from '../../lib/nuvio-client'

export const deckProfilesRouter = new Hono()

// List all deck profile configurations
deckProfilesRouter.get('/', async (c) => {
  try {
    const profiles = await db
      .select()
      .from(deckProfiles)
      .orderBy(desc(deckProfiles.isActive), desc(deckProfiles.updatedAt))

    return c.json({ profiles })
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to fetch deck profiles' }, 500)
  }
})

// Create new deck profile
deckProfilesRouter.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const name = body.name?.trim() || 'New Profile'
    const id = `deck-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    const now = new Date().toISOString()

    const newProfile = {
      id,
      name,
      isActive: false,
      status: 'Ready',
      rowCount: body.rowCount || 24,
      collectionCount: body.collectionCount || 1,
      avatarId: body.avatarId || null,
      avatarUrl: body.avatarUrl || null,
      badgeSetId: body.badgeSetId || 'xp_aurora',
      configJson: body.configJson ? JSON.stringify(body.configJson) : null,
      createdAt: now,
      updatedAt: now,
    }

    await db.insert(deckProfiles).values(newProfile)
    return c.json({ success: true, profile: newProfile }, 201)
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to create profile' }, 500)
  }
})

// Update profile (e.g. rename, toggle active)
deckProfilesRouter.patch('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const now = new Date().toISOString()

    // If setting active, deactivate others
    if (body.isActive) {
      await db.update(deckProfiles).set({ isActive: false })
    }

    await db
      .update(deckProfiles)
      .set({
        ...body,
        updatedAt: now,
      })
      .where(eq(deckProfiles.id, id))

    const [updated] = await db
      .select()
      .from(deckProfiles)
      .where(eq(deckProfiles.id, id))
      .limit(1)

    return c.json({ success: true, profile: updated })
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to update profile' }, 500)
  }
})

// Delete profile
deckProfilesRouter.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await db.delete(deckProfiles).where(eq(deckProfiles.id, id))
    return c.json({ success: true, message: 'Profile deleted' })
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to delete profile' }, 500)
  }
})

// Import raw configuration JSON
deckProfilesRouter.post('/import', async (c) => {
  try {
    const body = await c.req.json()
    const name = body.name || body.profileName || 'Imported Profile'
    const id = `deck-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    const now = new Date().toISOString()

    const imported = {
      id,
      name,
      isActive: false,
      status: 'Ready',
      rowCount: body.rows?.length || body.catalogs?.length || 24,
      collectionCount: body.collections?.length || 1,
      badgeSetId: body.badgeSetId || 'xp_aurora',
      configJson: JSON.stringify(body),
      createdAt: now,
      updatedAt: now,
    }

    await db.insert(deckProfiles).values(imported)
    return c.json({ success: true, profile: imported }, 201)
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to import config' }, 500)
  }
})

// Multi-account, multi-profile deployment engine!
deckProfilesRouter.post('/:id/deploy', async (c) => {
  try {
    const id = c.req.param('id')
    const { targets, options } = await c.req.json()
    // targets: Array<{ accountId: string, slots: number[] }>
    // options: { pushAvatar?: boolean, pushBadges?: boolean, pushCollections?: boolean, pushAddons?: boolean }

    const [profile] = await db
      .select()
      .from(deckProfiles)
      .where(eq(deckProfiles.id, id))
      .limit(1)

    if (!profile) {
      return c.json({ error: 'Deck profile not found' }, 404)
    }

    const deployReport: any[] = []

    for (const target of targets || []) {
      const [session] = await db
        .select()
        .from(nuvioSessions)
        .where(eq(nuvioSessions.id, target.accountId))
        .limit(1)

      if (!session) {
        deployReport.push({
          accountId: target.accountId,
          status: 'error',
          error: 'Session not found',
        })
        continue
      }

      const token = session.accessToken
      const slots: number[] = target.slots || [1]

      for (const slot of slots) {
        try {
          // 1. Sync Badges if requested
          if (options?.pushBadges && profile.badgeSetId) {
            const currentSettings = await nuvioClient
              .pullProfileSettings(token, slot, 'tv')
              .catch(() => [])
            const baseSettings = currentSettings[0]?.settings_json || {}
            await nuvioClient.pushProfileSettings(token, slot, 'tv', {
              ...baseSettings,
              badges: {
                active_preset: profile.badgeSetId,
                updated_at: new Date().toISOString(),
              },
            })
          }

          // 2. Sync Avatar if requested
          if (options?.pushAvatar && (profile.avatarId || profile.avatarUrl)) {
            await nuvioClient.updateSingleProfile(token, slot, {
              avatar_id: profile.avatarId,
              avatar_url: profile.avatarUrl,
            })
          }

          // 3. Sync Collections if requested and configured
          if (options?.pushCollections && profile.configJson) {
            try {
              const parsed = JSON.parse(profile.configJson)
              if (parsed.collections && Array.isArray(parsed.collections)) {
                await nuvioClient.pushCollections(token, slot, parsed.collections)
              }
            } catch {
              // ignore non-json
            }
          }

          // 4. Sync Addons if requested and configured
          if (options?.pushAddons && profile.configJson) {
            try {
              const parsed = JSON.parse(profile.configJson)
              if (parsed.addons && Array.isArray(parsed.addons)) {
                await nuvioClient.pushAddons(token, slot, parsed.addons)
              }
            } catch {
              // ignore non-json
            }
          }

          deployReport.push({
            accountId: target.accountId,
            accountEmail: session.email,
            slot,
            status: 'success',
          })
        } catch (slotErr: any) {
          deployReport.push({
            accountId: target.accountId,
            accountEmail: session.email,
            slot,
            status: 'error',
            error: slotErr.message,
          })
        }
      }
    }

    return c.json({
      success: true,
      profileName: profile.name,
      report: deployReport,
    })
  } catch (err: any) {
    return c.json({ error: err.message || 'Deployment failed' }, 500)
  }
})
