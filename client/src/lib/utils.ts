import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function convertToDate(value: any): Date {
  if (!value) {
    return new Date();
  }
  
  if (value instanceof Date) {
    return value;
  }
  
  if (typeof value === 'string') {
    return new Date(value);
  }
  
  if (typeof value === 'number') {
    return new Date(value);
  }
  
  return new Date();
}
