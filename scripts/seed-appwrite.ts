import { Client, Users, Databases, ID, Query } from 'appwrite';
import { directoryMembers, directoryEmail } from '../shared/directory';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

// Usage: ts-node scripts/seed-appwrite.ts --dry-run

const argv = yargs(hideBin(process.argv))
  .option('dry-run', { type: 'boolean', default: true, description: 'Do not create resources, only log' })
  .option('password', { type: 'string', default: '123456', description: 'Temporary password for new accounts' })
  .argv;

const DRY_RUN = argv['dry-run'];
const TEMP_PASSWORD = String(argv['password']);

const ENDPOINT = process.env.APPWRITE_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const PROJECT = process.env.APPWRITE_PROJECT || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
const API_KEY = process.env.APPWRITE_API_KEY || process.env.NEXT_PUBLIC_APPWRITE_API_KEY || '';
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'codet-db';
const USERS_COLLECTION = process.env.USERS_COLLECTION_ID || process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION || 'users';

if (!PROJECT || !API_KEY) {
  console.error('Missing APPWRITE_PROJECT or APPWRITE_API_KEY in environment. Aborting.');
  process.exit(1);
}

const client = new Client();
client
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT)
  .setKey(API_KEY);

const users = new Users(client);
const databases = new Databases(client);

async function existsProfileForMember(memberId: string, email: string) {
  try {
    // Try by directoryId
    const resByDir = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION, [Query.equal('directoryId', memberId)]);
    if (resByDir.documents && resByDir.documents.length > 0) return true;

    // Try by email
    const resByEmail = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION, [Query.equal('email', email)]);
    if (resByEmail.documents && resByEmail.documents.length > 0) return true;

    return false;
  } catch (err) {
    console.error('Error checking existing profile:', err);
    return false;
  }
}

async function seed() {
  console.log(`Seed start — members to process: ${directoryMembers.length} — dryRun=${DRY_RUN}`);

  for (const m of directoryMembers) {
    const email = directoryEmail(m);
    const already = await existsProfileForMember(m.id, email);
    if (already) {
      console.log(`Skipping existing member: ${m.fullName} (${m.id})`);
      continue;
    }

    console.log(`Will create account for: ${m.fullName} <${email}> (dirId=${m.id})`);

    if (DRY_RUN) continue;

    try {
      // Create Appwrite user (server-side using admin key)
      const userRes = await users.create(ID.unique(), email, TEMP_PASSWORD, m.fullName);
      console.log(`Created Appwrite account id=${userRes.$id} for ${email}`);

      // Create profile document in DB
      const profileDoc = {
        accountId: userRes.$id,
        email,
        displayName: m.fullName,
        role: 'membre',
        directoryId: m.id,
        phoneNumber: m.phone || '',
        mustChangePassword: true,
        createdAt: new Date().toISOString(),
      };

      const docRes = await databases.createDocument(DATABASE_ID, USERS_COLLECTION, ID.unique(), profileDoc);
      console.log(`Created profile document id=${docRes.$id} for ${email}`);
    } catch (err: any) {
      console.error(`Error creating account/profile for ${email}:`, err?.message || err);
    }
  }

  console.log('Seed finished');
}

seed().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
