import User from '#models/user'
import EmailVerifications from '#services/email_verifications'
import { signupValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class NewAccountController {
  async create({ view }: HttpContext) {
    return view.render('pages/auth/signup')
  }

  async store({ request, response, session }: HttpContext) {
    const { fullName, email, password } = await request.validateUsing(signupValidator)
    const user = await User.create({ fullName, email, password })

    session.put('pendingVerificationEmail', user.email)
    await EmailVerifications.issueAndNotify(user)

    response.redirect().toRoute('email_verification')
  }
}
