import { Hono } from 'hono'

export const supportRouter = new Hono()

export interface SupportMessage {
  id: string
  sender: 'user' | 'support'
  body: string
  attachments?: string[]
  createdAt: string
}

export interface SupportTicket {
  id: string
  number: number
  subject: string
  status: 'open' | 'pending' | 'resolved' | 'closed'
  context?: Record<string, any>
  messages: SupportMessage[]
  unreadCount: number
  createdAt: string
  updatedAt: string
}

// In-memory store initialized with helpful starter tickets
let nextTicketNumber = 1043
const ticketsStore = new Map<string, SupportTicket>([
  [
    'tick-1042',
    {
      id: 'tick-1042',
      number: 1042,
      subject: 'Optimizing 4K Debrid Stream Buffering',
      status: 'resolved',
      context: {
        profileId: 'default',
        version: '1.0.0',
        proxy: 'mediaflow',
      },
      messages: [
        {
          id: 'msg-1',
          sender: 'user',
          body: 'Hello! What is the recommended stream proxy timeout when watching high bitrate 4K REMUX on an Apple TV?',
          createdAt: new Date(Date.now() - 3600 * 24 * 1000).toISOString(),
        },
        {
          id: 'msg-2',
          sender: 'support',
          body: 'Hi! For 4K REMUX streams, set your Stream Bridge timeout to 5000ms and verify your MediaFlow proxy caching buffer is enabled. Everything is 100% unlocked in Nuviodeck!',
          createdAt: new Date(Date.now() - 3600 * 20 * 1000).toISOString(),
        },
      ],
      unreadCount: 0,
      createdAt: new Date(Date.now() - 3600 * 24 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3600 * 20 * 1000).toISOString(),
    },
  ],
])

/**
 * GET /api/support/tickets
 * Returns all tickets for the user. Free for everyone in Nuviodeck.
 */
supportRouter.get('/tickets', (c) => {
  const tickets = Array.from(ticketsStore.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
  return c.json({ tickets })
})

/**
 * GET /api/support/tickets/:id
 * Returns conversation thread for a ticket.
 */
supportRouter.get('/tickets/:id', (c) => {
  const id = c.req.param('id')
  const ticket = ticketsStore.get(id)
  if (!ticket) {
    return c.json({ error: 'Ticket not found' }, 404)
  }
  return c.json({ ticket })
})

/**
 * POST /api/support/tickets
 * Opens a new support ticket.
 */
supportRouter.post('/tickets', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const subject = (body.subject || 'Support Request').trim()
  const initialMessage = (body.message || body.body || '').trim()
  const attachments = Array.isArray(body.attachments) ? body.attachments : []
  const context = body.context || {}

  if (!initialMessage) {
    return c.json({ error: 'Message body cannot be empty' }, 400)
  }

  const num = nextTicketNumber++
  const id = `tick-${num}`
  const now = new Date().toISOString()

  const newTicket: SupportTicket = {
    id,
    number: num,
    subject,
    status: 'open',
    context,
    messages: [
      {
        id: `msg-${Date.now()}`,
        sender: 'user',
        body: initialMessage,
        attachments,
        createdAt: now,
      },
    ],
    unreadCount: 0,
    createdAt: now,
    updatedAt: now,
  }

  ticketsStore.set(id, newTicket)
  return c.json({ success: true, ticket: newTicket }, 201)
})

/**
 * POST /api/support/tickets/:id/messages
 * Appends a message to a ticket conversation.
 */
supportRouter.post('/tickets/:id/messages', async (c) => {
  const id = c.req.param('id')
  const ticket = ticketsStore.get(id)
  if (!ticket) {
    return c.json({ error: 'Ticket not found' }, 404)
  }

  const body = await c.req.json().catch(() => ({}))
  const messageText = (body.body || body.message || '').trim()
  const attachments = Array.isArray(body.attachments) ? body.attachments : []

  if (!messageText) {
    return c.json({ error: 'Message body cannot be empty' }, 400)
  }

  const now = new Date().toISOString()
  const newMsg: SupportMessage = {
    id: `msg-${Date.now()}`,
    sender: 'user',
    body: messageText,
    attachments,
    createdAt: now,
  }

  ticket.messages.push(newMsg)
  ticket.updatedAt = now
  if (ticket.status === 'resolved' || ticket.status === 'closed') {
    ticket.status = 'open'
  }

  return c.json({ success: true, message: newMsg, ticket })
})

/**
 * PATCH /api/support/tickets/:id/close
 * Closes or resolves a support ticket.
 */
supportRouter.patch('/tickets/:id/close', (c) => {
  const id = c.req.param('id')
  const ticket = ticketsStore.get(id)
  if (!ticket) {
    return c.json({ error: 'Ticket not found' }, 404)
  }

  ticket.status = 'resolved'
  ticket.updatedAt = new Date().toISOString()
  return c.json({ success: true, ticket })
})
