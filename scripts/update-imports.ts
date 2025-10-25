import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const PAGES_DIR = join(process.cwd(), 'client/src/pages');

console.log('🔄 Mise à jour des imports Firebase vers firebase-compat...\n');

const pages = readdirSync(PAGES_DIR).filter(f => f.endsWith('.tsx') && !['LoginPage.tsx', 'RegisterPage.tsx', 'not-found.tsx'].includes(f));

for (const page of pages) {
  const filePath = join(PAGES_DIR, page);
  let content = readFileSync(filePath, 'utf-8');

  // Skip if already has firebase-compat import
  if (content.includes('firebase-compat')) {
    console.log(`⏭️  ${page} - Déjà mis à jour`);
    continue;
  }

  console.log(`🔧 Mise à jour de ${page}...`);

  // Find needed imports based on usage
  const imports: string[] = [];
  
  if (content.includes('collection(') || content.includes('collection("')) imports.push('collection');
  if (content.includes('query(')) imports.push('query');
  if (content.includes('where(')) imports.push('where');
  if (content.includes('orderBy(')) imports.push('orderBy');
  if (content.includes('limit(')) imports.push('limit');
  if (content.includes('getDocs(')) imports.push('getDocs');
  if (content.includes('getDoc(')) imports.push('getDoc');
  if (content.includes('addDoc(')) imports.push('addDoc');
  if (content.includes('setDoc(')) imports.push('setDoc');
  if (content.includes('updateDoc(')) imports.push('updateDoc');
  if (content.includes('deleteDoc(')) imports.push('deleteDoc');
  if (content.includes('doc(')) imports.push('doc');
  if (content.includes('serverTimestamp')) imports.push('serverTimestamp');
  if (content.includes('Timestamp')) imports.push('Timestamp');
  if (content.includes('arrayUnion')) imports.push('arrayUnion');
  if (content.includes('onSnapshot(')) imports.push('onSnapshot');
  if (content.includes('ref(') || content.includes('storage.ref')) imports.push('ref', 'storage');
  if (content.includes('uploadBytes(')) imports.push('uploadBytes');
  if (content.includes('getDownloadURL(')) imports.push('getDownloadURL');
  if (content.includes('deleteObject(')) imports.push('deleteObject');
  if (content.includes('.toDate()')) imports.push('toDate');
  
  // Add db if needed
  if (content.includes(' db') || content.includes('(db')) imports.push('db');

  if (imports.length === 0) {
    console.log(`⏭️  ${page} - Aucun import nécessaire`);
    continue;
  }

  // Remove duplicates
  const uniqueImports = [...new Set(imports)].sort();

  // Find where to insert import (after last import statement)
  const lastImportIndex = content.lastIndexOf('import');
  const endOfLastImport = content.indexOf('\n', lastImportIndex);
  
  const newImport = `import { ${uniqueImports.join(', ')} } from '@/lib/firebase-compat';\n`;
  
  content = content.slice(0, endOfLastImport + 1) + newImport + content.slice(endOfLastImport + 1);

  // Remove old Appwrite-specific imports if they were added by migration script
  content = content.replace(/import\s+\{\s*listDocuments[^}]*\}\s+from\s+['"]@\/lib\/appwrite-helpers['"];?\n?/g, '');

  writeFileSync(filePath, content, 'utf-8');
  console.log(`✅ ${page} mis à jour avec ${uniqueImports.length} imports`);
}

console.log('\n✅ Tous les imports mis à jour!');
