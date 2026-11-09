import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import Conversation from '#models/conversation'
import ConversationMember from '#models/conversation_member'
import Message from '#models/message'
import User from '#models/user'

export type ConversationListItem = {
  id: number
  name: string
  initials: string
  avatar: string | null
  group: boolean
  preview: string
  time: string
}

export default class Conversations {
  static async listFor(user: User): Promise<ConversationListItem[]> {
    const memberships = await ConversationMember.query().where('userId', user.id).select('conversationId')
    const ids = memberships.map((row) => row.conversationId)
    if (ids.length === 0) return []

    const conversations = await Conversation.query().whereIn('id', ids).preload('members')

    const latest = await this.latestMessages(conversations.map((row) => row.id))

    return conversations
      .map((conversation) => {
        const peer = conversation.members.find((member) => member.id !== user.id)
        const message = latest.get(conversation.id)
        const stamp = message?.createdAt ?? conversation.updatedAt ?? conversation.createdAt
        const group = conversation.type === 'group'
        const name = group ? conversation.name || 'Groupe' : peer?.fullName || 'Conversation'

        return {
          id: conversation.id,
          name,
          initials: group ? this.initialsFrom(name) : peer?.initials || '?',
          avatar: group ? conversation.avatar : (peer?.avatar ?? null),
          group,
          preview: message?.body || 'Aucun message',
          time: this.formatWhen(stamp),
          sort: stamp.toMillis(),
        }
      })
      .sort((a, b) => b.sort - a.sort)
      .map(({ sort, ...item }) => item)
  }

  static async findPrivate(userId: number, otherId: number) {
    const mine = db.from('conversation_members').where('user_id', userId).select('conversation_id')
    const row = await db
      .from('conversation_members')
      .join('conversations', 'conversations.id', 'conversation_members.conversation_id')
      .where('conversation_members.user_id', otherId)
      .where('conversations.type', 'private')
      .whereIn('conversation_members.conversation_id', mine)
      .select('conversations.id')
      .first()

    if (!row) return null

    const count = await ConversationMember.query().where('conversationId', row.id).count('* as total')
    const total = Number(count[0].$extras.total)
    if (total !== 2) return null

    return Conversation.find(row.id)
  }

  static async findOrCreatePrivate(user: User, other: User) {
    const existing = await this.findPrivate(user.id, other.id)
    if (existing) return existing

    const trx = await db.transaction()
    try {
      const again = await this.findPrivate(user.id, other.id)
      if (again) {
        await trx.rollback()
        return again
      }

      const conversation = new Conversation()
      conversation.useTransaction(trx)
      conversation.type = 'private'
      conversation.createdBy = user.id
      await conversation.save()

      const joinedAt = DateTime.now()
      await ConversationMember.createMany(
        [
          { conversationId: conversation.id, userId: user.id, role: 'member', joinedAt },
          { conversationId: conversation.id, userId: other.id, role: 'member', joinedAt },
        ],
        { client: trx }
      )

      await trx.commit()
      return conversation
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  static initialsFrom(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2)
    const letters = parts.map((part) => part.charAt(0)).join('')
    return (letters || '?').toUpperCase()
  }

  static async createGroup(user: User, name: string, others: User[], avatar: string | null) {
    const trx = await db.transaction()
    try {
      const conversation = new Conversation()
      conversation.useTransaction(trx)
      conversation.type = 'group'
      conversation.name = name
      conversation.avatar = avatar
      conversation.createdBy = user.id
      await conversation.save()

      const joinedAt = DateTime.now()
      await ConversationMember.createMany(
        [
          { conversationId: conversation.id, userId: user.id, role: 'admin', joinedAt },
          ...others.map((member) => ({
            conversationId: conversation.id,
            userId: member.id,
            role: 'member',
            joinedAt,
          })),
        ],
        { client: trx }
      )

      await trx.commit()
      return conversation
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  static async membership(conversationId: number, userId: number) {
    return ConversationMember.query()
      .where('conversationId', conversationId)
      .where('userId', userId)
      .first()
  }

  static async isMember(conversationId: number, userId: number) {
    const row = await ConversationMember.query()
      .where('conversationId', conversationId)
      .where('userId', userId)
      .first()

    return Boolean(row)
  }

  static async latestMessages(conversationIds: number[]) {
    const messages = await Message.query()
      .whereIn('conversationId', conversationIds)
      .whereNull('deletedAt')
      .orderBy('createdAt', 'desc')

    const byConversation = new Map<number, Message>()
    for (const message of messages) {
      if (!byConversation.has(message.conversationId)) {
        byConversation.set(message.conversationId, message)
      }
    }
    return byConversation
  }

  static formatWhen(date: DateTime) {
    const now = DateTime.now()
    if (date.hasSame(now, 'day')) return date.toFormat('HH:mm')
    if (date.hasSame(now.minus({ days: 1 }), 'day')) return 'Hier'
    if (date > now.minus({ days: 6 })) return date.setLocale('fr').toFormat('ccc')
    return date.toFormat('dd/MM')
  }
}
