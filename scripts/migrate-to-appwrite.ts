import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const PAGES_DIR = join(process.cwd(), 'client/src/pages');

// Collection name mapping from Firebase to Appwrite
const COLLECTION_MAPPING: Record<string, string> = {
  'users': 'users',
  'payments': 'payments',
  'families': 'families',
  'messages': 'messages',
  'blog': 'blog-posts',
  'projects': 'projects',
  'budget_transactions': 'budget',
  'polls': 'polls',
  'votes': 'votes',
  'events': 'events',
  'advertisements': 'ads',
};

console.log('🔄 Migration des pages Firebase vers Appwrite...\n');

const pages = readdirSync(PAGES_DIR).filter(f => f.endsWith('.tsx'));

for (const page of pages) {
  const filePath = join(PAGES_DIR, page);
  let content = readFileSync(filePath, 'utf-8');
  let modified = false;

  // Skip if already migrated (contains 'listDocuments')
  if (content.includes('listDocuments') || content.includes('appwrite-helpers')) {
    console.log(`⏭️  ${page} - Déjà migré`);
    continue;
  }

  // Check if page uses Firebase
  if (!content.includes('getDocs') && !content.includes('collection(db')) {
    console.log(`⏭️  ${page} - Pas de code Firebase`);
    continue;
  }

  console.log(`🔧 Migration de ${page}...`);

  // Add imports at the top (after existing imports)
  if (!content.includes('appwrite-helpers')) {
    const importInsertionPoint = content.indexOf('import');
    const lastImportIndex = content.lastIndexOf('import');
    const endOfLastImport = content.indexOf('\n', lastImportIndex);
    
    const newImports = `import { listDocuments, createDocument, updateDocument, deleteDocument, AppwriteQuery } from '@/lib/appwrite-helpers';\n`;
    
    content = content.slice(0, endOfLastImport + 1) + newImports + content.slice(endOfLastImport + 1);
    modified = true;
  }

  // Remove db reference patterns
  content = content.replace(/const\s+db\s*=\s*[^;]+;?\n?/g, '');
  
  // Replace Firebase collection calls with Appwrite
  // Pattern: collection(db, "name")
  for (const [firebaseName, appwriteName] of Object.entries(COLLECTION_MAPPING)) {
    content = content.replace(new RegExp(`collection\\(db,\\s*["']${firebaseName}["']\\)`, 'g'), `"${appwriteName}"`);
  }

  // Replace getDocs patterns
  // Simple: getDocs(collection(...)) -> listDocuments(collection)
  content = content.replace(/getDocs\(\s*"([^"]+)"\s*\)/g, 'listDocuments("$1")');
  
  // With query: getDocs(query(...))
  content = content.replace(/getDocs\(\s*query\(/g, 'listDocuments(');
  
  // Replace query patterns
  // query("collection", where(...), orderBy(...))
  content = content.replace(/query\(\s*"([^"]+)"\s*,/g, '"$1", [');
  
  // Replace where clauses
  content = content.replace(/where\(\s*"([^"]+)"\s*,\s*"=="\s*,\s*([^)]+)\)/g, 'AppwriteQuery.equal("$1", $2)');
  content = content.replace(/where\(\s*"([^"]+)"\s*,\s*"!="\s*,\s*([^)]+)\)/g, 'AppwriteQuery.notEqual("$1", $2)');
  
  // Replace orderBy clauses
  content = content.replace(/orderBy\(\s*"([^"]+)"\s*,\s*"desc"\s*\)/g, 'AppwriteQuery.orderDesc("$1")');
  content = content.replace(/orderBy\(\s*"([^"]+)"\s*,\s*"asc"\s*\)/g, 'AppwriteQuery.orderAsc("$1")');
  content = content.replace(/orderBy\(\s*"([^"]+)"\s*\)/g, 'AppwriteQuery.orderDesc("$1")');
  
  // Replace limit
  content = content.replace(/limit\((\d+)\)/g, 'AppwriteQuery.limit($1)');
  
  // Close query arrays
  content = content.replace(/\]\s*\)/g, '])');
  
  // Replace .docs with .documents
  content = content.replace(/(\w+)\.docs\./g, '$1.documents.');
  content = content.replace(/(\w+)\.docs(\W)/g, '$1.documents$2');
  
  // Replace .size with .total
  content = content.replace(/\.size\b/g, '.total');
  
  // Replace snapshot.docs.map with snapshot.documents.map
  content = content.replace(/snapshot\.docs\.map/g, 'snapshot.documents.map');
  
  // Replace doc.data() with just the doc (Appwrite documents are plain objects)
  content = content.replace(/doc\.data\(\)/g, 'doc');
  
  // Replace doc.id with doc.$id
  content = content.replace(/doc\.id\b/g, 'doc.$id');

  // Remove Timestamp imports and references
  content = content.replace(/import\s+\{[^}]*Timestamp[^}]*\}\s+from\s+['"][^'"]+['"];?\n?/g, '');
  content = content.replace(/instanceof\s+Timestamp/g, 'false');
  content = content.replace(/new\s+Timestamp\([^)]+\)/g, 'new Date()');

  if (modified || content !== readFileSync(filePath, 'utf-8')) {
    writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ ${page} migré`);
  }
}

console.log('\n✅ Migration terminée!');
