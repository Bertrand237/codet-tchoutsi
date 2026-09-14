import { Client, Databases, Storage, Users, ID, Permission, Role, Query } from 'node-appwrite';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const endpoint = process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const projectId = process.env.VITE_APPWRITE_PROJECT_ID || '697479255659757217691253116675952793';
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID || 'codet-db';
const apiKey = process.env.APPWRITE_API_KEY;
const DEFAULT_PASSWORD = process.env.APPWRITE_DEFAULT_PASSWORD || 'CodetTchoutsi2025!';

if (!apiKey) {
  console.error('❌ APPWRITE_API_KEY est requise.');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);
const users = new Users(client);
const storage = new Storage(client);

interface AttrDef {
  key: string;
  type: 'string' | 'integer' | 'double' | 'boolean' | 'datetime';
  size?: number;
  required?: boolean;
  defaultValue?: any;
}

interface ColDef {
  id: string;
  name: string;
  attributes: AttrDef[];
}

const COLLECTIONS: ColDef[] = [
  {
    id: 'users',
    name: 'Users',
    attributes: [
      { key: 'email', type: 'string', size: 255, required: true },
      { key: 'displayName', type: 'string', size: 255, required: true },
      { key: 'role', type: 'string', size: 50, required: true },
      { key: 'gender', type: 'string', size: 50, required: false },
      { key: 'phoneNumber', type: 'string', size: 50, required: false },
      { key: 'directoryId', type: 'string', size: 255, required: false },
      { key: 'mustChangePassword', type: 'boolean', required: false },
      { key: 'sousComite', type: 'string', size: 255, required: false },
      { key: 'pays', type: 'string', size: 100, required: false },
      { key: 'ville', type: 'string', size: 100, required: false },
      { key: 'profession', type: 'string', size: 255, required: false },
      { key: 'photoURL', type: 'string', size: 1000, required: false },
      { key: 'createdAt', type: 'datetime', required: true },
    ],
  },
  {
    id: 'projects',
    name: 'Projects',
    attributes: [
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'description', type: 'string', size: 5000, required: true },
      { key: 'status', type: 'string', size: 50, required: true },
      { key: 'budget', type: 'double', required: true },
      { key: 'progress', type: 'integer', required: true },
      { key: 'responsible', type: 'string', size: 255, required: false },
      { key: 'startDate', type: 'datetime', required: false },
      { key: 'endDate', type: 'datetime', required: false },
      { key: 'createdBy', type: 'string', size: 255, required: true },
      { key: 'createdAt', type: 'datetime', required: true },
    ],
  },
  {
    id: 'payments',
    name: 'Payments',
    attributes: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'amount', type: 'double', required: true },
      { key: 'paymentType', type: 'string', size: 100, required: true },
      { key: 'description', type: 'string', size: 1000, required: false },
      { key: 'proofUrl', type: 'string', size: 500, required: false },
      { key: 'status', type: 'string', size: 50, required: true },
      { key: 'validatedBy', type: 'string', size: 255, required: false },
      { key: 'validatedAt', type: 'datetime', required: false },
      { key: 'createdAt', type: 'datetime', required: true },
    ],
  },
  {
    id: 'budget',
    name: 'Budget',
    attributes: [
      { key: 'type', type: 'string', size: 50, required: true },
      { key: 'category', type: 'string', size: 100, required: true },
      { key: 'amount', type: 'double', required: true },
      { key: 'description', type: 'string', size: 1000, required: true },
      { key: 'date', type: 'datetime', required: true },
      { key: 'createdBy', type: 'string', size: 255, required: true },
      { key: 'createdAt', type: 'datetime', required: true },
    ],
  },
  {
    id: 'events',
    name: 'Events',
    attributes: [
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'description', type: 'string', size: 2000, required: false },
      { key: 'startDate', type: 'datetime', required: true },
      { key: 'endDate', type: 'datetime', required: true },
      { key: 'location', type: 'string', size: 255, required: false },
      { key: 'createdBy', type: 'string', size: 255, required: true },
      { key: 'createdAt', type: 'datetime', required: true },
    ],
  },
  {
    id: 'polls',
    name: 'Polls',
    attributes: [
      { key: 'question', type: 'string', size: 500, required: true },
      { key: 'options', type: 'string', size: 5000, required: true },
      { key: 'createdBy', type: 'string', size: 255, required: true },
      { key: 'expiresAt', type: 'datetime', required: true },
      { key: 'isActive', type: 'boolean', required: true },
      { key: 'createdAt', type: 'datetime', required: true },
    ],
  },
  {
    id: 'votes',
    name: 'Votes',
    attributes: [
      { key: 'pollId', type: 'string', size: 255, required: true },
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'option', type: 'string', size: 500, required: true },
      { key: 'createdAt', type: 'datetime', required: true },
    ],
  },
  {
    id: 'families',
    name: 'Families',
    attributes: [
      { key: 'familyName', type: 'string', size: 255, required: true },
      { key: 'headOfFamily', type: 'string', size: 255, required: true },
      { key: 'address', type: 'string', size: 500, required: false },
      { key: 'phone', type: 'string', size: 50, required: false },
      { key: 'members', type: 'string', size: 10000, required: false },
      { key: 'createdBy', type: 'string', size: 255, required: true },
      { key: 'createdAt', type: 'datetime', required: true },
    ],
  },
  {
    id: 'messages',
    name: 'Messages',
    attributes: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'userName', type: 'string', size: 255, required: true },
      { key: 'text', type: 'string', size: 5000, required: true },
      { key: 'messageType', type: 'string', size: 50, required: false },
      { key: 'imageUrl', type: 'string', size: 500, required: false },
      { key: 'audioUrl', type: 'string', size: 500, required: false },
      { key: 'timestamp', type: 'datetime', required: true },
    ],
  },
  {
    id: 'blog-posts',
    name: 'Blog Posts',
    attributes: [
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'content', type: 'string', size: 50000, required: true },
      { key: 'imageUrl', type: 'string', size: 500, required: false },
      { key: 'status', type: 'string', size: 50, required: true },
      { key: 'author', type: 'string', size: 255, required: true },
      { key: 'createdAt', type: 'datetime', required: true },
    ],
  },
  {
    id: 'ads',
    name: 'Ads',
    attributes: [
      { key: 'titre', type: 'string', size: 255, required: true },
      { key: 'videoUrl', type: 'string', size: 500, required: true },
      { key: 'isActive', type: 'boolean', required: true },
      { key: 'createdAt', type: 'datetime', required: true },
    ],
  },
  {
    id: 'blog-videos',
    name: 'Blog Videos',
    attributes: [
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'description', type: 'string', size: 5000, required: false },
      { key: 'videoUrl', type: 'string', size: 500, required: true },
      { key: 'authorId', type: 'string', size: 255, required: true },
      { key: 'authorName', type: 'string', size: 255, required: false },
      { key: 'isPublished', type: 'boolean', required: true },
      { key: 'createdAt', type: 'datetime', required: true },
    ],
  },
  {
    id: 'census',
    name: 'Census',
    attributes: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'address', type: 'string', size: 500, required: false },
      { key: 'phone', type: 'string', size: 50, required: false },
      { key: 'members', type: 'string', size: 10000, required: false },
      { key: 'createdAt', type: 'datetime', required: true },
    ],
  },
];

