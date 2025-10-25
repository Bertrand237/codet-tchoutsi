import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Timestamp } from "firebase/firestore"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function convertToDate(value: any): Date {
  if (!value) {
    return new Date();
  }
  
  // Si c'est déjà une Date
  if (value instanceof Date) {
    return value;
  }
  
  // Si c'est un Timestamp Firestore
  if (value?.toDate && typeof value.toDate === 'function') {
    return value.toDate();
  }
  
  // Si c'est un objet Timestamp avec seconds
  if (value?.seconds) {
    return new Timestamp(value.seconds, value.nanoseconds || 0).toDate();
  }
  
  // Si c'est une string ISO
  if (typeof value === 'string') {
    return new Date(value);
  }
  
  // Par défaut
  return new Date();
}
