import { Hono } from 'hono'
import { authRouter } from './auth'
import { profilesRouter } from './profiles'
import { addonsRouter } from './addons'
import { collectionsRouter } from './collections'
import { syncRouter } from './sync'
import { deckProfilesRouter } from './deck-profiles'
import { settingsRouter } from './settings'

export const nuvioRouter = new Hono()

// Mount all Nuvio-specific sub-routes under their dedicated namespace
nuvioRouter.route('/auth', authRouter)
nuvioRouter.route('/profiles', profilesRouter)
nuvioRouter.route('/addons', addonsRouter)
nuvioRouter.route('/collections', collectionsRouter)
nuvioRouter.route('/sync', syncRouter)
nuvioRouter.route('/deck-profiles', deckProfilesRouter)
nuvioRouter.route('/settings', settingsRouter)
