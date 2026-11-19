import { createHash, randomBytes } from 'node:crypto'
import { DateTime } from 'luxon'
import app from '@adonisjs/core/services/app'
import hash from '@adonisjs/core/services/hash'
import logger from '@adonisjs/core/services/logger'
import router from '@adonisjs/core/services/router'
import db from '@adonisjs/lucid/services/db'
import env from '#start/env'
import mail from '@adonisjs/mail/services/main'
import EmailVerificationToken from '#models/email_verification_token'
import PendingAccount from '#models/pending_account'
import User from '#models/user'
import VerifyEmail from '#mails/verify_email'

type Recipient = { email: string; fullName: string }

export default class EmailVerifications {
  static async start(payload: { fullName: string; email: string; password: string }) {
    const password = await hash.make(payload.password)
    const rawToken = randomBytes(32).toString('hex')

    const created = await db.transaction(async (trx) => {
      const existing = await User.query({ client: trx }).where('email', payload.email).first()
      if (existing) return false

      await PendingAccount.query({ client: trx }).where('email', payload.email).delete()
      await PendingAccount.create(
        {
          fullName: payload.fullName,
          email: payload.email,
          password,
          token: this.hash(rawToken),
          expiresAt: DateTime.now().plus({ hours: 24 }),
        },
        { client: trx }
      )
      return true
    })

    if (!created) return false

    await this.notify(
      { email: payload.email, fullName: payload.fullName },
      this.confirmationUrl(rawToken)
    )
    return true
  }

  static async resend(email: string) {
    const pending = await PendingAccount.findBy('email', email)
    if (pending) {
      const rawToken = randomBytes(32).toString('hex')
      await db.transaction(async (trx) => {
        pending.useTransaction(trx)
        pending.token = this.hash(rawToken)
        pending.expiresAt = DateTime.now().plus({ hours: 24 })
        await pending.save()
      })
      await this.notify(pending, this.confirmationUrl(rawToken))
      return true
    }

    const user = await User.findBy('email', email)
    if (!user || user.emailVerifiedAt) return false
    await this.issueAndNotify(user)
    return true
  }

  static async issueAndNotify(user: User) {
    const url = await this.issue(user)
    await this.notify(user, url)
  }

  static async issue(user: User) {
    const rawToken = randomBytes(32).toString('hex')

    await db.transaction(async (trx) => {
      const pending = await EmailVerificationToken.query({ client: trx })
        .where('userId', user.id)
        .whereNull('usedAt')

      for (const row of pending) {
        row.useTransaction(trx)
        row.usedAt = DateTime.now()
        await row.save()
      }

      await EmailVerificationToken.create(
        {
          userId: user.id,
          token: this.hash(rawToken),
          expiresAt: DateTime.now().plus({ hours: 24 }),
        },
        { client: trx }
      )
    })

    return this.confirmationUrl(rawToken)
  }

  static async consume(rawToken: string) {
    const fromPending = await this.consumePending(rawToken)
    if (fromPending) return fromPending
    return this.consumeLegacy(rawToken)
  }

  static async consumePending(rawToken: string) {
    return db.transaction(async (trx) => {
      const pending = await PendingAccount.query({ client: trx })
        .where('token', this.hash(rawToken))
        .forUpdate()
        .first()

      if (!pending || pending.expiresAt <= DateTime.now()) return null

      const existing = await User.query({ client: trx }).where('email', pending.email).first()
      if (existing) {
        await pending.useTransaction(trx).delete()
        return null
      }

      const now = DateTime.now().toSQL()
      const inserted = await trx
        .table('users')
        .insert({
          full_name: pending.fullName,
          email: pending.email,
          password: pending.password,
          email_verified_at: now,
          created_at: now,
          updated_at: now,
        })
        .returning('id')

      await pending.useTransaction(trx).delete()

      const id = inserted[0]?.id ?? inserted[0]
      return User.query({ client: trx }).where('id', id).first()
    })
  }

  static async consumeLegacy(rawToken: string) {
    return db.transaction(async (trx) => {
      const record = await EmailVerificationToken.query({ client: trx })
        .where('token', this.hash(rawToken))
        .whereNull('usedAt')
        .preload('user')
        .forUpdate()
        .first()

      if (!record || record.expiresAt <= DateTime.now()) return null

      record.user.useTransaction(trx)
      record.user.emailVerifiedAt = DateTime.now()
      await record.user.save()

      record.useTransaction(trx)
      record.usedAt = DateTime.now()
      await record.save()

      return record.user
    })
  }

  static hash(rawToken: string) {
    return createHash('sha256').update(rawToken).digest('hex')
  }

  private static confirmationUrl(rawToken: string) {
    return router.makeUrl(
      'email_verification.confirm',
      { token: rawToken },
      { prefixUrl: env.get('APP_URL') }
    )
  }

  private static async notify(recipient: Recipient, url: string) {
    try {
      await mail.send(new VerifyEmail(recipient, url))
    } catch (error) {
      logger.error({ err: error }, 'envoi du mail de confirmation impossible')
      if (app.inProduction) throw error
      logger.info(`Lien de confirmation : ${url}`)
    }
  }
}
