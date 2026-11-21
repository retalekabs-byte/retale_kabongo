import User from '#models/user'
import PasswordResets from '#services/password_resets'
import { forgotPasswordValidator, resetPasswordValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class PasswordResetsController {
  async create({ view }: HttpContext) {
    return view.render('pages/auth/reset')
  }

  async store({ request, response, session }: HttpContext) {
    const { email } = await request.validateUsing(forgotPasswordValidator)
    const user = await User.findBy('email', email)

    if (user) {
      await PasswordResets.issueAndNotify(user)
    }

    session.flash(
      'success',
      'Si un compte existe pour cet e-mail, un lien de réinitialisation a été envoyé.'
    )
    return response.redirect().toRoute('password.reset')
  }

  async edit({ params, view, session, response }: HttpContext) {
    const record = await PasswordResets.findValid(params.token)
    if (!record) {
      session.flash('error', 'Ce lien est invalide ou expiré.')
      return response.redirect().toRoute('password.reset')
    }

    return view.render('pages/auth/new_password', { token: params.token })
  }

  async update({ params, request, response, session }: HttpContext) {
    const { password } = await request.validateUsing(resetPasswordValidator)
    const user = await PasswordResets.consume(params.token, password)

    if (!user) {
      session.flash('error', 'Ce lien est invalide ou expiré.')
      return response.redirect().toRoute('password.reset')
    }

    session.flash('success', 'Mot de passe mis à jour. Tu peux te connecter.')
    return response.redirect().toRoute('session.create')
  }
}
