import { Client, Databases, Permission, Role } from 'node-appwrite';

const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '')
  .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || 'codet-db';

async function fixPermissions() {
  console.log('🔧 Correction des permissions Appwrite...\n');

  try {
    // 1. Supprimer tous les utilisateurs existants dans la collection
    console.log('1️⃣ Nettoyage de la collection users...');
    const existingUsers = await databases.listDocuments(DATABASE_ID, 'users');
    
    for (const user of existingUsers.documents) {
      await databases.deleteDocument(DATABASE_ID, 'users', user.$id);
      console.log(`   ✅ Utilisateur supprimé: ${user.$id}`);
    }
    
    console.log(`   ✅ ${existingUsers.total} utilisateur(s) supprimé(s)\n`);

    // 2. Mettre à jour les permissions de la collection users
    console.log('2️⃣ Mise à jour des permissions de la collection users...');
    
    await databases.updateCollection(
      DATABASE_ID,
      'users',
      'Users',
      [
        Permission.read(Role.any()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ],
      false,
      true
    );
    
    console.log('   ✅ Permissions mises à jour\n');

    console.log('✅✅✅ RÉPARATION TERMINÉE ! ✅✅✅\n');
    console.log('🎉 Vous pouvez maintenant créer votre premier compte admin !\n');
    
  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
    console.error('Code:', error.code);
    process.exit(1);
  }
}

fixPermissions();
