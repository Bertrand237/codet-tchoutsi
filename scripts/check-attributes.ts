import { Client, Databases } from 'node-appwrite';

const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '')
  .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || 'codet-db';

async function checkAttributes() {
  console.log('🔍 Vérification des attributs Appwrite...\n');

  const collectionsToCheck = ['messages'];

  for (const collectionId of collectionsToCheck) {
    try {
      const collection = await databases.getCollection(DATABASE_ID, collectionId);
      console.log(`\n📁 Collection: ${collectionId}`);
      console.log('   Attributs:');
      collection.attributes.forEach((attr: any) => {
        console.log(`      - ${attr.key} (${attr.type})`);
      });
    } catch (error: any) {
      console.error(`❌ Erreur pour ${collectionId}:`, error.message);
    }
  }
}

checkAttributes();
