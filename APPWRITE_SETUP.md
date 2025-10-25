# Configuration Appwrite pour CODET

## 📋 Étapes de Configuration

### 1. Créer un compte Appwrite Cloud (GRATUIT)

1. Allez sur : https://cloud.appwrite.io
2. Cliquez sur "Get Started" ou "Sign Up"
3. Créez un compte avec votre email (aucune carte bancaire)
4. Vérifiez votre email

### 2. Créer le projet CODET

1. Cliquez sur "Create Project"
2. Nom : `CODET`
3. Project ID : `codet` (ou laissez auto-générer)
4. Cliquez sur "Create"

### 3. Configurer la base de données

1. Dans le menu de gauche, cliquez sur **"Databases"**
2. Cliquez sur **"Create Database"**
3. Nom : `CODET Database`
4. Database ID : `codet-db`
5. Cliquez sur "Create"

### 4. Créer les collections

Pour chaque collection ci-dessous, cliquez sur "Create Collection" :

#### Collection 1: **users**
- **Collection ID** : `users`
- **Permissions** : 
  - Read: `role:all` (tous les utilisateurs authentifiés)
  - Create/Update/Delete: Utilisateur propriétaire uniquement

**Attributs** :
| Nom | Type | Taille | Requis | Défaut |
|-----|------|--------|--------|--------|
| `email` | String | 255 | Oui | - |
| `displayName` | String | 255 | Oui | - |
| `role` | String | 50 | Oui | `membre` |
| `phoneNumber` | String | 20 | Non | - |
| `photoURL` | String | 500 | Non | - |

#### Collection 2: **projects**
- **Collection ID** : `projects`

**Attributs** :
| Nom | Type | Taille | Requis | Défaut |
|-----|------|--------|--------|--------|
| `title` | String | 255 | Oui | - |
| `description` | String | 5000 | Oui | - |
| `status` | String | 50 | Oui | `planifié` |
| `budget` | Float | - | Oui | 0 |
| `progress` | Integer | - | Oui | 0 |
| `responsible` | String | 255 | Non | - |
| `startDate` | DateTime | - | Non | - |
| `endDate` | DateTime | - | Non | - |
| `createdBy` | String | 255 | Oui | - |

#### Collection 3: **payments**
- **Collection ID** : `payments`

**Attributs** :
| Nom | Type | Taille | Requis | Défaut |
|-----|------|--------|--------|--------|
| `userId` | String | 255 | Oui | - |
| `amount` | Float | - | Oui | 0 |
| `paymentType` | String | 100 | Oui | - |
| `description` | String | 1000 | Non | - |
| `proofUrl` | String | 500 | Non | - |
| `status` | String | 50 | Oui | `en_attente` |
| `validatedBy` | String | 255 | Non | - |
| `validatedAt` | DateTime | - | Non | - |

#### Collection 4: **budget**
- **Collection ID** : `budget`

**Attributs** :
| Nom | Type | Taille | Requis | Défaut |
|-----|------|--------|--------|--------|
| `type` | String | 50 | Oui | - |
| `category` | String | 100 | Oui | - |
| `amount` | Float | - | Oui | 0 |
| `description` | String | 1000 | Oui | - |
| `date` | DateTime | - | Oui | - |
| `createdBy` | String | 255 | Oui | - |

#### Collection 5: **events**
- **Collection ID** : `events`

**Attributs** :
| Nom | Type | Taille | Requis | Défaut |
|-----|------|--------|--------|--------|
| `title` | String | 255 | Oui | - |
| `description` | String | 2000 | Non | - |
| `startDate` | DateTime | - | Oui | - |
| `endDate` | DateTime | - | Oui | - |
| `location` | String | 255 | Non | - |
| `createdBy` | String | 255 | Oui | - |

#### Collection 6: **polls**
- **Collection ID** : `polls`

