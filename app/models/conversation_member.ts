import { ConversationMemberSchema } from '#database/schema'
import Conversation from '#models/conversation'
import User from '#models/user'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class ConversationMember extends ConversationMemberSchema {
  @belongsTo(() => Conversation)
  declare conversation: BelongsTo<typeof Conversation>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
