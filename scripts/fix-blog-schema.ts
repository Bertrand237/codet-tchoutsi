import { Client, Databases } from 'node-appwrite';

const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '')
  .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || 'codet-db';

async function fixBlogSchema() {
  console.log('🔧 Correction du schéma blog-posts...\n');

  const attributes = [
    { key: 'excerpt', type: 'string', size: 500 },
    { key: 'authorId', type: 'string', size: 255 },
    { key: 'authorName', type: 'string', size: 255 },
    { key: 'publishedAt', type: 'datetime' },
    { key: 'updatedAt', type: 'datetime' },
  ];

  for (const attr of attributes) {
    try {
      if (attr.type === 'string') {
        await databases.createStringAttribute(
          DATABASE_ID,
          'blog-posts',
          attr.key,
          attr.size!,
          false,
          undefined,
          false
        );
      } else if (attr.type === 'datetime') {
        await databases.createDatetimeAttribute(
          DATABASE_ID,
          'blog-posts',
          attr.key,
          false,
          undefined
        );
      }
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

  console.log('\n✅ Schéma blog-posts corrigé !');
}

fixBlogSchema();
