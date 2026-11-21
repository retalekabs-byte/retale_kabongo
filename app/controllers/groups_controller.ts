import { DateTime } from 'luxon'
import Conversation from '#models/conversation'
import ConversationMember from '#models/conversation_member'
import User from '#models/user'
import Conversations from '#services/conversations'
import { createGroupValidator, searchUsersValidator } from '#validators/conversation'
import type { HttpContext } from '@adonisjs/core/http'

export default class GroupsController {
  async create({ view, auth, request }: HttpContext) {
    const user = auth.user!
    const { q } = await request.validateUsing(searchUsersValidator, { data: request.qs() })
    const name = String(request.qs().name || '')
    const selectedIds = this.idList(request.qs().members).filter((id) => id !== user.id)
    const selected = selectedIds.length
      ? await User.query().whereIn('id', selectedIds).whereNotNull('emailVerifiedAt').orderBy('fullName', 'asc')
      : []
    const excluded = [user.id, ...selected.map((person) => person.id)]
    const people = q ? await this.search(excluded, q) : []

    return view.render('pages/chat/group', {
      conversations: await Conversations.listFor(user),
      people,
      selected,
      query: q || '',
      name,
    })
  }

  async store({ request, response, session, auth }: HttpContext) {
    const user = auth.user!
    const { name, members: memberIds } = await request.validateUsing(createGroupValidator, {
      data: {
        name: request.input('name'),
        members: this.idList(request.input('members')).filter((id) => id !== user.id),
      },
    })
    const others = memberIds.length
      ? await User.query().whereIn('id', memberIds).whereNotNull('emailVerifiedAt')
      : []

    if (others.length < 1) {
      session.flash('error', 'Un groupe doit réunir au moins deux personnes.')
      return response.redirect().back()
    }

    const conversation = await Conversations.createGroup(user, name, others, null)
    return response.redirect().toRoute('chat.show', { id: conversation.id })
  }

  async members({ view, auth, params, request, response, session }: HttpContext) {
    const user = auth.user!
    const conversation = await this.groupFor(Number(params.id), user.id)
    if (!conversation) {
      session.flash('error', 'Tu n’as pas accès à ce groupe.')
      return response.redirect().toRoute('chat')
    }

    const membership = await Conversations.membership(conversation.id, user.id)
    const { q } = await request.validateUsing(searchUsersValidator, { data: request.qs() })
    return this.renderMembers(view, user, conversation, membership?.role === 'admin', q || '')
  }

  async add({ request, auth, params, response, session }: HttpContext) {
    const user = auth.user!
    const conversation = await this.groupFor(Number(params.id), user.id)
    const membership = conversation ? await Conversations.membership(conversation.id, user.id) : null
    if (!conversation || membership?.role !== 'admin') {
      session.flash('error', 'Seul un admin peut ajouter un membre.')
      return response.redirect().toRoute('chat')
    }

    const ids = this.idList(request.input('members', request.input('userId'))).filter((id) => id !== user.id)
    if (!ids.length) {
      session.flash('error', 'Coche au moins une personne.')
      return response.redirect().toRoute('chat.show', { id: conversation.id })
    }

    const added: string[] = []
    for (const id of ids) {
      const other = await User.query().where('id', id).whereNotNull('emailVerifiedAt').first()
      if (!other) continue
      const already = await Conversations.membership(conversation.id, other.id)
      if (already) continue
      await ConversationMember.create({
        conversationId: conversation.id,
        userId: other.id,
        role: 'member',
        joinedAt: DateTime.now(),
      })
      added.push(other.fullName)
    }

    if (!added.length) {
      session.flash('error', 'Ces personnes sont déjà dans le groupe.')
    } else if (added.length === 1) {
      session.flash('success', `${added[0]} a rejoint le groupe.`)
    } else {
      session.flash('success', 'Les personnes ont rejoint le groupe.')
    }
    return response.redirect().toRoute('chat.show', { id: conversation.id })
  }

  async remove({ auth, params, response, session }: HttpContext) {
    const user = auth.user!
    const conversation = await this.groupFor(Number(params.id), user.id)
    const membership = conversation ? await Conversations.membership(conversation.id, user.id) : null
    if (!conversation || membership?.role !== 'admin') {
      session.flash('error', 'Seul un admin peut retirer un membre.')
      return response.redirect().toRoute('chat')
    }

    const targetId = Number(params.userId)
    if (targetId === user.id) {
      session.flash('error', 'Tu ne peux pas te retirer du groupe.')
      return response.redirect().toRoute('chat.show', { id: conversation.id })
    }

    const count = await ConversationMember.query().where('conversationId', conversation.id).count('* as total')
    if (Number(count[0].$extras.total) <= 2) {
      session.flash('error', 'Un groupe doit garder au moins deux membres.')
      return response.redirect().toRoute('chat.show', { id: conversation.id })
    }

    await ConversationMember.query()
      .where('conversationId', conversation.id)
      .where('userId', targetId)
      .delete()

    return response.redirect().toRoute('chat.show', { id: conversation.id })
  }

  private async renderMembers(
    view: HttpContext['view'],
    user: User,
    conversation: Conversation,
    isAdmin: boolean,
    query: string
  ) {
    const members = await ConversationMember.query()
      .where('conversationId', conversation.id)
      .preload('user')
      .orderBy('id', 'asc')
    const people = query ? await this.search(members.map((member) => member.userId), query) : []

    return view.render('pages/chat/members', {
      conversations: await Conversations.listFor(user),
      conversation,
      members,
      isAdmin,
      people,
      query,
    })
  }

  private async groupFor(id: number, userId: number) {
    if (!Number.isInteger(id)) return null
    const conversation = await Conversation.query().where('id', id).where('type', 'group').first()
    if (!conversation || !(await Conversations.isMember(conversation.id, userId))) return null
    return conversation
  }

  private search(excludedIds: number[], q: string) {
    const term = `%${q}%`
    return User.query()
      .whereNotIn('id', excludedIds)
      .whereNotNull('emailVerifiedAt')
      .where((query) => {
        query.whereILike('fullName', term).orWhereILike('email', term)
      })
      .orderBy('fullName', 'asc')
      .limit(10)
  }

  private idList(value: unknown) {
    const raw = Array.isArray(value) ? value : value ? [value] : []
    return [...new Set(raw.map((item) => Number(item)).filter((id) => Number.isInteger(id) && id > 0))]
  }
}
