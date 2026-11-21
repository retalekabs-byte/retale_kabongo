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
    'fullName.required': 'Indique ton nom.',
    'email.required': 'Indique ton adresse e-mail.',
    'password.required': 'Indique un mot de passe.',
    'passwordConfirmation.required': 'Confirme le mot de passe.',
    'name.required': 'Donne un nom au groupe.',
    'body.required': 'Écris un message avant d’envoyer.',
    string: 'Le champ {{ field }} est invalide.',
    email: 'Cette adresse e-mail n’est pas valide.',
    unique: 'Un compte existe déjà avec cette adresse.',
    'database.unique': 'Un compte existe déjà avec cette adresse.',
    'email.database.unique': 'Un compte existe déjà avec cette adresse.',
    minLength: 'Le champ {{ field }} est trop court.',
    'password.minLength': 'Le mot de passe doit contenir au moins {{ min }} caractères.',
    'passwordConfirmation.minLength': 'La confirmation doit contenir au moins {{ min }} caractères.',
    'name.minLength': 'Le nom du groupe est trop court.',
    'body.minLength': 'Le message est vide.',
    maxLength: 'Le champ {{ field }} est trop long.',
    'password.maxLength': 'Le mot de passe ne peut pas dépasser {{ max }} caractères.',
    'fullName.maxLength': 'Le nom ne peut pas dépasser {{ max }} caractères.',
    'email.maxLength': 'Cette adresse e-mail est trop longue.',
    'name.maxLength': 'Le nom du groupe est trop long.',
    'body.maxLength': 'Le message ne peut pas dépasser 5 000 caractères.',
    sameAs: 'Les deux mots de passe ne correspondent pas.',
    positive: 'Choix invalide.',
    number: 'Choix invalide.',
    min: 'Choisis au moins une autre personne.',
    'members.minLength': 'Choisis au moins une autre personne.',
  },
  {
    fullName: 'nom',
    email: 'e-mail',
    password: 'mot de passe',
    passwordConfirmation: 'confirmation du mot de passe',
    body: 'message',
    name: 'nom du groupe',
    userId: 'personne',
    members: 'membres',
    q: 'recherche',
  }
)

declare module '@vinejs/vine/types' {
  interface VineGlobalTransforms {
    date: DateTime
  }
}

VineDate.transform((value) => DateTime.fromJSDate(value))
