import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const PAGES_DIR = join(process.cwd(), 'client/src/pages');

console.log('🔧 Correction des dates et timestamps...\n');

const pages = readdirSync(PAGES_DIR).filter(f => f.endsWith('.tsx'));

for (const page of pages) {
  const filePath = join(PAGES_DIR, page);
  let content = readFileSync(filePath, 'utf-8');
  const original = content;

  // Fix "field false" patterns (from bad Timestamp migration)
  content = content.replace(/(\w+)\s+false/g, '$1');
  
  // Fix convertToDate functions - they're not needed anymore, we have toDate()
  // Remove local convertToDate functions
  const convertToDatePattern = /const convertToDate = \(field: any\): Date => \{[^}]+\};?\n*/g;
  content = content.replace(convertToDatePattern, '');
  
  // Replace .toDate() calls with toDate()
  // Pattern: something.field?.toDate() -> toDate(something.field)
  content = content.replace(/(\w+)\.(\w+)\?\.toDate\(\)/g, 'toDate($1.$2)');
  
  // Pattern: data.field.toDate() -> toDate(data.field)
  content = content.replace(/(\w+)\.(\w+)\.toDate\(\)/g, 'toDate($1.$2)');
  
  // Replace convertToDate(x) with toDate(x)
  content = content.replace(/convertToDate\(/g, 'toDate(');

  if (content !== original) {
    writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ ${page} corrigé`);
  } else {
    console.log(`⏭️  ${page} - Pas de changements`);
  }
}

console.log('\n✅ Correction des dates terminée!');
