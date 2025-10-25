import { Client, Databases } from 'node-appwrite';

const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '')
  .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || 'codet-db';

async function addMissingBooleans() {
  try {
    // Ajouter isPublished à blog-posts
    console.log('📁 Collection: blog-posts');
    try {
      await databases.createBooleanAttribute(DATABASE_ID, 'blog-posts', 'isPublished', false, undefined);
      console.log('   ✅ Attribut "isPublished" ajouté (optionnel)');
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error: any) {
      console.log(`   ${error.code === 409 ? 'ℹ️  Existe déjà' : '❌ Erreur: ' + error.message}`);
    }

    // Ajouter isActive à ads
    console.log('\n📁 Collection: ads');
    try {
      await databases.createBooleanAttribute(DATABASE_ID, 'ads', 'isActive', false, undefined);
      console.log('   ✅ Attribut "isActive" ajouté (optionnel)');
    } catch (error: any) {
      console.log(`   ${error.code === 409 ? 'ℹ️  Existe déjà' : '❌ Erreur: ' + error.message}`);
    }

    console.log('\n✅ Terminé !');
  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
  }
}

addMissingBooleans();
