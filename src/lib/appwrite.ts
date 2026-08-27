import { Client, Account, Databases, Storage } from 'appwrite';

const client = new Client();

// Configuration mise à jour depuis la console Appwrite
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '697479255659757217691253116675952793';

client
  .setEndpoint(endpoint)
  .setProject(projectId);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'codet-db';

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
  BLOG_VIDEOS: 'blog-videos',
  ADS: 'ads',
  GALLERY: 'gallery',
  NOTIFICATIONS: 'notifications',
  TRANSACTIONS: 'transactions',
};

export const BUCKETS = {
  PAYMENT_PROOFS: 'payment-proofs',
  BLOG_IMAGES: 'blog-images',
  PROFILE_PICTURES: 'profile-pictures',
  GALLERY: 'gallery-media',
};

export { client };
