/**
 * Appwrite Bootstrap Script
 * Crée la base de données, toutes les collections et les buckets storage.
 * 
 * Utilisation: npm run appwrite:bootstrap
 * 
 * Variables requises dans .env :
 *   NEXT_PUBLIC_APPWRITE_ENDPOINT
 *   NEXT_PUBLIC_APPWRITE_PROJECT_ID  
 *   APPWRITE_API_KEY (clé API avec accès complet)
 */

import { Client, Databases, Storage, ID, Query } from 'appwrite';

// Charger les variables .env
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

function loadEnv() {
  const envPath = join(rootDir, '.env');
  try {
    const content = readFileSync(envPath, 'utf-8');
    const env = {};
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      env[key] = value.replace(/^['"]|['"]$/g, '');
    }
    return env;
  } catch {
    console.error('❌ Fichier .env non trouvé. Copiez .env.example en .env et remplissez vos valeurs.');
    process.exit(1);
  }
}

const env = loadEnv();

const ENDPOINT = env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = env.APPWRITE_API_KEY;
const DATABASE_ID = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'codet-db';

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
  console.error('❌ Variables manquantes dans .env :');
  if (!ENDPOINT) console.error('   - NEXT_PUBLIC_APPWRITE_ENDPOINT');
  if (!PROJECT_ID) console.error('   - NEXT_PUBLIC_APPWRITE_PROJECT_ID');
  if (!API_KEY) console.error('   - APPWRITE_API_KEY (clé API avec accès complet)');
  console.error('\nCréez une clé API dans Appwrite > Overview > API Keys > Create API Key');
  console.error('Cochez toutes les permissions (databases.write, storage.write, etc.)');
  process.exit(1);
}

const client = new Client();
client.setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

// ==================== Collections ====================

