# Kadea Chat — Retale

Kadea Chat est une application web de messagerie en temps réel. Elle permet de créer un compte, d’échanger en privé ou en groupe, de gérer son profil et de bloquer une personne si besoin.

---

## Fonctionnalités

- Inscription avec confirmation par e-mail
- Connexion / déconnexion (session)
- Mot de passe oublié et réinitialisation
- Profil : nom et changement de mot de passe
- Conversations privées (création depuis le chat)
- Messages texte : envoi, historique, suppression
- Messagerie en temps réel
- Groupes : création, liste des membres, ajout / retrait (admin)
- Blocage / déblocage en conversation privée
- Interface responsive + thème clair / sombre

---

## Stack

- **Backend** : AdonisJS 7
- **Base de données** : PostgreSQL + Lucid ORM
- **Vues** : Edge
- **Validation** : VineJS
- **Auth** : session (`@adonisjs/auth`)
- **Sécurité** : Shield (CSRF)
- **E-mails** : Brevo (`@adonisjs/mail`)
- **Temps réel** : Transmit (SSE)
- **Front** : HTML / CSS / JavaScript

---

## Tables de la base de données

| Table | Rôle |
|-------|------|
| `users` | Comptes confirmés |
| `pending_accounts` | Inscriptions en attente de confirmation e-mail |
| `email_verification_tokens` | Jetons de confirmation (parcours legacy) |
| `password_reset_tokens` | Jetons de réinitialisation du mot de passe |
| `conversations` | Conversations privées ou groupes |
| `conversation_members` | Membres + rôle (`member` / `admin`) |
| `messages` | Messages texte (soft-delete via `deleted_at`) |
| `user_blocks` | Blocages entre utilisateurs |

---

## Variables d’environnement

Copier `.env.example` vers `.env`, puis renseigner :

```env
# Node
TZ=UTC
PORT=3333
HOST=localhost
NODE_ENV=development

# App
LOG_LEVEL=info
APP_KEY=          # générer avec : node ace generate:key
APP_URL=http://${HOST}:${PORT}

# Session
SESSION_DRIVER=cookie

# Brevo
MAIL_MAILER=brevo
BREVO_API_KEY=
MAIL_FROM_NAME=Kadea Chat
MAIL_FROM_ADDRESS=

# PostgreSQL
DB_CONNECTION=pg
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=
DB_DATABASE=projet-kadea
```

En production (ex. Render) : `NODE_ENV=production`, `HOST=0.0.0.0`, et `APP_URL` = l’URL publique de l’app.

---

## Installation (local)

```bash
npm install
cp .env.example .env
node ace generate:key
# renseigner .env (Postgres + Brevo)
node ace migration:run
npm run dev
```

L’app démarre sur l’URL indiquée dans `.env` (`APP_URL`).

---

## Structure des dossiers

```text
app/
  controllers/   # routes HTTP
  models/        # modèles Lucid
  services/      # logique métier
  validators/    # règles Vine
  mails/         # e-mails
config/          # configuration Adonis
database/
  migrations/    # schéma SQL
public/          # CSS / JS / assets
resources/
  views/         # templates Edge
start/           # routes, env, kernel
```

---

## Auteur

**Retale Ngalula**
