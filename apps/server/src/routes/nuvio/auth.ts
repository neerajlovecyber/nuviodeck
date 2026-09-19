import { Hono } from 'hono'
import { nuvioClient } from '../../lib/nuvio-client'
import { db } from '../../db'
import { nuvioSessions } from '../../db/schema'
import { eq, desc } from 'drizzle-orm'
import { NuvioApiError } from '../../lib/errors'

export const authRouter = new Hono()

// Helper to extract access token from Authorization header or fallback to latest session in DB
export async function resolveAccessToken(c: any): Promise<string> {
  const authHeader = c.req.header('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }

  // Fallback: check stored local session in DB
  const [latestSession] = await db
    .select()
    .from(nuvioSessions)
    .orderBy(desc(nuvioSessions.updatedAt))
    .limit(1)

  if (latestSession) {
    // Check if expired and needs refresh
    if (Date.now() >= latestSession.expiresAt - 60000) {
      try {
        const refreshed = await nuvioClient.refreshToken(latestSession.refreshToken)
        await db
          .update(nuvioSessions)
          .set({
            accessToken: refreshed.access_token,
            refreshToken: refreshed.refresh_token,
            expiresAt: Date.now() + refreshed.expires_in * 1000,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(nuvioSessions.id, latestSession.id))
        return refreshed.access_token
      } catch {
        // Continue with existing if refresh fails
      }
    }
    return latestSession.accessToken
  }

  throw new NuvioApiError('Missing authorization header or active session', 401)
}

// Sign in with email and password
authRouter.post('/login', async (c) => {
  try {
    const { email, password, saveSession = true } = await c.req.json()
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400)
    }

    const authData = await nuvioClient.signInWithPassword(email, password)
    const expiresAt = Date.now() + authData.expires_in * 1000

    let sessionId: string | undefined

    if (saveSession) {
      sessionId = crypto.randomUUID()
      await db.insert(nuvioSessions).values({
        id: sessionId,
        userId: authData.user.id,
        email: authData.user.email,
        accessToken: authData.access_token,
        refreshToken: authData.refresh_token,
        expiresAt,
        activeProfileIndex: 1,
      })
    }

    return c.json({
      success: true,
      accessToken: authData.access_token,
      refreshToken: authData.refresh_token,
      expiresIn: authData.expires_in,
      user: authData.user,
      sessionId,
    })
  } catch (err: any) {
    return c.json(
      { error: err.message || 'Login failed', details: err.details },
      err.status || 500
    )
  }
})

// Sign up for a new Nuvio account
authRouter.post('/signup', async (c) => {
  try {
    const { email, password, saveSession = true } = await c.req.json()
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400)
    }

    const authData = await nuvioClient.signUpWithPassword(email, password)
    const expiresAt = Date.now() + (authData.expires_in || 3600) * 1000

    let sessionId: string | undefined

    if (saveSession && authData.access_token) {
      sessionId = crypto.randomUUID()
      await db.insert(nuvioSessions).values({
        id: sessionId,
        userId: authData.user?.id || crypto.randomUUID(),
        email: authData.user?.email || email,
        accessToken: authData.access_token,
        refreshToken: authData.refresh_token || '',
        expiresAt,
        activeProfileIndex: 1,
      })
    }

    return c.json({
      success: true,
      message: 'Nuvio account created successfully',
      accessToken: authData.access_token,
      refreshToken: authData.refresh_token,
      expiresIn: authData.expires_in,
      user: authData.user,
      sessionId,
    })
  } catch (err: any) {
    return c.json(
      { error: err.message || 'Signup failed', details: err.details },
      err.status || 500
    )
  }
})