**Attributs** :
| Nom | Type | Taille | Requis | Défaut |
|-----|------|--------|--------|--------|
| `question` | String | 500 | Oui | - |
| `options` | String | 5000 | Oui | - |
| `createdBy` | String | 255 | Oui | - |
| `expiresAt` | DateTime | - | Oui | - |
| `isActive` | Boolean | - | Oui | true |

#### Collection 7: **votes**
- **Collection ID** : `votes`

**Attributs** :
| Nom | Type | Taille | Requis | Défaut |
|-----|------|--------|--------|--------|
| `pollId` | String | 255 | Oui | - |
| `userId` | String | 255 | Oui | - |
| `option` | String | 500 | Oui | - |

#### Collection 8: **families**
- **Collection ID** : `families`

**Attributs** :
| Nom | Type | Taille | Requis | Défaut |
|-----|------|--------|--------|--------|
| `familyName` | String | 255 | Oui | - |
| `headOfFamily` | String | 255 | Oui | - |
| `address` | String | 500 | Non | - |
| `phone` | String | 20 | Non | - |
| `members` | String | 10000 | Non | - |
| `createdBy` | String | 255 | Oui | - |

#### Collection 9: **messages**
- **Collection ID** : `messages`

**Attributs** :
| Nom | Type | Taille | Requis | Défaut |
|-----|------|--------|--------|--------|
| `userId` | String | 255 | Oui | - |
| `userName` | String | 255 | Oui | - |
| `text` | String | 5000 | Oui | - |
| `timestamp` | DateTime | - | Oui | - |

#### Collection 10: **blog-posts**
- **Collection ID** : `blog-posts`

**Attributs** :
| Nom | Type | Taille | Requis | Défaut |
|-----|------|--------|--------|--------|
| `title` | String | 255 | Oui | - |
| `content` | String | 50000 | Oui | - |
| `imageUrl` | String | 500 | Non | - |
| `status` | String | 50 | Oui | `draft` |
| `author` | String | 255 | Oui | - |

#### Collection 11: **ads**
- **Collection ID** : `ads`

**Attributs** :
| Nom | Type | Taille | Requis | Défaut |
|-----|------|--------|--------|--------|
| `title` | String | 255 | Oui | - |
| `description` | String | 1000 | Non | - |
| `videoUrl` | String | 500 | Oui | - |
| `isActive` | Boolean | - | Oui | true |
| `createdBy` | String | 255 | Oui | - |

### 5. Configurer le Storage (Buckets)

1. Dans le menu de gauche, cliquez sur **"Storage"**
2. Créez les buckets suivants :

| Bucket Name | Bucket ID | Max File Size | Allowed Extensions |
|-------------|-----------|---------------|-------------------|
| Payment Proofs | `payment-proofs` | 10 MB | jpg, jpeg, png, pdf |
| Blog Images | `blog-images` | 5 MB | jpg, jpeg, png, webp |
| Ads Videos | `ads-videos` | 50 MB | mp4, webm, mov |
| Profile Pictures | `profile-pictures` | 2 MB | jpg, jpeg, png |

**Permissions pour chaque bucket** :
- Read: `role:all`
- Create/Update/Delete: Selon les rôles appropriés

### 6. Configurer l'authentification

1. Dans le menu de gauche, cliquez sur **"Auth"**
2. Activez **"Email/Password"**
3. (Optionnel) Activez d'autres méthodes OAuth si souhaité

### 7. Récupérer vos clés API

1. Allez dans **Settings** > **View API Keys**
2. Notez :
   - **Project ID** (ex: `65abc123def456`)
   - **API Endpoint** (ex: `https://cloud.appwrite.io/v1`)
   - **Database ID** : `codet-db`

### 8. Configurer les secrets Replit

Dans Replit, ajoutez ces secrets dans **Tools** > **Secrets** :

```
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=votre-project-id-ici
VITE_APPWRITE_DATABASE_ID=codet-db
```

---

## ✅ Configuration terminée !

Une fois ces étapes complétées, revenez dans Replit et l'application sera prête à fonctionner avec Appwrite !
