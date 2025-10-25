/**
 * Firebase Compatibility Layer for Appwrite
 * 
 * This module provides a Firebase-like API that wraps Appwrite calls,
 * allowing existing code to work with minimal changes during migration.
 */

import { databases, storage as appwriteStorage, client as appwriteClient } from './appwrite';
import { Query, ID } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const STORAGE_BUCKET_ID = 'payment-proofs';

// ==================== Query Builder ====================

interface QueryConfig {
  collectionId: string;
  queries: string[];
}

export function collection(db: string, collectionId: string): string {
  return collectionId;
}

export function query(collectionId: string, ...queries: string[]): QueryConfig {
  return {
    collectionId,
    queries,
  };
}

export function where(field: string, op: string, value: any): string {
  switch (op) {
    case '==':
      return Query.equal(field, value);
    case '!=':
      return Query.notEqual(field, value);
    case '<':
      return Query.lessThan(field, value);
    case '<=':
      return Query.lessThanEqual(field, value);
    case '>':
      return Query.greaterThan(field, value);
    case '>=':
      return Query.greaterThanEqual(field, value);
    default:
      throw new Error(`Unsupported operator: ${op}`);
  }
}

export function orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): string {
  return direction === 'desc' ? Query.orderDesc(field) : Query.orderAsc(field);
}

export function limit(count: number): string {
  return Query.limit(count);
}

// ==================== Document Operations ====================

export interface DocumentSnapshot {
  documents: any[];
  total: number;
  size: number;  // Alias for total
}

export async function getDocs(queryOrCollection: QueryConfig | string): Promise<DocumentSnapshot> {
  let collectionId: string;
  let queries: string[] = [];

  if (typeof queryOrCollection === 'string') {
    collectionId = queryOrCollection;
  } else {
    collectionId = queryOrCollection.collectionId;
    queries = queryOrCollection.queries;
  }

  const result = await databases.listDocuments(DATABASE_ID, collectionId, queries);
  
  return {
    documents: result.documents,
    total: result.total,
    size: result.total,
  };
}

export function doc(collectionId: string, documentId?: string) {
  return {
    collectionId,
    id: documentId || ID.unique(),
  };
}

export async function getDoc(docRef: { collectionId: string; id: string }) {
  const result = await databases.getDocument(DATABASE_ID, docRef.collectionId, docRef.id);
  return {
    exists: () => !!result,
    data: () => result,
    id: result.$id,
  };
}

export async function addDoc(collectionId: string, data: any) {
  const docId = ID.unique();
  const result = await databases.createDocument(
    DATABASE_ID,
    collectionId,
    docId,
    data
  );
  return { id: result.$id };
}

export async function setDoc(docRef: { collectionId: string; id: string }, data: any) {
  await databases.createDocument(
    DATABASE_ID,
    docRef.collectionId,
    docRef.id,
    data
  );
}

export async function updateDoc(docRef: { collectionId: string; id: string } | string, data: any) {
  if (typeof docRef === 'string') {
    throw new Error('updateDoc requires a document reference with collectionId');
  }
  
  await databases.updateDocument(
    DATABASE_ID,
    docRef.collectionId,
    docRef.id,
    data
  );
}

export async function deleteDoc(docRef: { collectionId: string; id: string }) {
  await databases.deleteDocument(
    DATABASE_ID,
    docRef.collectionId,
    docRef.id
  );
}

// Helper for array operations (Firebase arrayUnion equivalent)
export function arrayUnion(...elements: any[]) {
  return elements;
}

// ==================== Storage Operations ====================

export function ref(storageRef: any, path: string) {
  return { path, bucket: STORAGE_BUCKET_ID, fileId: undefined as string | undefined };
}

export async function uploadBytes(fileRef: { path: string; bucket: string; fileId?: string }, file: File) {
  const fileId = ID.unique();
  const uploadResult = await appwriteStorage.createFile(fileRef.bucket, fileId, file);
  // Update the ref with fileId so getDownloadURL can use it
  fileRef.fileId = uploadResult.$id;
  return { 
    ref: { ...fileRef, fileId: uploadResult.$id },
    metadata: uploadResult
  };
}

export async function getDownloadURL(fileRef: { path: string; bucket: string; fileId?: string }) {
  if (!fileRef.fileId) {
    throw new Error('File ID is required to get download URL');
  }
  
  const result = appwriteStorage.getFileView(fileRef.bucket, fileRef.fileId);
  return result;
}

export async function deleteObject(fileRef: { bucket: string; fileId: string }) {
  await appwriteStorage.deleteFile(fileRef.bucket, fileRef.fileId);
}

// ==================== Real-time Subscriptions ====================

export function onSnapshot(
  queryOrCollection: QueryConfig | string,
  callback: (snapshot: DocumentSnapshot) => void
) {
  let collectionId: string;
  
  if (typeof queryOrCollection === 'string') {
    collectionId = queryOrCollection;
  } else {
    collectionId = queryOrCollection.collectionId;
  }

  // Initial fetch
  getDocs(queryOrCollection).then(callback);

  // Subscribe to real-time updates
  const unsubscribe = appwriteClient.subscribe(
    `databases.${DATABASE_ID}.collections.${collectionId}.documents`,
    (response) => {
      // Refetch on any change
      getDocs(queryOrCollection).then(callback);
    }
  );

  return unsubscribe;
}

// ==================== Timestamp Helpers ====================

export class Timestamp {
  constructor(public seconds: number, public nanoseconds: number = 0) {}

  toDate(): Date {
    return new Date(this.seconds * 1000);
  }

  static fromDate(date: Date): Timestamp {
    return new Timestamp(Math.floor(date.getTime() / 1000), 0);
  }

  static now(): Timestamp {
    return Timestamp.fromDate(new Date());
  }
}

export function serverTimestamp() {
  return new Date().toISOString();
}

// Helper to convert any timestamp format to Date
export function toDate(value: any): Date {
  if (!value) {
    return new Date();
  }
  
  if (value instanceof Date) {
    return value;
  }
  
  if (value instanceof Timestamp) {
    return value.toDate();
  }
  
  if (typeof value === 'string') {
    return new Date(value);
  }
  
  if (typeof value === 'number') {
    return new Date(value);
  }
  
  if (value?.seconds) {
    return new Timestamp(value.seconds, value.nanoseconds || 0).toDate();
  }
  
  return new Date();
}

// ==================== Mock Storage Reference ====================

export const storage = {
  ref: (path: string) => ref(null, path),
};

// Export a mock db for compatibility
export const db = 'appwrite';
