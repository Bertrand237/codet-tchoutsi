/**
 * Appwrite Seed Script
 * Insère des données initiales pour tester l'application.
 * 
 * Utilisation: npm run appwrite:seed
 * 
 * Exécutez appwrite:bootstrap d'abord si ce n'est pas déjà fait.
 */

import { Client, Databases, Storage, ID } from 'appwrite';
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
    console.error('❌ Fichier .env non trouvé.');
    process.exit(1);
  }
}

const env = loadEnv();

const ENDPOINT = env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = env.APPWRITE_API_KEY;
const DATABASE_ID = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'codet-db';

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
  console.error('❌ Variables manquantes dans .env');
  process.exit(1);
}

const client = new Client();
client.setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);

const now = new Date().toISOString();

// ==================== Sample Data ====================

const sampleEvents = [
  {
    titre: 'Assemblée Générale CODET',
    description: 'Réunion annuelle de tous les membres pour le bilan et les perspectives.',
    type: 'assemblee',
    dateDebut: new Date(Date.now() + 7 * 86400000).toISOString(),
    dateFin: new Date(Date.now() + 7 * 86400000 + 3 * 3600000).toISOString(),
    lieu: 'Salle communautaire de Tchoutsi',
    couleur: '#059669',
  },
  {
    titre: 'Séance de formation',
    description: 'Formation sur les techniques agricoles modernes.',
    type: 'formation',
    dateDebut: new Date(Date.now() + 14 * 86400000).toISOString(),
    dateFin: new Date(Date.now() + 14 * 86400000 + 2 * 3600000).toISOString(),
    lieu: 'Centre de formation Tchoutsi',
    couleur: '#2563eb',
  },
];

const sampleBlogPosts = [
  {
    title: 'Bienvenue sur la plateforme CODET',
    content: 'Ceci est le premier article de blog du Comité de Développement Tchoutsi. Cette plateforme vous permet de gérer les membres, les projets, les paiements et bien plus encore.',
    excerpt: 'Premier article de la plateforme CODET',
    imageUrl: '',
    authorId: 'system',
    isPublished: true,
    tags: 'annonce,code',
  },
];

const samplePolls = [
  {
    question: 'Quelle activité souhaitez-vous prioriser cette année ?',
    description: 'Votez pour l\'activité principale de l\'année.',
    options: JSON.stringify(['Agriculture', 'Éducation', 'Santé', 'Infrastructure']),
    dateDebut: now,
    dateFin: new Date(Date.now() + 30 * 86400000).toISOString(),
    actif: true,
    votants: JSON.stringify([]),
    auteurId: 'system',
  },
];

const sampleAds = [
  {
    title: 'Annonce communautaire',
    videoUrl: '',
    imageUrl: '',
    lien: '',
    isActive: true,
    order: 1,
  },
];

// ==================== Functions ====================

async function seedCollection(name, documents) {
  try {
    const existing = await databases.listDocuments(DATABASE_ID, name, [], 1);
    if (existing.total > 0) {
      console.log(`  ⏭️  Collection "${name}" contient déjà ${existing.total} document(s), ignoré`);
      return;
    }
  } catch {
    // Collection might be empty, continue
  }

  let count = 0;
  for (const doc of documents) {
    try {
      await databases.createDocument(DATABASE_ID, name, ID.unique(), doc);
      count++;
    } catch (err) {
      console.log(`    ⚠️  Erreur: ${err.message}`);
    }
  }
  console.log(`  ✅ Collection "${name}": ${count} document(s) inséré(s)`);
}

// ==================== Main ====================

async function main() {
  console.log('========================================');
  console.log('🌱 CODET Appwrite Seed');
  console.log('========================================\n');

  console.log('📋 Insertion des données initiales...\n');

  await seedCollection('events', sampleEvents);
  await seedCollection('blog-posts', sampleBlogPosts);
  await seedCollection('polls', samplePolls);
  await seedCollection('ads', sampleAds);

  console.log('\n========================================');
  console.log('✅ Seed terminé !');
  console.log('========================================');
  console.log('\nProchaine étape :');
  console.log('  npm run dev');
}

main().catch(err => {
  console.error('\n❌ Erreur:', err.message || err);
  process.exit(1);
});
