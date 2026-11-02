import { BaseMail } from '@adonisjs/mail'
import type User from '#models/user'

export default class VerifyEmail extends BaseMail {
  subject = 'Confirme ton adresse — Kadea Chat'

  constructor(
    private user: User,
    private url: string
  ) {
    super()
  }

  prepare() {
    this.message.to(this.user.email).htmlView('emails/verify_email', {
      name: this.user.fullName,
      url: this.url,
    })
  }
}
