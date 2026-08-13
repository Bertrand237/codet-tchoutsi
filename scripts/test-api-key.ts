import { config } from 'dotenv';
import { Client, Databases } from 'node-appwrite';

config();

const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '')
  .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || 'codet-db';

async function testConnection() {
  console.log('🔍 Test de la connexion à Appwrite...\n');
  
  console.log('📋 Configuration:');
  console.log('   Endpoint:', process.env.VITE_APPWRITE_ENDPOINT);
  console.log('   Project ID:', process.env.VITE_APPWRITE_PROJECT_ID);
  console.log('   Database ID:', DATABASE_ID);
  console.log('   API Key:', process.env.APPWRITE_API_KEY ? '✅ Définie (longueur: ' + process.env.APPWRITE_API_KEY.length + ')' : '❌ Non définie');
  console.log('');

  try {
    // Test 1: Lire la base de données
    console.log('📖 Test 1: Lecture de la base de données...');
    const db = await databases.get(DATABASE_ID);
    console.log('✅ Lecture OK - Nom:', db.name);
    
    // Test 2: Lister les collections
    console.log('\n📖 Test 2: Lecture des collections...');
    const collections = await databases.listCollections(DATABASE_ID);
    console.log('✅ Nombre de collections:', collections.total);
    console.log('   Collections:', collections.collections.map(c => c.name).join(', '));
    
    // Test 3: Lire la collection users
    console.log('\n📖 Test 3: Lecture de la collection users...');
    const usersCollection = await databases.getCollection(DATABASE_ID, 'users');
    console.log('✅ Collection users - Attributs:', usersCollection.attributes.length);
    console.log('   Attributs existants:', usersCollection.attributes.map((a: any) => a.key).join(', '));
    
    // Test 4: Essayer de créer un attribut de test
    console.log('\n✏️  Test 4: Tentative de création d\'un attribut de test...');
    try {
      await databases.createStringAttribute(
        DATABASE_ID,
        'users',
        'test_attribute_temp',
        50,
        false
      );
      console.log('✅ Création d\'attribut OK !');
      
      // Nettoyer l'attribut de test
      console.log('🧹 Nettoyage de l\'attribut de test...');
      await databases.deleteAttribute(DATABASE_ID, 'users', 'test_attribute_temp');
      console.log('✅ Nettoyage OK');
      
    } catch (error: any) {
      console.error('❌ Erreur lors de la création d\'attribut:');
      console.error('   Code:', error.code);
      console.error('   Type:', error.type);
      console.error('   Message:', error.message);
      console.error('\n💡 Solution: Votre clé API n\'a pas les permissions nécessaires.');
      console.error('   Allez dans Appwrite Console → Settings → API Keys');
      console.error('   Créez une nouvelle clé avec TOUS les scopes cochés:');
      console.error('   - databases.*');
      console.error('   - collections.*');
      console.error('   - attributes.*');
      console.error('   - documents.*');
      throw error;
    }
    
    console.log('\n✅ Tous les tests réussis ! Votre clé API fonctionne correctement.');
    
  } catch (error: any) {
    console.error('\n❌ Erreur:', error.message);
    process.exit(1);
  }
}

testConnection();
