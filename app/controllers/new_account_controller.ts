import EmailVerifications from '#services/email_verifications'
import { signupValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class NewAccountController {
  async create({ view }: HttpContext) {
    return view.render('pages/auth/signup')
  }

  async store({ request, response, session }: HttpContext) {
    const { fullName, email, password } = await request.validateUsing(signupValidator)
    const started = await EmailVerifications.start({ fullName, email, password })

    if (!started) {
      session.flashExcept(['password', 'passwordConfirmation', '_csrf'])
      session.flash('inputErrorsBag', {
        email: ['Un compte existe déjà avec cette adresse.'],
      })
      return response.redirect().back()
    }

    session.put('pendingVerificationEmail', email)
    response.redirect().toRoute('email_verification')
  }
}
