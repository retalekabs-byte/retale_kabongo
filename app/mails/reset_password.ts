import { BaseMail } from '@adonisjs/mail'
import type User from '#models/user'

export default class ResetPassword extends BaseMail {
  subject = 'Réinitialise ton mot de passe — Kadea Chat'

  constructor(
    private user: User,
    private url: string
  ) {
    super()
  }

  prepare() {
    this.message.to(this.user.email).htmlView('emails/reset_password', {
      name: this.user.fullName,
      url: this.url,
    })
  }
}
