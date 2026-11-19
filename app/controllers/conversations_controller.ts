import Conversation from '#models/conversation'
import Message from '#models/message'
import User from '#models/user'
import Blocks from '#services/blocks'
import Conversations from '#services/conversations'
import { searchUsersValidator, startConversationValidator } from '#validators/conversation'
import type { HttpContext } from '@adonisjs/core/http'

export default class ConversationsController {
  async index({ view, auth }: HttpContext) {
    const user = auth.user!
    return view.render('pages/chat/show', {
      title: 'Chat — Kadea Chat',
      conversations: await Conversations.listFor(user),
      conversation: null,
      peer: null,
      messages: [],
    })
  }

  async people({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const { q } = await request.validateUsing(searchUsersValidator, { data: request.qs() })
    const blocked = new Set(await Blocks.relatedIds(user.id))
    const people = await this.search(user.id, q || '')

    return response.json(
      people.map((person) => ({
        id: person.id,
        fullName: person.fullName,
        email: person.email,
        initials: person.initials,
        avatar: person.avatar,
        blocked: blocked.has(person.id),
      }))
    )
  }

  async create({ view, auth, request }: HttpContext) {
    const user = auth.user!
    const { q } = await request.validateUsing(searchUsersValidator, { data: request.qs() })
    const people = q ? await this.search(user.id, q) : []

    return view.render('pages/chat/new', {
      conversations: await Conversations.listFor(user),
      people,
      blockedIds: await Blocks.relatedIds(user.id),
      query: q || '',
    })
  }

  async store({ request, response, session, auth }: HttpContext) {
    const user = auth.user!
    const { userId } = await request.validateUsing(startConversationValidator)

    if (userId === user.id) {
      session.flash('error', 'Tu ne peux pas ouvrir une conversation avec toi-même.')
      return response.redirect().toRoute('chat')
    }

    const other = await User.query().where('id', userId).whereNotNull('emailVerifiedAt').first()
    if (!other) {
      session.flash('error', 'Cette personne est introuvable.')
      return response.redirect().toRoute('chat')
    }

    if (await Blocks.between(user.id, other.id)) {
      session.flash('error', 'Un blocage empêche d’ouvrir cette conversation privée.')
      return response.redirect().toRoute('chat')
    }

    const conversation = await Conversations.findOrCreatePrivate(user, other)
    return response.redirect().toRoute('chat.show', { id: conversation.id })
  }

  async show({ view, auth, params, response, session }: HttpContext) {
    const user = auth.user!
    const conversation = await Conversation.query()
      .where('id', params.id)
      .whereIn('type', ['private', 'group'])
      .preload('members')
      .first()

    if (!conversation || !(await Conversations.isMember(conversation.id, user.id))) {
      session.flash('error', 'Tu n’as pas accès à cette conversation.')
      return response.redirect().toRoute('chat')
    }

    const peer = conversation.members.find((member) => member.id !== user.id) || null
    const heading =
      conversation.type === 'group' ? conversation.name || 'Groupe' : peer?.fullName || 'Conversation'
    const blocked =
      conversation.type === 'private' && peer ? await Blocks.between(user.id, peer.id) : false
    const blockedByMe =
      conversation.type === 'private' && peer ? Boolean(await Blocks.mine(user.id, peer.id)) : false
    const rows = await Message.query()
      .where('conversationId', conversation.id)
      .whereNull('deletedAt')
      .preload('user')
      .orderBy('createdAt', 'asc')

    return view.render('pages/chat/show', {
      title: `${heading} — Kadea Chat`,
      conversations: await Conversations.listFor(user),
      conversation,
      heading,
      peer,
      blocked,
      blockedByMe,
      messages: rows.map((message) => ({
        id: message.id,
        body: message.body,
        mine: message.userId === user.id,
        author: message.user.fullName,
        time: message.createdAt.toFormat('HH:mm'),
      })),
    })
  }

  private search(userId: number, q: string) {
    const query = User.query()
      .whereNot('id', userId)
      .whereNotNull('emailVerifiedAt')
      .orderBy('fullName', 'asc')
      .limit(20)

    if (q) {
      const term = `%${q}%`
      query.where((builder) => {
        builder.whereILike('fullName', term).orWhereILike('email', term)
      })
    }

    return query
  }
}