const BUCKETS = [
  { id: 'ads', name: 'Ads' },
  { id: 'blog-videos', name: 'Blog Videos' },
  { id: 'payment-proofs', name: 'Payment Proofs' },
  { id: 'profile-pictures', name: 'Profile Pictures' },
  { id: 'codet-documents', name: 'Codet Documents' },
];

async function ensureDatabase() {
  console.log(`📁 Vérification de la base "${databaseId}"...`);
  try {
    await databases.get(databaseId);
    console.log('   ✅ Base de données existe.');
  } catch (e: any) {
    if (e.code === 404) {
      console.log('   ➕ Création de la base de données...');
      await databases.create(databaseId, 'CODET Database');
      console.log('   ✅ Base créée.');
    } else {
      throw e;
    }
  }
}

async function ensureCollections() {
  for (const col of COLLECTIONS) {
    console.log(`\n📁 Collection: ${col.name} (${col.id})`);
    const perms = [
      Permission.read(Role.any()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users()),
    ];

    let existingAttributes: string[] = [];
    try {
      const existing = await databases.getCollection(databaseId, col.id);
      existingAttributes = existing.attributes.map((a: any) => a.key);
      console.log(`   ✅ Existe déjà (${existingAttributes.length} attributs actuels)`);
    } catch (e: any) {
      if (e.code === 404) {
        console.log(`   ➕ Création de la collection...`);
        const created = await databases.createCollection(databaseId, col.id, col.name, perms);
        existingAttributes = created.attributes.map((a: any) => a.key);
      } else {
        console.warn(`   ⚠️ Erreur getCollection: ${e.message}`);
      }
    }

    for (const attr of col.attributes) {
      if (existingAttributes.includes(attr.key)) {
        continue;
      }
      try {
        console.log(`     ➕ Attr: ${attr.key} (${attr.type})`);
        if (attr.type === 'string') {
          await databases.createStringAttribute(databaseId, col.id, attr.key, attr.size || 255, !!attr.required);
        } else if (attr.type === 'integer') {
          await databases.createIntegerAttribute(databaseId, col.id, attr.key, !!attr.required);
        } else if (attr.type === 'double') {
          await databases.createFloatAttribute(databaseId, col.id, attr.key, !!attr.required);
        } else if (attr.type === 'boolean') {
          await databases.createBooleanAttribute(databaseId, col.id, attr.key, !!attr.required);
        } else if (attr.type === 'datetime') {
          await databases.createDatetimeAttribute(databaseId, col.id, attr.key, !!attr.required);
        }
        await new Promise((r) => setTimeout(r, 400));
      } catch (err: any) {
        if (err.code !== 409) {
          console.log(`     ⚠️ Attr ${attr.key}: ${err.message}`);
        }
      }
    }
  }
}

