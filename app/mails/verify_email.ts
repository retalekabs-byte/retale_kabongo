import { BaseMail } from '@adonisjs/mail'

type Recipient = { email: string; fullName: string }

export default class VerifyEmail extends BaseMail {
  subject = 'Confirme ton adresse — Kadea Chat'

  constructor(
    private user: Recipient,
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
