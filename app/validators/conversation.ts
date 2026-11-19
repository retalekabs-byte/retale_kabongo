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

export const createGroupValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(255),
  members: vine.array(vine.number().positive()).minLength(1),
  avatar: vine
    .file({
      size: '2mb',
      extnames: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    })
    .optional(),
})

export const memberIdValidator = vine.create({
  userId: vine.number().positive(),
})
