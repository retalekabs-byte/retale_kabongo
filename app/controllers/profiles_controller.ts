import { unlink } from 'node:fs/promises'
import { randomBytes } from 'node:crypto'
import app from '@adonisjs/core/services/app'
import Conversations from '#services/conversations'
import { profileValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class ProfilesController {
  async show({ view, auth }: HttpContext) {
    const user = auth.user!
    return view.render('pages/chat/profile', {
      user,
      conversations: await Conversations.listFor(user),
    })
  }

  async update({ request, response, session, auth }: HttpContext) {
    const user = auth.user!
    const { fullName, password, passwordConfirmation, avatar } =
      await request.validateUsing(profileValidator)

    if ((password || passwordConfirmation) && password !== passwordConfirmation) {
      session.flash('error', 'Les deux mots de passe ne correspondent pas.')
      return response.redirect().back()
    }

    user.fullName = fullName
    if (password) user.password = password

    if (avatar) {
      const name = `${randomBytes(16).toString('hex')}.${avatar.extname}`
      await avatar.move(app.publicPath('uploads/avatars'), { name })
      await this.removeStoredAvatar(user.avatar)
      user.avatar = `/uploads/avatars/${name}`
    }

    await user.save()
    session.flash('success', 'Profil enregistré.')
    return response.redirect().toRoute('profile')
  }

  private async removeStoredAvatar(avatar: string | null) {
    if (!avatar?.startsWith('/uploads/avatars/')) return
    await unlink(app.publicPath(avatar.replace(/^\//, ''))).catch(() => {})
  }
}
