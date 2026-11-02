import { DateTime } from 'luxon'
import Conversation from '#models/conversation'
import Message from '#models/message'
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

    const { body } = await request.validateUsing(sendMessageValidator)
    await Message.create({
      conversationId: conversation.id,
      userId: user.id,
      body,
    })

    conversation.updatedAt = DateTime.now()
    await conversation.save()

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

    return response.redirect().toRoute('chat.show', { id: conversation.id })
  }

  private async writableConversation(id: number, userId: number) {
    if (!Number.isInteger(id)) return null
    const conversation = await Conversation.query().where('id', id).where('type', 'private').first()
    if (!conversation || !(await Conversations.isMember(conversation.id, userId))) return null
    return conversation
  }
}
