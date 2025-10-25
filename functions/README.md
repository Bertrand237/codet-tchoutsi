# CODET Firebase Cloud Functions

## Installation

```bash
cd functions
npm install
```

## Fonctions Disponibles

### 1. `submitVote` (Callable Function)
Gère les votes de manière atomique pour éviter les votes multiples.

**Utilisation dans le client:**
```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const submitVote = httpsCallable(functions, 'submitVote');

const result = await submitVote({ pollId: 'xxx', optionId: 'yyy' });
```

### 2. `onUserCreated` (Auth Trigger)
Crée automatiquement un profil utilisateur dans Firestore lors de l'inscription.
Le premier utilisateur devient automatiquement admin.

### 3. `onEventCreated` (Firestore Trigger)
Se déclenche à la création d'un événement (prêt pour notifications).

### 4. `onPaymentValidated` (Firestore Trigger)
Se déclenche quand un paiement est validé (prêt pour notifications).

### 5. `cleanupExpiredPolls` (Scheduled Function)
S'exécute automatiquement toutes les 24h pour désactiver les sondages expirés.

### 6. `getStatistics` (Callable Function)
Retourne les statistiques globales de l'application.

## Déploiement

```bash
# Depuis la racine du projet
npm run deploy:functions

# Ou depuis le dossier functions
cd functions
npm run deploy
```

## Tests en local

```bash
cd functions
npm run serve
```

## Logs

```bash
cd functions
npm run logs
```
