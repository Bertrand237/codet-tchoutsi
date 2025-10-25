import { Client, Databases, Storage, ID, Permission, Role } from 'node-appwrite';

const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '')
  .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);
const storage = new Storage(client);

const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || 'codet-db';

// Définition des collections
const COLLECTIONS = [
  {
    id: 'users',
    name: 'Users',
    attributes: [
      { key: 'email', type: 'string', size: 255, required: true },
      { key: 'displayName', type: 'string', size: 255, required: true },
      { key: 'role', type: 'string', size: 50, required: true, default: 'membre' },
      { key: 'phoneNumber', type: 'string', size: 20, required: false },
      { key: 'photoURL', type: 'string', size: 500, required: false },
      { key: 'createdAt', type: 'datetime', required: true },
    ],
  },
  {
    id: 'projects',
    name: 'Projects',
    attributes: [
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'description', type: 'string', size: 5000, required: true },
      { key: 'status', type: 'string', size: 50, required: true, default: 'planifié' },
      { key: 'budget', type: 'double', required: true, default: 0 },
      { key: 'progress', type: 'integer', required: true, default: 0 },
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
      { key: 'status', type: 'string', size: 50, required: true, default: 'en_attente' },
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
      { key: 'isActive', type: 'boolean', required: true, default: true },
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
      { key: 'phone', type: 'string', size: 20, required: false },
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
      { key: 'status', type: 'string', size: 50, required: true, default: 'draft' },
      { key: 'author', type: 'string', size: 255, required: true },
      { key: 'createdAt', type: 'datetime', required: true },
    ],
  },
  {
    id: 'ads',
    name: 'Ads',
    attributes: [
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'description', type: 'string', size: 1000, required: false },
      { key: 'videoUrl', type: 'string', size: 500, required: true },
      { key: 'isActive', type: 'boolean', required: true, default: true },
      { key: 'createdBy', type: 'string', size: 255, required: true },
      { key: 'createdAt', type: 'datetime', required: true },
    ],
  },
];

// Définition des buckets de storage
const BUCKETS = [
  { id: 'payment-proofs', name: 'Payment Proofs', maxFileSize: 10485760 }, // 10 MB
  { id: 'blog-images', name: 'Blog Images', maxFileSize: 5242880 }, // 5 MB
  { id: 'ads-videos', name: 'Ads Videos', maxFileSize: 52428800 }, // 50 MB
  { id: 'profile-pictures', name: 'Profile Pictures', maxFileSize: 2097152 }, // 2 MB
];

async function initializeAppwrite() {
  console.log('🚀 Initialisation d\'Appwrite...\n');

  try {
    // 1. Créer ou vérifier la base de données
    console.log('📊 Vérification de la base de données...');
    try {
      await databases.get(DATABASE_ID);
      console.log('✅ Base de données existe déjà\n');
    } catch (error: any) {
      if (error.code === 404) {
        console.log('📊 Création de la base de données...');
        await databases.create(DATABASE_ID, 'CODET Database');
        console.log('✅ Base de données créée\n');
      } else {
        throw error;
      }
    }

    // 2. Créer les collections
    for (const collection of COLLECTIONS) {
      console.log(`📁 Traitement de la collection: ${collection.name}...`);
      
      try {
        await databases.getCollection(DATABASE_ID, collection.id);
        console.log(`   ✅ Collection "${collection.name}" existe déjà`);
      } catch (error: any) {
        if (error.code === 404) {
          // Créer la collection
          console.log(`   📁 Création de la collection "${collection.name}"...`);
          await databases.createCollection(
            DATABASE_ID,
            collection.id,
            collection.name,
            [
              Permission.read(Role.any()),
              Permission.create(Role.users()),
              Permission.update(Role.users()),
              Permission.delete(Role.users()),
            ]
          );
          console.log(`   ✅ Collection créée`);

          // Créer les attributs
          for (const attr of collection.attributes) {
            console.log(`      ➕ Ajout attribut: ${attr.key} (${attr.type})`);
            
            try {
              if (attr.type === 'string') {
                await databases.createStringAttribute(
                  DATABASE_ID,
                  collection.id,
                  attr.key,
                  attr.size!,
                  attr.required,
                  attr.default,
                  false
                );
              } else if (attr.type === 'integer') {
                await databases.createIntegerAttribute(
                  DATABASE_ID,
                  collection.id,
                  attr.key,
                  attr.required,
                  undefined,
                  undefined,
                  attr.default
                );
              } else if (attr.type === 'double') {
                await databases.createFloatAttribute(
                  DATABASE_ID,
                  collection.id,
                  attr.key,
                  attr.required,
                  undefined,
                  undefined,
                  attr.default
                );
              } else if (attr.type === 'boolean') {
                await databases.createBooleanAttribute(
                  DATABASE_ID,
                  collection.id,
                  attr.key,
                  attr.required,
                  attr.default
                );
              } else if (attr.type === 'datetime') {
                await databases.createDatetimeAttribute(
                  DATABASE_ID,
                  collection.id,
                  attr.key,
                  attr.required,
                  attr.default
                );
              }
              
              // Attendre un peu entre chaque attribut
              await new Promise(resolve => setTimeout(resolve, 500));
              
            } catch (attrError: any) {
              if (attrError.code !== 409) { // Ignore si existe déjà
                console.log(`      ⚠️  Erreur attribut ${attr.key}: ${attrError.message}`);
              }
            }
          }
          console.log(`   ✅ Tous les attributs ajoutés\n`);
        } else {
          throw error;
        }
      }
    }

    // 3. Créer les buckets de storage
    console.log('\n📦 Création des buckets de storage...');
    for (const bucket of BUCKETS) {
      try {
        await storage.getBucket(bucket.id);
        console.log(`   ✅ Bucket "${bucket.name}" existe déjà`);
      } catch (error: any) {
        if (error.code === 404) {
          console.log(`   📦 Création du bucket "${bucket.name}"...`);
          await storage.createBucket(
            bucket.id,
            bucket.name,
            [
              Permission.read(Role.any()),
              Permission.create(Role.users()),
              Permission.update(Role.users()),
              Permission.delete(Role.users()),
            ],
            false,
            undefined,
            undefined,
            ['jpg', 'jpeg', 'png', 'pdf', 'mp4', 'webm', 'mov', 'webp'],
            undefined,
            undefined,
            bucket.maxFileSize
          );
          console.log(`   ✅ Bucket créé`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n✅ ✅ ✅ INITIALISATION TERMINÉE AVEC SUCCÈS ! ✅ ✅ ✅\n');
    console.log('🎉 Votre base de données Appwrite est prête à l\'emploi !\n');
    
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'initialisation:', error.message);
    console.error('Code:', error.code);
    process.exit(1);
  }
}

initializeAppwrite();
