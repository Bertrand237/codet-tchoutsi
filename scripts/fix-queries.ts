import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const PAGES_DIR = join(process.cwd(), 'client/src/pages');

console.log('🔧 Correction des queries Appwrite...\n');

const pages = readdirSync(PAGES_DIR).filter(f => f.endsWith('.tsx') && !['LoginPage.tsx', 'RegisterPage.tsx', 'not-found.tsx', 'DashboardPage.tsx'].includes(f));

for (const page of pages) {
  const filePath = join(PAGES_DIR, page);
  let content = readFileSync(filePath, 'utf-8');
  let modified = false;

  // Skip if no listDocuments
  if (!content.includes('listDocuments')) {
    console.log(`⏭️  ${page} - Pas de queries Appwrite`);
    continue;
  }

  console.log(`🔧 Correction de ${page}...`);

  // Fix: listDocuments("x", Query...)) -> listDocuments("x", [Query...])
  // Pattern 1: Single query with extra ))
  content = content.replace(/listDocuments\(("[^"]+"),\s*(AppwriteQuery\.[^)]+)\)\)/g, 'listDocuments($1, [$2])');
  
  // Pattern 2: Multiple queries with extra ))
  let previousContent = '';
  while (previousContent !== content) {
    previousContent = content;
    content = content.replace(/listDocuments\(("[^"]+"),\s*([^)]+),\s*([^)]+)\)\)/g, 'listDocuments($1, [$2, $3])');
  }
  
  // Fix: data.X false patterns (from bad Timestamp replacement)
  content = content.replace(/(\w+)\.(\w+)\s+false\s*\?\s*\1\.\2\.toDate\(\)\s*:\s*/g, '');
  content = content.replace(/instanceof\s+false/g, '');

  if (content !== readFileSync(filePath, 'utf-8')) {
    writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ ${page} corrigé`);
    modified = true;
  } else {
    console.log(`⏭️  ${page} - Pas de changements`);
  }
}

console.log('\n✅ Correction terminée!');
