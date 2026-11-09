import User from '#models/user'
import UserBlock from '#models/user_block'
import type { HttpContext } from '@adonisjs/core/http'

export default class BlocksController {
  async store({ request, auth, response, session }: HttpContext) {
    const user = auth.user!
    const userId = Number(request.input('userId'))
    if (!Number.isInteger(userId) || userId === user.id) {
      session.flash('error', 'Tu ne peux pas te bloquer.')
      return response.redirect().back()
    }

    const other = await User.find(userId)
    if (!other) {
      session.flash('error', 'Cette personne est introuvable.')
      return response.redirect().back()
    }

    const existing = await UserBlock.query().where('blockerId', user.id).where('blockedId', other.id).first()
    if (!existing) {
      await UserBlock.create({ blockerId: user.id, blockedId: other.id })
    }

    session.flash('success', `${other.fullName} est bloqué. Les messages privés sont coupés.`)
    return response.redirect().back()
  }

  async destroy({ params, auth, response, session }: HttpContext) {
    const user = auth.user!
    const blockedId = Number(params.userId)
    await UserBlock.query().where('blockerId', user.id).where('blockedId', blockedId).delete()
    session.flash('success', 'Blocage retiré.')
    return response.redirect().back()
  }
}