const COLLECTIONS = [
  {
    name: 'users',
    attributes: [
      { key: 'accountId', type: 'string', size: 255, required: false },
      { key: 'email', type: 'string', size: 255, required: false },
      { key: 'displayName', type: 'string', size: 255, required: true },
      { key: 'gender', type: 'string', size: 20, required: false },
      { key: 'phoneNumber', type: 'string', size: 50, required: false },
      { key: 'sousComite', type: 'string', size: 255, required: false },
      { key: 'pays', type: 'string', size: 100, required: false },
      { key: 'ville', type: 'string', size: 100, required: false },
      { key: 'role', type: 'string', size: 50, required: true },
      { key: 'profession', type: 'string', size: 255, required: false },
      { key: 'photoURL', type: 'string', size: 2000, required: false },
      { key: 'directoryId', type: 'string', size: 255, required: false },
      { key: 'mustChangePassword', type: 'boolean', required: false },
    ],
  },
  {
    name: 'projects',
    attributes: [
      { key: 'titre', type: 'string', size: 500, required: true },
      { key: 'description', type: 'string', size: 10000, required: false },
      { key: 'statut', type: 'string', size: 50, required: true },
      { key: 'priorite', type: 'string', size: 50, required: false },
      { key: 'budget', type: 'double', required: false },
      { key: 'budgetUtilise', type: 'double', required: false },
      { key: 'responsableId', type: 'string', size: 255, required: false },
      { key: 'progression', type: 'double', required: false },
      { key: 'dateDebut', type: 'string', size: 50, required: false },
      { key: 'dateFin', type: 'string', size: 50, required: false },
    ],
  },
  {
    name: 'payments',
    attributes: [
      { key: 'membreId', type: 'string', size: 255, required: true },
      { key: 'membreNom', type: 'string', size: 255, required: false },
      { key: 'montant', type: 'double', required: true },
      { key: 'mode', type: 'string', size: 50, required: true },
      { key: 'description', type: 'string', size: 1000, required: false },
      { key: 'preuveURL', type: 'string', size: 2000, required: false },
      { key: 'statut', type: 'string', size: 50, required: false },
    ],
  },
  {
    name: 'budget',
    attributes: [
      { key: 'type', type: 'string', size: 50, required: true },
      { key: 'montant', type: 'double', required: true },
      { key: 'categorie', type: 'string', size: 100, required: false },
      { key: 'description', type: 'string', size: 1000, required: false },
      { key: 'projetId', type: 'string', size: 255, required: false },
      { key: 'date', type: 'string', size: 50, required: false },
    ],
  },
  {
    name: 'events',
    attributes: [
      { key: 'titre', type: 'string', size: 500, required: true },
      { key: 'description', type: 'string', size: 10000, required: false },
      { key: 'type', type: 'string', size: 50, required: false },
      { key: 'dateDebut', type: 'string', size: 50, required: true },
      { key: 'dateFin', type: 'string', size: 50, required: false },
      { key: 'lieu', type: 'string', size: 500, required: false },
      { key: 'organisateurId', type: 'string', size: 255, required: false },
      { key: 'couleur', type: 'string', size: 20, required: false },
    ],
  },
  {
    name: 'polls',
    attributes: [
      { key: 'question', type: 'string', size: 1000, required: true },
      { key: 'description', type: 'string', size: 5000, required: false },
      { key: 'options', type: 'string', size: 10000, required: true },
      { key: 'dateDebut', type: 'string', size: 50, required: true },
      { key: 'dateFin', type: 'string', size: 50, required: true },
      { key: 'actif', type: 'boolean', required: false },
      { key: 'votants', type: 'string', size: 50000, required: false },
      { key: 'auteurId', type: 'string', size: 255, required: false },
    ],
  },
  {
    name: 'votes',
    attributes: [
      { key: 'pollId', type: 'string', size: 255, required: true },
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'optionIndex', type: 'integer', required: true },
    ],
  },
  {
    name: 'families',
    attributes: [
      { key: 'membreId', type: 'string', size: 255, required: true },
      { key: 'nomFamille', type: 'string', size: 255, required: true },
      { key: 'chefFamille', type: 'string', size: 255, required: true },
      { key: 'telephone', type: 'string', size: 50, required: false },
      { key: 'adresse', type: 'string', size: 500, required: false },
      { key: 'membres', type: 'string', size: 50000, required: false },
    ],
  },
  {
    name: 'messages',
    attributes: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'userName', type: 'string', size: 255, required: false },
      { key: 'text', type: 'string', size: 10000, required: false },
      { key: 'messageType', type: 'string', size: 20, required: false },
      { key: 'imageUrl', type: 'string', size: 2000, required: false },
    ],
  },
  {
    name: 'blog-posts',
    attributes: [
      { key: 'title', type: 'string', size: 500, required: true },
      { key: 'content', type: 'string', size: 100000, required: true },
      { key: 'excerpt', type: 'string', size: 2000, required: false },
      { key: 'imageUrl', type: 'string', size: 2000, required: false },
      { key: 'authorId', type: 'string', size: 255, required: true },
      { key: 'isPublished', type: 'boolean', required: false },
      { key: 'tags', type: 'string', size: 2000, required: false },
    ],
  },
  {
    name: 'blog-videos',
    attributes: [
      { key: 'title', type: 'string', size: 500, required: true },
      { key: 'description', type: 'string', size: 5000, required: false },
      { key: 'videoUrl', type: 'string', size: 2000, required: true },
      { key: 'authorId', type: 'string', size: 255, required: true },
      { key: 'isPublished', type: 'boolean', required: false },
    ],
  },
  {
    name: 'ads',
    attributes: [
      { key: 'title', type: 'string', size: 500, required: true },
      { key: 'videoUrl', type: 'string', size: 2000, required: false },
      { key: 'imageUrl', type: 'string', size: 2000, required: false },
      { key: 'lien', type: 'string', size: 2000, required: false },
      { key: 'isActive', type: 'boolean', required: false },
      { key: 'order', type: 'integer', required: false },
    ],
  },
  {
    name: 'gallery',
    attributes: [
      { key: 'title', type: 'string', size: 500, required: false },
      { key: 'imageUrl', type: 'string', size: 2000, required: true },
      { key: 'type', type: 'string', size: 20, required: false },
      { key: 'uploadedBy', type: 'string', size: 255, required: false },
      { key: 'likes', type: 'string', size: 50000, required: false },
      { key: 'album', type: 'string', size: 255, required: false },
    ],
  },
  {
    name: 'notifications',
    attributes: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'titre', type: 'string', size: 500, required: true },
      { key: 'message', type: 'string', size: 5000, required: false },
      { key: 'type', type: 'string', size: 50, required: false },
      { key: 'lu', type: 'boolean', required: false },
      { key: 'lien', type: 'string', size: 500, required: false },
    ],
  },
  {
    name: 'transactions',
    attributes: [
      { key: 'type', type: 'string', size: 50, required: true },
      { key: 'montant', type: 'double', required: true },
      { key: 'categorie', type: 'string', size: 100, required: false },
      { key: 'description', type: 'string', size: 1000, required: false },
      { key: 'projetId', type: 'string', size: 255, required: false },
      { key: 'date', type: 'string', size: 50, required: false },
    ],
  },
];

