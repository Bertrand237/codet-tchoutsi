import { Client, Databases } from 'node-appwrite';

const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '')
  .setKey(process.env.APPWRITE_API_KEY || '');

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
        true // required
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
        true // required
      );
      console.log('✅ Attribut "phoneNumber" ajouté');
    } catch (error: any) {
      if (error.code === 409) {
        console.log('ℹ️  Attribut "phoneNumber" existe déjà');
      } else {
        throw error;
      }
    }

    // Rendre email optionnel (il était peut-être requis avant)
    // Note: On ne peut pas modifier un attribut existant, on peut seulement en créer de nouveaux
    console.log('ℹ️  Note: Si "email" était requis, il faut le recréer comme optionnel manuellement via la console Appwrite');

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
  
  if (!process.env.APPWRITE_API_KEY) {
    console.error('❌ APPWRITE_API_KEY n\'est pas défini dans les variables d\'environnement');
    process.exit(1);
  }

  try {
    await updateUsersCollection();
    await updateProjectsCollection();
    
    console.log('\n✅ Mise à jour du schéma terminée avec succès!');
    console.log('\n📝 Actions manuelles requises via la console Appwrite:');
    console.log('   1. Si "email" était requis dans users, le recréer comme optionnel');
    console.log('   2. Vérifier que tous les attributs sont indexés correctement');
    console.log('   3. Mettre à jour les permissions si nécessaire\n');
    
  } catch (error) {
    console.error('\n❌ Erreur lors de la mise à jour:', error);
    process.exit(1);
  }
}

main();
