/**
 * Couche de données Appwrite
 * Fournit une API simplifiée pour les opérations CRUD sur les collections Appwrite.
 */

import { databases, storage as appwriteStorage, client as appwriteClient } from './appwrite';
import { Query, ID } from 'appwrite';

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'codet-db';
const STORAGE_BUCKET_ID = 'payment-proofs';

interface QueryConfig {
  collectionId: string;
  queries: string[];
}

export function collection(_db: string, collectionId: string): string {
  return collectionId;
}

export function query(collectionId: string, ...queries: string[]): QueryConfig {
  return { collectionId, queries };
}

export function where(field: string, op: string, value: any): string {
  switch (op) {
    case '==': return Query.equal(field, value);
    case '!=': return Query.notEqual(field, value);
    case '<': return Query.lessThan(field, value);
    case '<=': return Query.lessThanEqual(field, value);
    case '>': return Query.greaterThan(field, value);
    case '>=': return Query.greaterThanEqual(field, value);
    default: throw new Error(`Unsupported operator: ${op}`);
  }
}

export function orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): string {
  return direction === 'desc' ? Query.orderDesc(field) : Query.orderAsc(field);
}

export function limit(count: number): string {
  return Query.limit(count);
}

export interface DocumentSnapshot {
  documents: any[];
  total: number;
  size: number;
}

export async function getDoc(docRef: { collectionId: string; id: string }): Promise<Record<string, unknown>> {
  const result = await databases.getDocument(DATABASE_ID, docRef.collectionId, docRef.id);
  return result as unknown as Record<string, unknown>;
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
  return { documents: result.documents, total: result.total, size: result.total };
}

export function doc(collectionId: string, documentId?: string) {
  return { collectionId, id: documentId || ID.unique() };
}

export async function addDoc(collectionId: string, data: any) {
  const docId = ID.unique();
  const result = await databases.createDocument(DATABASE_ID, collectionId, docId, data);
  return { id: result.$id };
}

export async function updateDoc(docRef: { collectionId: string; id: string }, data: any) {
  await databases.updateDocument(DATABASE_ID, docRef.collectionId, docRef.id, data);
}

export async function deleteDoc(docRef: { collectionId: string; id: string }) {
  await databases.deleteDocument(DATABASE_ID, docRef.collectionId, docRef.id);
}

export function arrayUnion(...elements: any[]) {
  return elements;
}

// ==================== Storage ====================

export function ref(_storageRef: any, path: string) {
  return { path, bucket: STORAGE_BUCKET_ID, fileId: undefined as string | undefined };
}

export async function uploadBytes(fileRef: { path: string; bucket: string; fileId?: string }, file: File) {
  const fileId = ID.unique();
  const uploadResult = await appwriteStorage.createFile(fileRef.bucket, fileId, file);
  fileRef.fileId = uploadResult.$id;
  return { ref: { ...fileRef, fileId: uploadResult.$id }, metadata: uploadResult };
}

export function uploadBytesResumable(fileRef: { path: string; bucket: string; fileId?: string }, file: File) {
  const fileId = ID.unique();
  let uploadProgress = 0;
  const listeners: { [key: string]: any[] } = { state_changed: [], complete: [], error: [] };

  const uploadTask = {
    on: (event: string, progressCallback?: (snapshot: any) => void, errorCallback?: (error: any) => void, completeCallback?: () => void) => {
      if (event === 'state_changed') {
        if (progressCallback) listeners.state_changed.push(progressCallback);
        if (errorCallback) listeners.error.push(errorCallback);
        if (completeCallback) listeners.complete.push(completeCallback);
      }
      return uploadTask;
    },
    then: (successCallback?: (snapshot: any) => void, errorCallback?: (error: any) => void) => {
      return uploadPromise.then(successCallback, errorCallback);
    },
    catch: (errorCallback: (error: any) => void) => {
      return uploadPromise.catch(errorCallback);
    }
  };

  const uploadPromise = (async () => {
    let progressInterval: ReturnType<typeof setInterval> | null = null;
    try {
      progressInterval = setInterval(() => {
        if (uploadProgress < 90) {
          uploadProgress += 10;
          listeners.state_changed.forEach(cb => cb({
            bytesTransferred: (file.size * uploadProgress) / 100,
            totalBytes: file.size,
            state: 'running',
            ref: fileRef
          }));
        }
      }, 100);

      const uploadResult = await appwriteStorage.createFile(fileRef.bucket, fileId, file);
      if (progressInterval) clearInterval(progressInterval);
      uploadProgress = 100;
      listeners.state_changed.forEach(cb => cb({
        bytesTransferred: file.size,
        totalBytes: file.size,
        state: 'success',
        ref: fileRef
      }));

      fileRef.fileId = uploadResult.$id;
      const snapshot = { ref: { ...fileRef, fileId: uploadResult.$id }, metadata: uploadResult };
      listeners.complete.forEach(cb => cb());
      return snapshot;
    } catch (error) {
      if (progressInterval) clearInterval(progressInterval);
      listeners.error.forEach(cb => cb(error));
      throw error;
    }
  })();

  return uploadTask;
}

export async function getDownloadURL(fileRef: { path: string; bucket: string; fileId?: string }) {
  if (!fileRef.fileId) throw new Error('File ID is required to get download URL');
  return appwriteStorage.getFileView(fileRef.bucket, fileRef.fileId);
}

export function toDate(value: any): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value === 'string') return new Date(value);
  if (typeof value === 'number') return new Date(value);
  if (value?.seconds) return new Date(value.seconds * 1000);
  return new Date();
}

export class Timestamp {
  constructor(public seconds: number, public nanoseconds: number = 0) {}
  toDate(): Date { return new Date(this.seconds * 1000); }
  static fromDate(date: Date): Timestamp { return new Timestamp(Math.floor(date.getTime() / 1000), 0); }
  static now(): Timestamp { return Timestamp.fromDate(new Date()); }
}

export function serverTimestamp() {
  return new Date().toISOString();
}

export const storageObj = {
  ref: (path: string) => ref(null, path),
};

export const db = 'appwrite';