// Refresh token
authRouter.post('/refresh', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}))
    let token = body.refreshToken

    if (!token) {
      const [session] = await db
        .select()
        .from(nuvioSessions)
        .orderBy(desc(nuvioSessions.updatedAt))
        .limit(1)
      if (session) {
        token = session.refreshToken
      }
    }

    if (!token) {
      return c.json({ error: 'Refresh token is required' }, 400)
    }

    const authData = await nuvioClient.refreshToken(token)
    const expiresAt = Date.now() + authData.expires_in * 1000

    await db
      .update(nuvioSessions)
      .set({
        accessToken: authData.access_token,
        refreshToken: authData.refresh_token,
        expiresAt,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(nuvioSessions.refreshToken, token))

    return c.json({
      success: true,
      accessToken: authData.access_token,
      refreshToken: authData.refresh_token,
      expiresIn: authData.expires_in,
      user: authData.user,
    })
  } catch (err: any) {
    return c.json(
      { error: err.message || 'Refresh token failed', details: err.details },
      err.status || 500
    )
  }
})

// Get current user
authRouter.get('/me', async (c) => {
  try {
    const token = await resolveAccessToken(c)
    const user = await nuvioClient.getCurrentUser(token)
    return c.json({ user })
  } catch (err: any) {
    return c.json(
      { error: err.message || 'Failed to get user profile' },
      err.status || 500
    )
  }
})

// Get active stored session
authRouter.get('/session', async (c) => {
  try {
    const [latestSession] = await db
      .select()
      .from(nuvioSessions)
      .orderBy(desc(nuvioSessions.updatedAt))
      .limit(1)

    if (!latestSession) {
      return c.json({ session: null })
    }

    return c.json({
      session: {
        id: latestSession.id,
        email: latestSession.email,
        userId: latestSession.userId,
        expiresAt: latestSession.expiresAt,
        activeProfileIndex: latestSession.activeProfileIndex,
        isExpired: Date.now() >= latestSession.expiresAt,
      },
    })
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to load session' }, 500)
  }
})

// List all connected Nuvio accounts
authRouter.get('/sessions', async (c) => {
  try {
    const sessions = await db
      .select({
        id: nuvioSessions.id,
        email: nuvioSessions.email,
        userId: nuvioSessions.userId,
        expiresAt: nuvioSessions.expiresAt,
        activeProfileIndex: nuvioSessions.activeProfileIndex,
        createdAt: nuvioSessions.createdAt,
        updatedAt: nuvioSessions.updatedAt,
      })
      .from(nuvioSessions)
      .orderBy(desc(nuvioSessions.updatedAt))

    return c.json({ sessions })
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to list accounts' }, 500)
  }
})

// Switch active account (touches updatedAt so it becomes primary)
authRouter.post('/sessions/:sessionId/select', async (c) => {
  try {
    const sessionId = c.req.param('sessionId')
    const [target] = await db
      .select()
      .from(nuvioSessions)
      .where(eq(nuvioSessions.id, sessionId))
      .limit(1)

    if (!target) {
      return c.json({ error: 'Account session not found' }, 404)
    }

    await db
      .update(nuvioSessions)
      .set({ updatedAt: new Date().toISOString() })
      .where(eq(nuvioSessions.id, sessionId))

    return c.json({
      success: true,
      activeSession: {
        id: target.id,
        email: target.email,
        userId: target.userId,
        activeProfileIndex: target.activeProfileIndex,
      },
    })
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to switch account' }, 500)
  }
})

// Disconnect a specific account
authRouter.delete('/sessions/:sessionId', async (c) => {
  try {
    const sessionId = c.req.param('sessionId')
    await db.delete(nuvioSessions).where(eq(nuvioSessions.id, sessionId))
    return c.json({ success: true, message: 'Account removed' })
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to remove account' }, 500)
  }
})

// Logout current session
authRouter.post('/logout', async (c) => {
  try {
    const token = await resolveAccessToken(c).catch(() => null)
    if (token) {
      await nuvioClient.signOut(token).catch(() => {})
      await db.delete(nuvioSessions).where(eq(nuvioSessions.accessToken, token))
    }
    return c.json({ success: true, message: 'Logged out successfully' })
  } catch (err: any) {
    return c.json({ error: err.message || 'Logout failed' }, 500)
  }
})
