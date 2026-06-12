# DevHub Backend API

Backend Node.js/Express pour la plateforme DevHub.

---

## Stack
- **Runtime** : Node.js
- **Framework** : Express
- **Base de données** : MongoDB Atlas
- **Auth** : JWT
- **Email** : Nodemailer

---

## Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Copier le fichier .env
cp .env.example .env

# 3. Remplir le .env avec tes vraies valeurs

# 4. Lancer en développement
npm run dev

# 5. Lancer en production
npm start
```

---

## Variables d'environnement (.env)

| Variable | Description |
|---|---|
| `PORT` | Port du serveur (défaut 5000) |
| `MONGO_URI` | URI MongoDB Atlas |
| `JWT_SECRET` | Clé secrète JWT (longue et aléatoire) |
| `JWT_EXPIRE` | Durée du token (ex: 30d) |
| `ADMIN_PASSWORD` | Mot de passe admin secret |
| `NODEMAILER_HOST` | Hôte SMTP (ex: smtp.gmail.com) |
| `NODEMAILER_PORT` | Port SMTP (587) |
| `NODEMAILER_USER` | Email expéditeur |
| `NODEMAILER_PASS` | Mot de passe app Gmail |
| `CLIENT_URL` | URL du frontend (ex: https://devhub.vercel.app) |
| `COINS_ON_REGISTER` | Coins offerts à l'inscription (défaut 100) |

---

## Déploiement sur Render

1. Créer un nouveau **Web Service** sur Render
2. Connecter ton repo GitHub
3. Build command : `npm install`
4. Start command : `npm start`
5. Ajouter toutes les variables d'environnement

---

## Routes API

### Auth — `/api/auth`
| Méthode | Route | Description |
|---|---|---|
| POST | `/register` | Inscription |
| POST | `/login` | Connexion |
| GET | `/verify-email?token=xxx` | Vérification email |
| GET | `/me` | Profil connecté |

### Users — `/api/users`
| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/dashboard` | ✅ | Dashboard complet |
| PUT | `/profile` | ✅ | Modifier profil |
| GET | `/transactions` | ✅ | Historique coins |
| POST | `/transfer` | ✅ | Transférer coins |
| POST | `/promo` | ✅ | Utiliser code promo |
| GET | `/public/:pseudo` | ❌ | Profil public |

### Projects — `/api/projects`
| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/` | ❌ | Liste des projets |
| GET | `/:id` | ❌ | Détail projet |
| POST | `/:id/purchase` | ✅ | Acheter en coins |
| POST | `/:id/request` | ✅ | Demander accès |
| POST | `/:id/favorite` | ✅ | Toggle favori |
| GET | `/user/licenses` | ✅ | Mes licences |

### Community — `/api/community`
| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/reviews` | ❌ | Tous les avis |
| POST | `/reviews` | ✅ | Publier un avis |
| POST | `/reviews/:id/like` | ✅ | Liker un avis |
| GET | `/bugs` | ❌ | Signalements |
| POST | `/bugs` | ✅ | Signaler un bug |

### Notifications — `/api/notifications`
| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/` | ✅ | Mes notifications |
| PUT | `/read-all` | ✅ | Tout marquer lu |
| PUT | `/:id/read` | ✅ | Marquer lu |

### Leaderboard — `/api/leaderboard`
| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/?by=points` | ❌ | Classement |

### Events — `/api/events`
| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/` | ❌ | Événements actifs |
| POST | `/:id/join` | ✅ | Participer |

### Changelog — `/api/changelog`
| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/?project=id` | ❌ | Historique versions |

---

### Admin — `/api/admin`
> Toutes les routes admin nécessitent le header : `x-admin-password: TON_MOT_DE_PASSE`

| Méthode | Route | Description |
|---|---|---|
| POST | `/login` | Vérifier accès admin |
| GET | `/stats` | Stats globales + users en ligne |
| GET | `/projects` | Tous les projets |
| POST | `/projects` | Ajouter projet |
| PUT | `/projects/:id` | Modifier projet |
| DELETE | `/projects/:id` | Supprimer projet |
| PATCH | `/projects/:id/toggle` | Activer/Désactiver |
| GET | `/projects/:id/stats` | Stats projet |
| GET | `/users` | Tous les users |
| GET | `/users/export` | Export CSV |
| POST | `/users/:id/gift-coins` | Donner coins |
| POST | `/users/:id/give-access` | Donner accès gratuit |
| POST | `/users/:id/give-badge` | Attribuer badge |
| POST | `/users/:id/message` | Message privé |
| POST | `/users/:id/suspend` | Suspendre |
| POST | `/users/:id/unsuspend` | Débloquer |
| POST | `/events` | Créer événement |
| PATCH | `/events/:id/stop` | Arrêter événement |
| GET | `/promos` | Liste codes promo |
| POST | `/promos` | Créer code promo |
| PATCH | `/promos/:id/toggle` | Activer/Désactiver promo |
| POST | `/changelog` | Publier changelog |
| GET | `/banner` | Bannière active |
| POST | `/banner` | Publier bannière |
| POST | `/push` | Notif push globale |
| GET | `/bugs` | Signalements bugs |
| PATCH | `/bugs/:id` | Mettre à jour statut bug |

---

## Structure des dossiers

```
devhub-backend/
├── src/
│   ├── app.js              # Point d'entrée
│   ├── config/
│   │   └── db.js           # Connexion MongoDB
│   ├── models/
│   │   ├── User.js
│   │   ├── Project.js
│   │   ├── License.js
│   │   ├── Transaction.js
│   │   ├── Notification.js
│   │   ├── Review.js
│   │   ├── BugReport.js
│   │   ├── Event.js
│   │   ├── PromoCode.js
│   │   ├── Changelog.js
│   │   └── Banner.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── projects.js
│   │   ├── community.js
│   │   ├── notifications.js
│   │   ├── leaderboard.js
│   │   ├── events.js
│   │   ├── changelog.js
│   │   └── admin.js
│   ├── middleware/
│   │   ├── auth.js         # Vérification JWT
│   │   └── admin.js        # Vérification mot de passe admin
│   └── utils/
│       ├── generateKey.js  # Génération licences & codes référral
│       ├── sendEmail.js    # Emails Nodemailer
│       └── points.js       # Système points & badges
├── .env.example
├── package.json
└── README.md
```
