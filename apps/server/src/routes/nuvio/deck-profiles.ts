import { Hono } from 'hono'
import { db } from '../../db'
import { deckProfiles, nuvioSessions } from '../../db/schema'
import { eq, desc, or, isNull } from 'drizzle-orm'
import { nuvioClient } from '../../lib/nuvio-client'
import { resolveCurrentSession } from './auth'

export const deckProfilesRouter = new Hono()

// List deck profile configurations for current user strictly
deckProfilesRouter.get('/', async (c) => {
  try {
    const session = await resolveCurrentSession(c).catch(() => null)
    if (!session?.userId) {
      return c.json({ profiles: [] })
    }

    const profiles = await db
      .select()
      .from(deckProfiles)
      .where(eq(deckProfiles.userId, session.userId))
      .orderBy(desc(deckProfiles.isActive), desc(deckProfiles.updatedAt))

    return c.json({ profiles })
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to fetch deck profiles' }, 500)
  }
})

// Create new deck profile tied to the logged-in account
deckProfilesRouter.post('/', async (c) => {
  try {
    const session = await resolveCurrentSession(c).catch(() => null)
    const body = await c.req.json()
    const name = body.name?.trim() || 'New Profile'
    const id = `deck-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    const now = new Date().toISOString()

    const newProfile = {
      id,
      userId: session?.userId || null,
      userEmail: session?.email || null,
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

// Update profile (e.g. rename, toggle active, change avatar)
deckProfilesRouter.patch('/:id', async (c) => {
  try {
    const session = await resolveCurrentSession(c).catch(() => null)
    const id = c.req.param('id')

    const [existing] = await db
      .select()
      .from(deckProfiles)
      .where(eq(deckProfiles.id, id))
      .limit(1)

    if (!existing) {
      return c.json({ error: 'Deck profile not found' }, 404)
    }

    if (session?.userId && existing.userId && existing.userId !== session.userId) {
      return c.json({ error: 'Unauthorized to modify this profile' }, 403)
    }

    const body = await c.req.json()
    const now = new Date().toISOString()

    // If setting active, deactivate others for this user
    if (body.isActive) {
      if (session?.userId) {
        await db.update(deckProfiles).set({ isActive: false }).where(eq(deckProfiles.userId, session.userId))
      } else {
        await db.update(deckProfiles).set({ isActive: false })
      }
    }

    await db
      .update(deckProfiles)
      .set({
        ...body,
        // Adopt profile if was previously unassigned
        userId: existing.userId || session?.userId || null,
        userEmail: existing.userEmail || session?.email || null,
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
    const session = await resolveCurrentSession(c).catch(() => null)
    const id = c.req.param('id')

    const [existing] = await db
      .select()
      .from(deckProfiles)
      .where(eq(deckProfiles.id, id))
      .limit(1)

    if (!existing) {
      return c.json({ error: 'Deck profile not found' }, 404)
    }

    if (session?.userId && existing.userId && existing.userId !== session.userId) {
      return c.json({ error: 'Unauthorized to delete this profile' }, 403)
    }

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

// Apply section defaults (preferences / AI / filters) to all existing profiles
deckProfilesRouter.post('/apply-defaults', async (c) => {
  try {
    const body = await c.req.json()
    const { section, data } = body
    const profiles = await db.select().from(deckProfiles)
    let updatedCount = 0

    for (const p of profiles) {
      let cfg: Record<string, any> = {}
      if (p.configJson) {
        try {
          cfg = JSON.parse(p.configJson)
        } catch {
          cfg = {}
        }
      }

      if (section && data) {
        cfg[section] = { ...(cfg[section] || {}), ...data }
      } else if (data) {
        cfg = { ...cfg, ...data }
      } else if (body) {
        if (body.preferences) cfg.preferences = { ...(cfg.preferences || {}), ...body.preferences }
        if (body.ai) cfg.ai = { ...(cfg.ai || {}), ...body.ai }
        if (body.anime) cfg.anime = { ...(cfg.anime || {}), ...body.anime }
      }

      await db
        .update(deckProfiles)
        .set({
          configJson: JSON.stringify(cfg),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(deckProfiles.id, p.id))

      updatedCount++
    }

    return c.json({ success: true, updatedCount, message: `Applied defaults to ${updatedCount} profiles` })
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to apply defaults' }, 500)
  }
})

// Multi-account, multi-profile deployment engine!
deckProfilesRouter.post('/:id/deploy', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json().catch(() => ({}))
    const { options } = body
    let targets = body.targets
    // targets: Array<{ accountId: string, slots: number[] }>
    // options: { pushAvatar?: boolean, pushBadges?: boolean, pushCollections?: boolean, pushAddons?: boolean }

    const currentSession = await resolveCurrentSession(c).catch(() => null)

    const [profile] = await db
      .select()
      .from(deckProfiles)
      .where(eq(deckProfiles.id, id))
      .limit(1)

    if (!profile) {
      return c.json({ error: 'Deck profile not found' }, 404)
    }

    if (currentSession?.userId && profile.userId && profile.userId !== currentSession.userId) {
      return c.json({ error: 'Unauthorized to deploy this profile' }, 403)
    }

    // Default target: logged-in user's active session
    if (!targets || targets.length === 0) {
      if (currentSession) {
        targets = [{ accountId: currentSession.sessionId, slots: body.slots || [1] }]
      }
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

          // 5. Automatically install / update this NuvioDeck Profile addon in Nuvio profile slot
          if (options?.pushDeckAddon ?? true) {
            try {
              const reqUrl = new URL(c.req.url)
              const manifestUrl = `${reqUrl.origin}/api/catalogs/${profile.id}/manifest.json`
              await nuvioClient.appendOrUpdateAddon(token, slot, {
                name: `Nuviodeck: ${profile.name}`,
                url: manifestUrl,
                enabled: true,
              })
            } catch (deckAddonErr: any) {
              console.warn('Failed to auto-register deck addon in Nuvio:', deckAddonErr.message)
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
