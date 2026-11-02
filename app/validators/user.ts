import vine from '@vinejs/vine'

const email = () => vine.string().email().maxLength(254)
const password = () => vine.string().minLength(8).maxLength(32)

export const signupValidator = vine.create({
  fullName: vine.string().maxLength(255),
  email: email().unique({ table: 'users', column: 'email' }),
  password: password(),
  passwordConfirmation: password().sameAs('password'),
})

export const loginValidator = vine.create({
  email: email(),
  password: vine.string(),
})

export const forgotPasswordValidator = vine.create({
  email: email(),
})

export const resetPasswordValidator = vine.create({
  password: password(),
  passwordConfirmation: password().sameAs('password'),
})

export const profileValidator = vine.create({
  fullName: vine.string().maxLength(255),
  password: vine.string().minLength(8).maxLength(32).nullable(),
  passwordConfirmation: vine.string().nullable(),
  avatar: vine
    .file({
      size: '2mb',
      extnames: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    })
    .optional(),
})
