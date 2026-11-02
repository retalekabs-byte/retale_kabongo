import vine from '@vinejs/vine'

export const startConversationValidator = vine.create({
  userId: vine.number().positive(),
})

export const searchUsersValidator = vine.create({
  q: vine.string().maxLength(100).optional(),
})
