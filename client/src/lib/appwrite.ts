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

// IDs des buckets de stockage
export const BUCKETS = {
  PAYMENT_PROOFS: 'payment-proofs',
  BLOG_IMAGES: 'blog-images',
  ADS_VIDEOS: 'ads-videos',
  PROFILE_PICTURES: 'profile-pictures',
};

export { client };
