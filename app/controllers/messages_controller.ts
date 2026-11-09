import { DateTime } from 'luxon'
import transmit from '@adonisjs/transmit/services/main'
import Conversation from '#models/conversation'
import Message from '#models/message'
import Blocks from '#services/blocks'
import ConversationMember from '#models/conversation_member'
import Conversations from '#services/conversations'
import { sendMessageValidator } from '#validators/conversation'
import type { HttpContext } from '@adonisjs/core/http'

export default class MessagesController {
  async store({ params, request, auth, response, session }: HttpContext) {
    const user = auth.user!
    const conversation = await this.writableConversation(Number(params.id), user.id)
    if (!conversation) {
      session.flash('error', 'Tu n’as pas accès à cette conversation.')
      return response.redirect().toRoute('chat')
    }

    if (conversation.type === 'private' && (await this.privateIsBlocked(conversation.id, user.id))) {
      session.flash('error', 'Un blocage empêche d’envoyer un message privé.')
      return response.redirect().toRoute('chat.show', { id: conversation.id })
    }

    const { body } = await request.validateUsing(sendMessageValidator)
    const message = await Message.create({
      conversationId: conversation.id,
      userId: user.id,
      body,
    })
    await message.load('user')

    conversation.updatedAt = DateTime.now()
    await conversation.save()

    transmit.broadcast(`conversations/${conversation.id}`, {
      type: 'created',
      id: message.id,
      body: message.body,
      author: message.user.fullName,
      userId: message.userId,
      time: message.createdAt.toFormat('HH:mm'),
    })

    return response.redirect().toRoute('chat.show', { id: conversation.id })
  }

  async destroy({ params, auth, response, session }: HttpContext) {
    const user = auth.user!
    const conversation = await this.writableConversation(Number(params.id), user.id)
    if (!conversation) {
      session.flash('error', 'Tu n’as pas accès à cette conversation.')
      return response.redirect().toRoute('chat')
    }

    const message = await Message.query()
      .where('id', params.messageId)
      .where('conversationId', conversation.id)
      .whereNull('deletedAt')
      .first()

    if (!message) {
      session.flash('error', 'Ce message n’existe plus.')
      return response.redirect().toRoute('chat.show', { id: conversation.id })
    }

    if (message.userId !== user.id) {
      session.flash('error', 'Seul l’auteur peut supprimer ce message.')
      return response.redirect().toRoute('chat.show', { id: conversation.id })
    }

    message.deletedAt = DateTime.now()
    await message.save()

    const latest = await Message.query()
      .where('conversationId', conversation.id)
      .whereNull('deletedAt')
      .orderBy('createdAt', 'desc')
      .first()

    transmit.broadcast(`conversations/${conversation.id}`, {
      type: 'deleted',
      id: message.id,
      preview: latest?.body || 'Aucun message',
      time: latest ? Conversations.formatWhen(latest.createdAt) : '',
    })

    return response.redirect().toRoute('chat.show', { id: conversation.id })
  }

  private async writableConversation(id: number, userId: number) {
    if (!Number.isInteger(id)) return null
    const conversation = await Conversation.query()
      .where('id', id)
      .whereIn('type', ['private', 'group'])
      .first()
    if (!conversation || !(await Conversations.isMember(conversation.id, userId))) return null
    return conversation
  }

  private async privateIsBlocked(conversationId: number, userId: number) {
    const peer = await ConversationMember.query()
      .where('conversationId', conversationId)
      .whereNot('userId', userId)
      .first()

    if (!peer) return false
    return Blocks.between(userId, peer.userId)
  }
}
