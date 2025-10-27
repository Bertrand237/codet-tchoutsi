import { Client, Databases } from 'node-appwrite';

const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '')
  .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || 'codet-db';

async function addProfessionAttribute() {
  console.log('➕ Ajout de l\'attribut profession à la collection users...\n');

  try {
    console.log('📁 Collection: users');
    try {
      await databases.createStringAttribute(
        DATABASE_ID,
        'users',
        'profession',
        255,
        false, // Optionnel
        undefined,
        false
      );
      console.log('   ✅ Attribut "profession" ajouté (optionnel, max 255 caractères)');
    } catch (error: any) {
      if (error.code === 409) {
        console.log('   ℹ️  Attribut "profession" existe déjà');
      } else {
        console.log(`   ❌ Erreur: ${error.message}`);
      }
    }

    console.log('\n✅ Terminé !');
  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

addProfessionAttribute();
