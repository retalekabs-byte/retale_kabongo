import transmit from '@adonisjs/transmit/services/main'
import type { HttpContext } from '@adonisjs/core/http'
import Conversations from '#services/conversations'

transmit.authorize<{ id: string }>('conversations/:id', async (ctx: HttpContext, { id }) => {
  const userId = ctx.auth.user?.id
  if (!userId) return false
  return Conversations.isMember(Number(id), userId)
})
