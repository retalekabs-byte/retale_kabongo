import { UserSchema } from '#database/schema'
import Conversation from '#models/conversation'
import ConversationMember from '#models/conversation_member'
import EmailVerificationToken from '#models/email_verification_token'
import Message from '#models/message'
import PasswordResetToken from '#models/password_reset_token'
import UserBlock from '#models/user_block'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'

export default class User extends compose(UserSchema, withAuthFinder(hash)) {
  @hasMany(() => EmailVerificationToken)
  declare emailVerificationTokens: HasMany<typeof EmailVerificationToken>

  @hasMany(() => PasswordResetToken)
  declare passwordResetTokens: HasMany<typeof PasswordResetToken>

  @hasMany(() => Conversation, { foreignKey: 'createdBy' })
  declare createdConversations: HasMany<typeof Conversation>

  @hasMany(() => ConversationMember)
  declare conversationMembers: HasMany<typeof ConversationMember>

  @hasMany(() => Message)
  declare messages: HasMany<typeof Message>

  @hasMany(() => UserBlock, { foreignKey: 'blockerId' })
  declare givenBlocks: HasMany<typeof UserBlock>

  @hasMany(() => UserBlock, { foreignKey: 'blockedId' })
  declare receivedBlocks: HasMany<typeof UserBlock>

  @manyToMany(() => Conversation, {
    pivotTable: 'conversation_members',
    pivotForeignKey: 'user_id',
    pivotRelatedForeignKey: 'conversation_id',
    pivotColumns: ['role', 'last_read_at', 'joined_at'],
    pivotTimestamps: true,
  })
  declare conversations: ManyToMany<typeof Conversation>

  get initials() {
    const [first, last] = this.fullName ? this.fullName.split(' ') : this.email.split('@')
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    }
    return `${first.slice(0, 2)}`.toUpperCase()
  }
}