const BUCKETS = [
  { name: 'payment-proofs', enabled: true },
  { name: 'gallery-media', enabled: true },
];

// ==================== Functions ====================

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createDatabase() {
  try {
    const db = await databases.get(DATABASE_ID);
    console.log(`✅ Base de données "${db.name}" existe déjà`);
    return db;
  } catch (e) {
    if (e?.message?.includes('not found') || e?.code === 404) {
      console.log(`📦 Création de la base de données "${DATABASE_ID}"...`);
      const db = await databases.create(DATABASE_ID, DATABASE_ID, true);
      console.log(`✅ Base de données créée`);
      return db;
    }
    throw e;
  }
}

async function createCollection(dbId, collection) {
  try {
    await databases.getCollection(dbId, collection.name);
    console.log(`  ✅ Collection "${collection.name}" existe déjà`);
    return;
  } catch (e) {
    if (!e?.message?.includes('not found') && e?.code !== 404) throw e;
  }

  console.log(`  📁 Création collection "${collection.name}"...`);
  await databases.createCollection(dbId, collection.name, collection.name);

  // Attendre que la collection soit prête
  await sleep(500);

  // Créer les attributs
  for (const attr of collection.attributes) {
    try {
      const params = { key: attr.key, required: attr.required, default: undefined };
      if (attr.type === 'string') {
        params.size = attr.size;
      }
      if (attr.type === 'double') {
        await databases.createDoubleAttribute(dbId, collection.name, attr.key, attr.required);
      } else if (attr.type === 'integer') {
        await databases.createIntegerAttribute(dbId, collection.name, attr.key, attr.required, undefined, undefined);
      } else if (attr.type === 'boolean') {
        await databases.createBooleanAttribute(dbId, collection.name, attr.key, attr.required, false);
      } else {
        await databases.createStringAttribute(dbId, collection.name, attr.key, attr.size, attr.required);
      }
    } catch (attrErr) {
      if (!attrErr?.message?.includes('already exists')) {
        console.log(`    ⚠️  Attribut ${attr.key}: ${attrErr.message}`);
      }
    }
    await sleep(200);
  }

  console.log(`  ✅ Collection "${collection.name}" créée avec ${collection.attributes.length} attributs`);
}

async function createBucket(bucket) {
  try {
    const b = await storage.getBucket(bucket.name);
    console.log(`✅ Bucket "${bucket.name}" existe déjà`);
    return;
  } catch (e) {
    if (!e?.message?.includes('not found') && e?.code !== 404) throw e;
  }

  console.log(`💾 Création du bucket "${bucket.name}"...`);
  await storage.createBucket(bucket.name, bucket.name, bucket.enabled);
  console.log(`✅ Bucket "${bucket.name}" créé`);
}

// ==================== Main ====================

async function main() {
  console.log('========================================');
  console.log('🚀 CODET Appwrite Bootstrap');
  console.log('========================================\n');

  console.log(`📡 Endpoint: ${ENDPOINT}`);
  console.log(`🔑 Project:  ${PROJECT_ID}`);
  console.log(`💾 Database: ${DATABASE_ID}\n`);

  // 1. Créer la base de données
  await createDatabase();
  console.log('');

  // 2. Créer les collections
  console.log('📁 Création des collections...');
  for (const collection of COLLECTIONS) {
    await createCollection(DATABASE_ID, collection);
  }
  console.log('');

  // 3. Créer les buckets storage
  console.log('💾 Création des buckets storage...');
  for (const bucket of BUCKETS) {
    await createBucket(bucket);
  }
  console.log('');

  console.log('========================================');
  console.log('✅ Bootstrap terminé avec succès !');
  console.log('========================================');
  console.log('\nProchaines étapes :');
  console.log('  1. npm run appwrite:seed  (données initiales)');
  console.log('  2. npm run dev          (lancer l\'application)');
}

main().catch(err => {
  console.error('\n❌ Erreur:', err.message || err);
  process.exit(1);
});
