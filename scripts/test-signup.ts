import { Client, Account, Databases, ID } from 'node-appwrite';

const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '')
  .setKey(process.env.APPWRITE_API_KEY || '');

const account = new Account(client);
const databases = new Databases(client);

const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || 'codet-db';

async function testSignup() {
  console.log('🧪 Test d\'inscription Appwrite...\n');
  
  const testEmail = `test${Date.now()}@codet.com`;
  const testPassword = 'Test123456';
  const testName = 'Test User';

  try {
    // 1. Créer le compte
    console.log('1️⃣ Création du compte utilisateur...');
    const user = await account.create(ID.unique(), testEmail, testPassword, testName);
    console.log(`✅ Compte créé avec ID: ${user.$id}\n`);

    // 2. Vérifier les utilisateurs existants
    console.log('2️⃣ Vérification du nombre d\'utilisateurs...');
    const usersListResponse = await databases.listDocuments(DATABASE_ID, 'users');
    console.log(`✅ Nombre d'utilisateurs: ${usersListResponse.total}\n`);

    // 3. Créer le profil
    console.log('3️⃣ Création du profil utilisateur dans la DB...');
    const userProfile = {
      email: testEmail,
      displayName: testName,
      role: 'admin',
      createdAt: new Date().toISOString(),
    };
    
    const profile = await databases.createDocument(DATABASE_ID, 'users', user.$id, userProfile);
    console.log(`✅ Profil créé: ${JSON.stringify(profile, null, 2)}\n`);

    console.log('✅ ✅ ✅ TEST RÉUSSI ! ✅ ✅ ✅\n');
    console.log('L\'inscription fonctionne correctement!\n');

  } catch (error: any) {
    console.error('❌ ERREUR DÉTECTÉE:\n');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('Type:', error.type);
    console.error('\nDétails complets:', error);
  }
}

testSignup();
