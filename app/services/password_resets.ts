import { createHash, randomBytes } from 'node:crypto'
import { DateTime } from 'luxon'
import app from '@adonisjs/core/services/app'
import logger from '@adonisjs/core/services/logger'
import router from '@adonisjs/core/services/router'
import env from '#start/env'
import mail from '@adonisjs/mail/services/main'
import PasswordResetToken from '#models/password_reset_token'
import type User from '#models/user'
import ResetPassword from '#mails/reset_password'

export default class PasswordResets {
  static async issueAndNotify(user: User) {
    const url = await this.issue(user)

    try {
      await mail.send(new ResetPassword(user, url))
    } catch (error) {
      logger.error({ err: error }, 'envoi du mail de réinitialisation impossible')
      if (app.inProduction) throw error
      logger.info(`Lien de réinitialisation : ${url}`)
    }
  }

  static async issue(user: User) {
    await this.invalidatePending(user.id)

    const rawToken = randomBytes(32).toString('hex')
    await PasswordResetToken.create({
      userId: user.id,
      token: this.hash(rawToken),
      expiresAt: DateTime.now().plus({ hours: 1 }),
    })

    return router.makeUrl('password.reset.edit', { token: rawToken }, { prefixUrl: env.get('APP_URL') })
  }

  static async findValid(rawToken: string) {
    const record = await PasswordResetToken.query()
      .where('token', this.hash(rawToken))
      .whereNull('usedAt')
      .preload('user')
      .first()

    if (!record || record.expiresAt <= DateTime.now()) {
      return null
    }

    return record
  }

  static async consume(rawToken: string, password: string) {
    const record = await this.findValid(rawToken)
    if (!record) return null

    record.user.password = password
    await record.user.save()
    await this.invalidatePending(record.userId)

    return record.user
  }

  static async invalidatePending(userId: number) {
    const pending = await PasswordResetToken.query().where('userId', userId).whereNull('usedAt')

    for (const row of pending) {
      row.usedAt = DateTime.now()
      await row.save()
    }
  }

  static hash(rawToken: string) {
    return createHash('sha256').update(rawToken).digest('hex')
  }
}
