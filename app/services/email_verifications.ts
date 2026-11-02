import { createHash, randomBytes } from 'node:crypto'
import { DateTime } from 'luxon'
import app from '@adonisjs/core/services/app'
import logger from '@adonisjs/core/services/logger'
import router from '@adonisjs/core/services/router'
import env from '#start/env'
import mail from '@adonisjs/mail/services/main'
import EmailVerificationToken from '#models/email_verification_token'
import type User from '#models/user'
import VerifyEmail from '#mails/verify_email'

export default class EmailVerifications {
  static async issueAndNotify(user: User) {
    const url = await this.issue(user)

    try {
      await mail.send(new VerifyEmail(user, url))
    } catch (error) {
      logger.error({ err: error }, 'envoi du mail de confirmation impossible')
      if (app.inProduction) throw error
      logger.info(`Lien de confirmation : ${url}`)
    }
  }

  static async issue(user: User) {
    const pending = await EmailVerificationToken.query()
      .where('userId', user.id)
      .whereNull('usedAt')

    for (const row of pending) {
      row.usedAt = DateTime.now()
      await row.save()
    }

    const rawToken = randomBytes(32).toString('hex')
    await EmailVerificationToken.create({
      userId: user.id,
      token: this.hash(rawToken),
      expiresAt: DateTime.now().plus({ hours: 24 }),
    })

    return router.makeUrl(
      'email_verification.confirm',
      { token: rawToken },
      { prefixUrl: env.get('APP_URL') }
    )
  }

  static async consume(rawToken: string) {
    const record = await EmailVerificationToken.query()
      .where('token', this.hash(rawToken))
      .whereNull('usedAt')
      .preload('user')
      .first()

    if (!record || record.expiresAt <= DateTime.now()) {
      return null
    }

    record.user.emailVerifiedAt = DateTime.now()
    await record.user.save()

    record.usedAt = DateTime.now()
    await record.save()

    return record.user
  }

  static hash(rawToken: string) {
    return createHash('sha256').update(rawToken).digest('hex')
  }
}
