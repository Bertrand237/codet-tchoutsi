import { Client, Databases } from 'node-appwrite';

const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '')
  .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || 'codet-db';

async function fixEventsSchema() {
  console.log('🔧 Ajout des attributs manquants à events...\n');

  const attributes = [
    { key: 'type', type: 'string', size: 50 },
    { key: 'organisateurNom', type: 'string', size: 255 },
    { key: 'participantsIds', type: 'string', size: 5000 }, // JSON array
  ];

  for (const attr of attributes) {
    try {
      await databases.createStringAttribute(
        DATABASE_ID,
        'events',
        attr.key,
        attr.size!,
        false,
        undefined,
        false
      );
      console.log(`✅ Attribut "${attr.key}" ajouté`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error: any) {
      if (error.code === 409) {
        console.log(`ℹ️  Attribut "${attr.key}" existe déjà`);
      } else {
        console.log(`❌ Erreur pour "${attr.key}": ${error.message}`);
      }
    }
  }

  console.log('\n✅ Schéma events corrigé !');
}

fixEventsSchema();