async function ensureBuckets() {
  console.log('\n📦 Vérification des buckets de stockage...');
  for (const b of BUCKETS) {
    try {
      await storage.getBucket(b.id);
      console.log(`   ✅ Bucket ${b.name} existe.`);
    } catch (e: any) {
      if (e.code === 404) {
        console.log(`   ➕ Création du bucket ${b.name}...`);
        try {
          await storage.createBucket(
            b.id,
            b.name,
            [
              Permission.read(Role.any()),
              Permission.create(Role.users()),
              Permission.update(Role.users()),
              Permission.delete(Role.users()),
            ],
            false,
            undefined,
            undefined,
            ['jpg', 'jpeg', 'png', 'pdf', 'mp4', 'webm', 'mov', 'webp']
          );
          console.log(`   ✅ Bucket ${b.name} créé.`);
        } catch (err: any) {
          console.warn(`   ⚠️ Bucket ${b.name} ignoré (limite plan atteinte: ${err.message})`);
        }
      }
    }
  }
}

interface DirectoryMember {
  id: string;
  number: number;
  delegation: string;
  fullName: string;
  phone?: string;
  gender?: string;
}

function parseDirectoryDocument(document: string): DirectoryMember[] {
  return document
    .split(/\r?\n/)
    .filter((line) => /^\|\s*\d+\s*\|/.test(line))
    .map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim()))
    .filter((cells) => cells.length >= 5)
    .map((cells) => {
      const number = Number(cells[0]);
      const phone = cells[4] && cells[4] !== '-' ? cells[4] : undefined;
      const gender = cells[3] && cells[3] !== '-' ? cells[3] : undefined;

      return {
        id: `directory-${number}`,
        number,
        delegation: cells[1],
        fullName: cells[2],
        ...(phone && { phone }),
        ...(gender && { gender }),
      };
    });
}

function generateEmail(member: DirectoryMember): string {
  const slug = member.fullName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.');

  const suffix = member.id.split('-').pop();
  return `${slug}.${suffix}@codet.cm`;
}

