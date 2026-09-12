/**
 * Couche de compatibilité Appwrite
 * Remplace les imports Firebase par Appwrite
 * 
 * ✅ À utiliser à la place de firebase-compat
 */

import { databases, DATABASE_ID, COLLECTIONS } from './appwrite';
import { Query } from 'appwrite';

export const db = null; // Non utilisé avec Appwrite

/**
 * Récupère une référence de collection
 */
export function collection(_db: any, collectionName: string) {
  // Mapper les noms Firebase aux noms Appwrite
  const collectionMap: Record<string, string> = {
    'users': COLLECTIONS.USERS,
    'payments': COLLECTIONS.PAYMENTS,
    'families': COLLECTIONS.FAMILIES,
    'messages': COLLECTIONS.MESSAGES,
    'blog-posts': COLLECTIONS.BLOG_POSTS,
    'projects': COLLECTIONS.PROJECTS,
    'budget': COLLECTIONS.BUDGET,
    'ads': COLLECTIONS.ADS,
    'blog-videos': COLLECTIONS.BLOG_VIDEOS,
    'polls': COLLECTIONS.POLLS,
    'votes': COLLECTIONS.VOTES,
    'events': COLLECTIONS.EVENTS,
  };
  
  return collectionMap[collectionName] || collectionName;
}

/**
 * Récupère les documents d'une collection
 */
export async function getDocs(queryObj: any) {
  if (!queryObj) return { documents: [], total: 0 };
  
  // Si c'est une requête simple (juste une collection)
  if (queryObj.collection && !queryObj.queries) {
    return databases.listDocuments(DATABASE_ID, queryObj.collection);
  }
  
  // Si c'est une requête avec filtres
  if (queryObj.collection && queryObj.queries) {
    return databases.listDocuments(DATABASE_ID, queryObj.collection, queryObj.queries);
  }
  
  return { documents: [], total: 0 };
}

/**
 * Construit une requête avec filtres
 */
export function query(
  collectionRef: string,
  ...constraints: any[]
) {
  return {
    collection: collectionRef,
    queries: constraints.filter(c => c),
  };
}

/**
 * Filtre WHERE
 */
export function where(
  fieldPath: string,
  opStr: string,
  value: any
) {
  if (opStr === '==') {
    return Query.equal(fieldPath, value);
  }
  if (opStr === '!=') {
    return Query.notEqual(fieldPath, value);
  }
  if (opStr === '<') {
    return Query.lessThan(fieldPath, value);
  }
  if (opStr === '<=') {
    return Query.lessThanEqual(fieldPath, value);
  }
  if (opStr === '>') {
    return Query.greaterThan(fieldPath, value);
  }
  if (opStr === '>=') {
    return Query.greaterThanEqual(fieldPath, value);
  }
  if (opStr === 'in') {
    return Query.equal(fieldPath, value);
  }
  
  return Query.equal(fieldPath, value);
}

/**
 * Tri (ORDER BY)
 */
export function orderBy(
  fieldPath: string,
  directionStr?: 'asc' | 'desc'
) {
  const direction = directionStr || 'asc';
  return direction === 'desc' 
    ? Query.orderDesc(fieldPath)
    : Query.orderAsc(fieldPath);
}

/**
 * Limite le nombre de résultats
 */
export function limit(n: number) {
  return Query.limit(n);
}

/**
 * Convertit un timestamp Firebase en Date
 */
export function toDate(timestamp: any) {
  if (!timestamp) return new Date();
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  if (typeof timestamp === 'number') {
    return new Date(timestamp);
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return new Date();
}

export default {
  db,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  toDate,
};
