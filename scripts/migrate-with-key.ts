import { config } from 'dotenv';
import { Client, Databases } from 'node-appwrite';

config();

// Récupérer la clé API depuis les arguments de ligne de commande
const apiKey = process.argv[2];

if (!apiKey) {
  console.error('❌ Erreur: Vous devez fournir la clé API en argument');
  console.log('\n📝 Usage:');
  console.log('   npx tsx scripts/migrate-with-key.ts VOTRE_CLE_API');
  console.log('\n💡 Exemple:');
  console.log('   npx tsx scripts/migrate-with-key.ts standard_abc123...\n');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '')
  .setKey(apiKey);

const databases = new Databases(client);
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || 'codet-db';

async function updateUsersCollection() {
  console.log('🔄 Mise à jour de la collection users...');
  
  try {
    // Ajouter l'attribut gender
    try {
      await databases.createEnumAttribute(
        DATABASE_ID,
        'users',
        'gender',
        ['monsieur', 'madame'],
        false // optional pour ne pas casser les anciens utilisateurs
      );
      console.log('✅ Attribut "gender" ajouté');
    } catch (error: any) {
      if (error.code === 409) {
        console.log('ℹ️  Attribut "gender" existe déjà');
      } else {
        throw error;
      }
    }

    // Ajouter l'attribut phoneNumber
    try {
      await databases.createStringAttribute(
        DATABASE_ID,
        'users',
        'phoneNumber',
        255,
        false // optional pour ne pas casser les anciens utilisateurs
      );
      console.log('✅ Attribut "phoneNumber" ajouté');
    } catch (error: any) {
      if (error.code === 409) {
        console.log('ℹ️  Attribut "phoneNumber" existe déjà');
      } else {
        throw error;
      }
    }

    // Ajouter l'attribut sousComite
    try {
      await databases.createStringAttribute(
        DATABASE_ID,
        'users',
        'sousComite',
        255,
        false // optional
      );
      console.log('✅ Attribut "sousComite" ajouté');
    } catch (error: any) {
      if (error.code === 409) {
        console.log('ℹ️  Attribut "sousComite" existe déjà');
      } else {
        throw error;
      }
    }

    // Ajouter l'attribut pays
    try {
      await databases.createStringAttribute(
        DATABASE_ID,
        'users',
        'pays',
        255,
        false // optional
      );
      console.log('✅ Attribut "pays" ajouté');
    } catch (error: any) {
      if (error.code === 409) {
        console.log('ℹ️  Attribut "pays" existe déjà');
      } else {
        throw error;
      }
    }

    // Ajouter l'attribut ville
    try {
      await databases.createStringAttribute(
        DATABASE_ID,
        'users',
        'ville',
        255,
        false // optional
      );
      console.log('✅ Attribut "ville" ajouté');
    } catch (error: any) {
      if (error.code === 409) {
        console.log('ℹ️  Attribut "ville" existe déjà');
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de la collection users:', error);
    throw error;
  }
}

async function updateProjectsCollection() {
  console.log('\n🔄 Mise à jour de la collection projects...');
  
  try {
    // Ajouter l'attribut documentPDFUrl
    try {
      await databases.createStringAttribute(
        DATABASE_ID,
        'projects',
        'documentPDFUrl',
        2000, // URL peut être longue
        false // optional
      );
      console.log('✅ Attribut "documentPDFUrl" ajouté');
    } catch (error: any) {
      if (error.code === 409) {
        console.log('ℹ️  Attribut "documentPDFUrl" existe déjà');
      } else {
        throw error;
      }
    }

    // Ajouter l'attribut preuveImages (array de URLs)
    try {
      await databases.createStringAttribute(
        DATABASE_ID,
        'projects',
        'preuveImages',
        10000, // Array JSON peut être long
        false, // optional
        undefined,
        true // array
      );
      console.log('✅ Attribut "preuveImages" ajouté');
    } catch (error: any) {
      if (error.code === 409) {
        console.log('ℹ️  Attribut "preuveImages" existe déjà');
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de la collection projects:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Début de la mise à jour du schéma Appwrite\n');
  
  console.log('📋 Configuration:');
  console.log('   Endpoint:', process.env.VITE_APPWRITE_ENDPOINT);
  console.log('   Project ID:', process.env.VITE_APPWRITE_PROJECT_ID);
  console.log('   Database ID:', DATABASE_ID);
  console.log('   API Key: ✅ Fournie (longueur: ' + apiKey.length + ')\n');

  try {
    await updateUsersCollection();
    await updateProjectsCollection();
    
    console.log('\n✅ Mise à jour du schéma terminée avec succès!');
    console.log('\n📝 Résumé des changements:');
    console.log('   Collection users: gender, phoneNumber, sousComite, pays, ville');
    console.log('   Collection projects: documentPDFUrl, preuveImages');
    console.log('\n💡 Note: Les nouveaux attributs sont optionnels pour préserver vos utilisateurs existants.');
    console.log('   Les anciens utilisateurs pourront continuer à utiliser l\'application normalement.\n');
    
  } catch (error: any) {
    console.error('\n❌ Erreur lors de la mise à jour:', error.message);
    if (error.code === 401) {
      console.error('\n💡 La clé API n\'a pas les bonnes permissions ou a expiré.');
      console.error('   Vérifiez que vous avez bien copié la clé complète.');
    }
    process.exit(1);
  }
}

main();
