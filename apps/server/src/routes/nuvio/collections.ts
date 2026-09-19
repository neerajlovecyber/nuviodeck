import { Hono } from 'hono'
import { nuvioClient } from '../../lib/nuvio-client'
import { resolveAccessToken } from './auth'
import type { NuvioCollection, CollectionFolder } from '../../types/nuvio'

export const collectionsRouter = new Hono()

// Helper to get collections array for a profile
async function getExistingCollections(token: string, profileIndex: number): Promise<NuvioCollection[]> {
  const res = await nuvioClient.pullCollections(token, profileIndex)
  return res[0]?.collections_json || []
}

// Get collections for profile
collectionsRouter.get('/:profileIndex', async (c) => {
  try {
    const token = await resolveAccessToken(c)
    const profileIndex = Number(c.req.param('profileIndex'))
    const collections = await getExistingCollections(token, profileIndex)
    return c.json({ profileIndex, collections })
  } catch (err: any) {
    return c.json(
      { error: err.message || 'Failed to fetch collections', details: err.details },
      err.status || 500
    )
  }
})

// Full replace collections (replaces entire profile's collections blob)
collectionsRouter.put('/:profileIndex', async (c) => {
  try {
    const token = await resolveAccessToken(c)
    const profileIndex = Number(c.req.param('profileIndex'))
    const { collections } = await c.req.json()

    if (!Array.isArray(collections)) {
      return c.json({ error: 'collections array is required' }, 400)
    }

    await nuvioClient.pushCollections(token, profileIndex, collections)
    const updated = await getExistingCollections(token, profileIndex)
    return c.json({ success: true, profileIndex, collections: updated })
  } catch (err: any) {
    return c.json(
      { error: err.message || 'Failed to replace collections', details: err.details },
      err.status || 500
    )
  }
})

// Append collection(s) to existing collections
collectionsRouter.post('/:profileIndex', async (c) => {
  try {
    const token = await resolveAccessToken(c)
    const profileIndex = Number(c.req.param('profileIndex'))
    const body = await c.req.json()

    const existing = await getExistingCollections(token, profileIndex)

    const newCollections: NuvioCollection[] = Array.isArray(body.collections)
      ? body.collections
      : [body]

    // Assign IDs if missing
    for (const col of newCollections) {
      if (!col.id) {
        col.id = `col-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
      }
      if (!col.folders) {
        col.folders = []
      }
    }

    const merged = [...existing, ...newCollections]
    await nuvioClient.pushCollections(token, profileIndex, merged)
    return c.json({ success: true, profileIndex, collections: merged })
  } catch (err: any) {
    return c.json(
      { error: err.message || 'Failed to append collection', details: err.details },
      err.status || 500
    )
  }
})

// Update single collection by ID
collectionsRouter.patch('/:profileIndex/:collectionId', async (c) => {
  try {
    const token = await resolveAccessToken(c)
    const profileIndex = Number(c.req.param('profileIndex'))
    const collectionId = c.req.param('collectionId')
    const updates: Partial<NuvioCollection> = await c.req.json()

    const existing = await getExistingCollections(token, profileIndex)
    const targetIdx = existing.findIndex((c) => c.id === collectionId)

    if (targetIdx === -1) {
      return c.json({ error: `Collection with id ${collectionId} not found` }, 404)
    }

    existing[targetIdx] = {
      ...existing[targetIdx],
      ...updates,
      id: collectionId,
    }

    await nuvioClient.pushCollections(token, profileIndex, existing)
    return c.json({
      success: true,
      profileIndex,
      collection: existing[targetIdx],
      collections: existing,
    })
  } catch (err: any) {
    return c.json(
      { error: err.message || 'Failed to update collection', details: err.details },
      err.status || 500
    )
  }
})

// Delete single collection by ID
collectionsRouter.delete('/:profileIndex/:collectionId', async (c) => {
  try {
    const token = await resolveAccessToken(c)
    const profileIndex = Number(c.req.param('profileIndex'))
    const collectionId = c.req.param('collectionId')

    const existing = await getExistingCollections(token, profileIndex)
    const filtered = existing.filter((c) => c.id !== collectionId)

    await nuvioClient.pushCollections(token, profileIndex, filtered)
    return c.json({ success: true, profileIndex, collections: filtered })
  } catch (err: any) {
    return c.json(
      { error: err.message || 'Failed to delete collection', details: err.details },
      err.status || 500
    )
  }
})

// Add folder to a collection
collectionsRouter.post('/:profileIndex/:collectionId/folders', async (c) => {
  try {
    const token = await resolveAccessToken(c)
    const profileIndex = Number(c.req.param('profileIndex'))
    const collectionId = c.req.param('collectionId')
    const folder: CollectionFolder = await c.req.json()

    if (!folder.id) {
      folder.id = `folder-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    }
    if (!folder.catalogSources) {
      folder.catalogSources = []
    }

    const existing = await getExistingCollections(token, profileIndex)
    const target = existing.find((c) => c.id === collectionId)
    if (!target) {
      return c.json({ error: `Collection ${collectionId} not found` }, 404)
    }

    target.folders = [...(target.folders || []), folder]
    await nuvioClient.pushCollections(token, profileIndex, existing)

    return c.json({ success: true, profileIndex, folder, collection: target })
  } catch (err: any) {
    return c.json(
      { error: err.message || 'Failed to add folder', details: err.details },
      err.status || 500
    )
  }
})

// Delete folder from a collection
collectionsRouter.delete('/:profileIndex/:collectionId/folders/:folderId', async (c) => {
  try {
    const token = await resolveAccessToken(c)
    const profileIndex = Number(c.req.param('profileIndex'))
    const collectionId = c.req.param('collectionId')
    const folderId = c.req.param('folderId')

    const existing = await getExistingCollections(token, profileIndex)
    const target = existing.find((c) => c.id === collectionId)
    if (!target) {
      return c.json({ error: `Collection ${collectionId} not found` }, 404)
    }

    target.folders = (target.folders || []).filter((f) => f.id !== folderId)
    await nuvioClient.pushCollections(token, profileIndex, existing)

    return c.json({ success: true, profileIndex, collection: target })
  } catch (err: any) {
    return c.json(
      { error: err.message || 'Failed to delete folder', details: err.details },
      err.status || 500
    )
  }
})
