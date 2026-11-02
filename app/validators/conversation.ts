import vine from '@vinejs/vine'

export const startConversationValidator = vine.create({
  userId: vine.number().positive(),
})

export const searchUsersValidator = vine.create({
  q: vine.string().maxLength(100).optional(),
})

export const sendMessageValidator = vine.create({
  body: vine.string().trim().minLength(1).maxLength(5000),
})
