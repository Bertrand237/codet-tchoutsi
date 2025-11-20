import { Client, Account, Databases, Storage, Functions } from 'appwrite';

// Configuration Appwrite
const client = new Client();

client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || '');

// Services Appwrite
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);

// IDs de base de données et collections (à configurer après création dans Appwrite Console)
export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'codet-db';

// IDs des collections
export const COLLECTIONS = {
  USERS: 'users',
  PROJECTS: 'projects',
  PAYMENTS: 'payments',
  BUDGET: 'budget',
  EVENTS: 'events',
  POLLS: 'polls',
  VOTES: 'votes',
  FAMILIES: 'families',
  MESSAGES: 'messages',
  BLOG_POSTS: 'blog-posts',
  ADS: 'ads',
};

// ID du bucket de stockage unique (limitation plan gratuit : 1 bucket)
// Nous utilisons des dossiers virtuels pour organiser les fichiers
export const STORAGE_BUCKET_ID = 'payment-proofs';

// Préfixes pour organiser les fichiers dans le bucket unique
export const STORAGE_FOLDERS = {
  PAYMENT_PROOFS: 'payments/',
  BLOG_IMAGES: 'blog/',
  ADS_VIDEOS: 'ads/',
  PROFILE_PICTURES: 'profiles/',
  PROJECT_DOCUMENTS: 'projects/documents/',
  PROJECT_IMAGES: 'projects/images/',
};

export { client };