async function seedMembers() {
  console.log('\n👥 Chargement des membres de l\'annuaire...');
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const assetsDir = resolve(__dirname, '..', 'attached_assets');
  const files = readdirSync(assetsDir);
  const directoryFile = files.find(
    (f) => f.startsWith('Pasted-Voici-le-document') && f.endsWith('1786579234916.txt')
  );

  if (!directoryFile) {
    throw new Error('Fichier annuaire non trouvé.');
  }

  const content = readFileSync(resolve(assetsDir, directoryFile), 'utf-8');
  const members = parseDirectoryDocument(content);
  console.log(`📖 ${members.length} membres détectés dans l'annuaire.`);

  // Récupérer les directoryId déjà créés
  console.log('🔍 Vérification des comptes déjà existants...');
  const existingDirectoryIds = new Set<string>();
  let offset = 0;
  const limit = 100;
  while (true) {
    try {
      const res = await databases.listDocuments(databaseId, 'users', [
        Query.limit(limit),
        Query.offset(offset),
        Query.select(['$id', 'directoryId']),
      ]);
      for (const d of res.documents) {
        if ((d as any).directoryId) existingDirectoryIds.add((d as any).directoryId);
      }
      if (res.documents.length < limit) break;
      offset += limit;
    } catch {
      break;
    }
  }

  console.log(`ℹ️ ${existingDirectoryIds.size} membres déjà créés dans Appwrite.`);
  const toCreate = members.filter((m) => !existingDirectoryIds.has(m.id));
  console.log(`🚀 ${toCreate.length} nouveaux membres à insérer...`);

  let createdCount = 0;
  for (let i = 0; i < toCreate.length; i++) {
    const member = toCreate[i];
    const email = generateEmail(member);
    const displayName = member.fullName;
    let userId: string;

    try {
      const authUser = await users.create(ID.unique(), email, undefined, DEFAULT_PASSWORD, displayName);
      userId = authUser.$id;
    } catch (err: any) {
      if (err.code === 409) {
        try {
          const list = await users.list([Query.equal('email', email)]);
          userId = list.users.length > 0 ? list.users[0].$id : ID.unique();
        } catch {
          userId = ID.unique();
        }
      } else {
        console.warn(`  ⚠️ Auth error pour ${displayName}: ${err.message}`);
        userId = ID.unique();
      }
    }

    try {
      await databases.createDocument(databaseId, 'users', userId, {
        accountId: userId,
        email,
        displayName,
        role: 'membre',
        phoneNumber: member.phone || '',
        directoryId: member.id,
        mustChangePassword: true,
        gender: member.gender || '',
        sousComite: member.delegation || '',
        pays: '',
        ville: '',
        profession: '',
        photoURL: '',
        createdAt: new Date().toISOString(),
      });
      createdCount++;
      if (createdCount % 25 === 0 || i === toCreate.length - 1) {
        console.log(`   [${i + 1}/${toCreate.length}] ${createdCount} membres insérés...`);
      }
    } catch (err: any) {
      if (err.code !== 409) {
        console.warn(`  ⚠️ Doc error pour ${displayName}: ${err.message}`);
      }
    }

    // Petite pause pour respecter le rate limiting Cloud
    await new Promise((r) => setTimeout(r, 120));
  }

  console.log(`\n🎉 SEED TERMINÉ: ${createdCount} membres insérés avec succès !`);
}

async function main() {
  console.log('====================================================');
  console.log('  🚀 DÉPLOIEMENT COMPLET BASE APPWRITE + 839 PROFILS');
  console.log('====================================================');
  console.log(`Projet: ${projectId}`);
  console.log(`Base:   ${databaseId}`);

  await ensureDatabase();
  await ensureCollections();
  await ensureBuckets();
  await seedMembers();

  console.log('\n====================================================');
  console.log('  ✅ TOUT EST PRÊT DANS APPWRITE !');
  console.log('====================================================');
}

main().catch((err) => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});
