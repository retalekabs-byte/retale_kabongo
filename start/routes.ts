/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import { controllers } from '#generated/controllers'
import router from '@adonisjs/core/services/router'

router.on('/').render('pages/home').as('home')
router
  .get('/email-verification', [controllers.EmailVerifications, 'show'])
  .as('email_verification')
router
  .post('/email-verification/resend', [controllers.EmailVerifications, 'resend'])
  .as('email_verification.resend')
router
  .get('/email-verification/:token', [controllers.EmailVerifications, 'confirm'])
  .as('email_verification.confirm')
router.get('/reset', [controllers.PasswordResets, 'create']).as('password.reset')
router.post('/reset', [controllers.PasswordResets, 'store']).as('password.reset.store')
router.get('/reset/:token', [controllers.PasswordResets, 'edit']).as('password.reset.edit')
router.post('/reset/:token', [controllers.PasswordResets, 'update']).as('password.reset.update')

router
  .group(() => {
    router.get('signup', [controllers.NewAccount, 'create'])
    router.post('signup', [controllers.NewAccount, 'store'])

    router.get('login', [controllers.Session, 'create'])
    router.post('login', [controllers.Session, 'store'])
  })
  .use(middleware.guest())

router
  .group(() => {
    router.get('/chat', [controllers.Conversations, 'index']).as('chat')
    router.get('/chat/new', [controllers.Conversations, 'create']).as('conversations.create')
    router.post('/conversations', [controllers.Conversations, 'store']).as('conversations.store')
    router.get('/chat/:id', [controllers.Conversations, 'show']).as('chat.show')
    router.post('/chat/:id/messages', [controllers.Messages, 'store']).as('messages.store')
    router
      .post('/chat/:id/messages/:messageId/delete', [controllers.Messages, 'destroy'])
      .as('messages.destroy')
    router.get('/profile', [controllers.Profiles, 'show']).as('profile')
    router.post('/profile', [controllers.Profiles, 'update']).as('profile.update')
    router.on('/dashboard').render('pages/dashboard').as('dashboard')
    router.post('logout', [controllers.Session, 'destroy'])
  })
  .use(middleware.auth())
