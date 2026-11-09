import Conversation from '#models/conversation'
import Message from '#models/message'
import User from '#models/user'
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

  async create({ view, auth, request }: HttpContext) {
    const user = auth.user!
    const { q } = await request.validateUsing(searchUsersValidator, { data: request.qs() })
    const people = q ? await this.search(user.id, q) : []

    return view.render('pages/chat/new', {
      conversations: await Conversations.listFor(user),
      people,
      query: q || '',
    })
  }

  async store({ request, response, session, auth }: HttpContext) {
    const user = auth.user!
    const { userId } = await request.validateUsing(startConversationValidator)

    if (userId === user.id) {
      session.flash('error', 'Tu ne peux pas ouvrir une conversation avec toi-même.')
      return response.redirect().toRoute('conversations.create')
    }

    const other = await User.query().where('id', userId).whereNotNull('emailVerifiedAt').first()
    if (!other) {
      session.flash('error', 'Cette personne est introuvable.')
      return response.redirect().toRoute('conversations.create')
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
    const term = `%${q}%`
    return User.query()
      .whereNot('id', userId)
      .whereNotNull('emailVerifiedAt')
      .where((query) => {
        query.whereILike('fullName', term).orWhereILike('email', term)
      })
      .orderBy('fullName', 'asc')
      .limit(10)
  }
}
