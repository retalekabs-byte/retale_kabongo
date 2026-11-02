import User from '#models/user'
import EmailVerifications from '#services/email_verifications'
import type { HttpContext } from '@adonisjs/core/http'

const pendingKey = 'pendingVerificationEmail'

export default class EmailVerificationsController {
  async show({ view }: HttpContext) {
    return view.render('pages/auth/email_verification')
  }

  async resend({ session, response }: HttpContext) {
    const email = session.get(pendingKey)
    const user = email ? await User.findBy('email', email) : null

    if (!user || user.emailVerifiedAt) {
      session.flash('error', 'Impossible de renvoyer le lien. Inscris-toi à nouveau.')
      return response.redirect().toRoute('email_verification')
    }

    await EmailVerifications.issueAndNotify(user)
    session.flash('success', 'Un nouveau lien a été envoyé.')
    return response.redirect().toRoute('email_verification')
  }

  async confirm({ params, session, response }: HttpContext) {
    const user = await EmailVerifications.consume(params.token)

    if (!user) {
      session.flash('error', 'Ce lien est invalide ou expiré.')
      return response.redirect().toRoute('email_verification')
    }

    session.forget(pendingKey)
    session.flash('success', 'Adresse confirmée. Tu peux te connecter.')
    return response.redirect().toRoute('session.create')
  }
}
