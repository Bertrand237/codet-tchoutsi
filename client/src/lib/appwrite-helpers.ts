import { databases } from './appwrite';
import { Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;

/**
 * Helper function to list documents from an Appwrite collection
 */
export async function listDocuments(
  collectionId: string,
  queries: string[] = []
) {
  return await databases.listDocuments(
    DATABASE_ID,
    collectionId,
    queries
  );
}

/**
 * Helper function to get a single document from an Appwrite collection
 */
export async function getDocument(
  collectionId: string,
  documentId: string
) {
  return await databases.getDocument(
    DATABASE_ID,
    collectionId,
    documentId
  );
}

/**
 * Helper function to create a document in an Appwrite collection
 */
export async function createDocument(
  collectionId: string,
  data: any,
  documentId?: string
) {
  return await databases.createDocument(
    DATABASE_ID,
    collectionId,
    documentId || 'unique()',
    data
  );
}

/**
 * Helper function to update a document in an Appwrite collection
 */
export async function updateDocument(
  collectionId: string,
  documentId: string,
  data: any
) {
  return await databases.updateDocument(
    DATABASE_ID,
    collectionId,
    documentId,
    data
  );
}

/**
 * Helper function to delete a document from an Appwrite collection
 */
export async function deleteDocument(
  collectionId: string,
  documentId: string
) {
  return await databases.deleteDocument(
    DATABASE_ID,
    collectionId,
    documentId
  );
}

/**
 * Helper to build Appwrite queries (similar to Firebase where/orderBy)
 */
export const AppwriteQuery = Query;
