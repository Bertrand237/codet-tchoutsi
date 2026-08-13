import { Client, Databases } from 'node-appwrite';
import * as dotenv from 'dotenv';

dotenv.config();

const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID!;
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID!;
const API_KEY = process.env.APPWRITE_API_KEY!;

const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);

async function addMissingAttributes() {
  console.log('🔧 Ajout des attributs manquants à la collection "messages"...\n');
  
  const collectionId = 'messages';
  
  try {
    // Ajouter messageType
    console.log('  ➕ Ajout de "messageType"...');
    try {
      await databases.createStringAttribute(
        DATABASE_ID,
        collectionId,
        'messageType',
        50,
        false, // not required
        'text' // default value
      );
      console.log('     ✅ messageType ajouté');
    } catch (error: any) {
      if (error.code === 409) {
        console.log('     ⚠️  messageType existe déjà');
      } else {
        throw error;
      }
    }
    
    // Ajouter imageUrl
    console.log('  ➕ Ajout de "imageUrl"...');
    try {
      await databases.createStringAttribute(
        DATABASE_ID,
        collectionId,
        'imageUrl',
        500,
        false // not required
      );
      console.log('     ✅ imageUrl ajouté');
    } catch (error: any) {
      if (error.code === 409) {
        console.log('     ⚠️  imageUrl existe déjà');
      } else {
        throw error;
      }
    }
    
    // Ajouter audioUrl
    console.log('  ➕ Ajout de "audioUrl"...');
    try {
      await databases.createStringAttribute(
        DATABASE_ID,
        collectionId,
        'audioUrl',
        500,
        false // not required
      );
      console.log('     ✅ audioUrl ajouté');
    } catch (error: any) {
      if (error.code === 409) {
        console.log('     ⚠️  audioUrl existe déjà');
      } else {
        throw error;
      }
    }
    
    console.log('\n✅ Migration terminée avec succès !');
    console.log('📋 Les messages existants sont préservés.');
    console.log('📱 Vous pouvez maintenant envoyer des messages avec photos et audio.');
    
  } catch (error) {
    console.error('\n❌ Erreur lors de la migration:', error);
    throw error;
  }
}

addMissingAttributes()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });
