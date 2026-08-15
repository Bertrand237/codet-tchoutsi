import { Client, Account, Databases, Storage } from 'appwrite';

const client = new Client();

client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '68fceae4001cf61101d4');

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

export const STORAGE_BUCKET_ID = 'payment-proofs';

export const STORAGE_FOLDERS = {
  PAYMENT_PROOFS: 'payments/',
  BLOG_IMAGES: 'blog/',
  ADS_VIDEOS: 'ads/',
  BLOG_VIDEOS: 'blog-videos/',
  PROFILE_PICTURES: 'profiles/',
  PROJECT_DOCUMENTS: 'projects/documents/',
  PROJECT_IMAGES: 'projects/images/',
  GALLERY_IMAGES: 'gallery/',
};

export const GALLERY_BUCKET_ID = 'gallery-media';

export { client };
