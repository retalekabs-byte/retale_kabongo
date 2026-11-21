import User from '#models/user'
import { loginValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class SessionController {
  async create({ view }: HttpContext) {
    return view.render('pages/auth/login')
  }

  async store({ request, auth, response, session }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)
    const user = await User.verifyCredentials(email, password)

    if (!user.emailVerifiedAt) {
      session.put('pendingVerificationEmail', user.email)
      session.flash('error', 'Confirme ton e-mail avant de te connecter.')
      return response.redirect().toRoute('email_verification')
    }

    await auth.use('web').login(user)
    response.redirect().toRoute('chat')
  }

  async destroy({ auth, response, session }: HttpContext) {
    await auth.use('web').logout()
    session.forget('pendingVerificationEmail')
    session.flash('success', 'Tu es déconnecté.')
    response.redirect().toRoute('session.create')
  }
}
