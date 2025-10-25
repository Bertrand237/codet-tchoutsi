import { Client, Databases, Users } from 'node-appwrite';

const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '')
  .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);
const users = new Users(client);
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || 'codet-db';

async function cleanAppwrite() {
  console.log('🧹 Nettoyage complet d\'Appwrite...\n');

  try {
    // 1. Supprimer tous les utilisateurs de la collection
    console.log('1️⃣ Suppression des documents users...');
    const userDocs = await databases.listDocuments(DATABASE_ID, 'users');
    for (const doc of userDocs.documents) {
      await databases.deleteDocument(DATABASE_ID, 'users', doc.$id);
      console.log(`   ✅ Document supprimé: ${doc.$id}`);
    }
    console.log(`   ✅ ${userDocs.total} document(s) supprimé(s)\n`);

    // 2. Supprimer tous les comptes Auth
    console.log('2️⃣ Suppression des comptes Auth...');
    const authUsers = await users.list();
    for (const user of authUsers.users) {
      await users.delete(user.$id);
      console.log(`   ✅ Compte Auth supprimé: ${user.$id}`);
    }
    console.log(`   ✅ ${authUsers.total} compte(s) Auth supprimé(s)\n`);

    console.log('✅✅✅ NETTOYAGE TERMINÉ ! ✅✅✅\n');
    console.log('🎉 Base de données Appwrite complètement nettoyée !\n');
    
  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

cleanAppwrite();
