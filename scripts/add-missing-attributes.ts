import { Client, Databases } from 'node-appwrite';

const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '')
  .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || 'codet-db';

async function addMissingAttributes() {
  console.log('➕ Ajout des attributs manquants...\n');

  try {
    // 1. Ajouter 'status' à payments (optionnel car collection existe déjà)
    console.log('📁 Collection: payments');
    try {
      await databases.createStringAttribute(
        DATABASE_ID,
        'payments',
        'status',
        50,
        false, // Optionnel pour collections existantes
        undefined,
        false
      );
      console.log('   ✅ Attribut "status" ajouté (optionnel)');
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error: any) {
      if (error.code === 409) {
        console.log('   ℹ️  Attribut "status" existe déjà');
      } else {
        console.log(`   ❌ Erreur: ${error.message}`);
      }
    }

    // 2. Ajouter attributs manquants à projects (tous optionnels)
    console.log('\n📁 Collection: projects');
    
    const projectAttributes = [
      { key: 'status', type: 'string', size: 50 },
      { key: 'priority', type: 'string', size: 50 },
      { key: 'budget', type: 'double' },
      { key: 'progress', type: 'integer' },
    ];

    for (const attr of projectAttributes) {
      try {
        if (attr.type === 'string') {
          await databases.createStringAttribute(
            DATABASE_ID,
            'projects',
            attr.key,
            attr.size!,
            false, // Optionnel
            undefined,
            false
          );
        } else if (attr.type === 'integer') {
          await databases.createIntegerAttribute(
            DATABASE_ID,
            'projects',
            attr.key,
            false, // Optionnel
            undefined,
            undefined,
            undefined
          );
        } else if (attr.type === 'double') {
          await databases.createFloatAttribute(
            DATABASE_ID,
            'projects',
            attr.key,
            false, // Optionnel
            undefined,
            undefined,
            undefined
          );
        }
        console.log(`   ✅ Attribut "${attr.key}" ajouté (optionnel)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error: any) {
        if (error.code === 409) {
          console.log(`   ℹ️  Attribut "${attr.key}" existe déjà`);
        } else {
          console.log(`   ❌ Erreur pour "${attr.key}": ${error.message}`);
        }
      }
    }

    console.log('\n✅ Terminé !');
  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

addMissingAttributes();
