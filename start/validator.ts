/*
|--------------------------------------------------------------------------
| Validator file
|--------------------------------------------------------------------------
|
| The validator file is used for configuring global transforms for VineJS.
| The transform below converts all VineJS date outputs from JavaScript
| Date objects to Luxon DateTime instances, so that validated dates are
| ready to use with Lucid models and other parts of the app that expect
| Luxon DateTime.
|
*/

import { DateTime } from 'luxon'
import vine, { SimpleMessagesProvider, VineDate } from '@vinejs/vine'

vine.messagesProvider = new SimpleMessagesProvider(
  {
    required: 'Le champ {{ field }} est requis.',
    string: 'Le champ {{ field }} est invalide.',
    email: 'Adresse e-mail invalide.',
    unique: 'Cette adresse est déjà utilisée.',
    minLength: 'Le champ {{ field }} est trop court.',
    maxLength: 'Le champ {{ field }} est trop long.',
    sameAs: 'Les deux mots de passe ne correspondent pas.',
    positive: 'Choix invalide.',
    number: 'Choix invalide.',
    min: 'Choisis au moins une autre personne.',
    file: 'Image invalide.',
    'file.size': 'L’image dépasse 2 Mo.',
    'file.extname': 'Choisis une image jpg, png, webp ou gif.',
  },
  {
    fullName: 'nom',
    email: 'e-mail',
    password: 'mot de passe',
    passwordConfirmation: 'confirmation',
    body: 'message',
    name: 'nom du groupe',
    userId: 'personne',
    members: 'membres',
    avatar: 'image',
    q: 'recherche',
  }
)

declare module '@vinejs/vine/types' {
  interface VineGlobalTransforms {
    date: DateTime
  }
}

VineDate.transform((value) => DateTime.fromJSDate(value))
