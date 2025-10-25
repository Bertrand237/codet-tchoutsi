import { Client, Databases } from 'node-appwrite';

const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '')
  .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || 'codet-db';

async function addUserNameToPayments() {
  try {
    await databases.createStringAttribute(DATABASE_ID, 'payments', 'userName', 255, false, undefined, false);
    console.log('✅ userName ajouté à payments');
  } catch (error: any) {
    console.log(error.code === 409 ? 'ℹ️  Existe déjà' : `❌ ${error.message}`);
  }
}

addUserNameToPayments();
