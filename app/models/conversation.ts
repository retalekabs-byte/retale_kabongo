import { ConversationSchema } from '#database/schema'
import ConversationMember from '#models/conversation_member'
import Message from '#models/message'
import User from '#models/user'
import { belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'

export default class Conversation extends ConversationSchema {
  @belongsTo(() => User, { foreignKey: 'createdBy' })
  declare creator: BelongsTo<typeof User>

  @hasMany(() => ConversationMember)
  declare conversationMembers: HasMany<typeof ConversationMember>

  @hasMany(() => Message)
  declare messages: HasMany<typeof Message>

  @manyToMany(() => User, {
    pivotTable: 'conversation_members',
    pivotForeignKey: 'conversation_id',
    pivotRelatedForeignKey: 'user_id',
    pivotColumns: ['role', 'last_read_at', 'joined_at'],
    pivotTimestamps: true,
  })
  declare members: ManyToMany<typeof User>
}
