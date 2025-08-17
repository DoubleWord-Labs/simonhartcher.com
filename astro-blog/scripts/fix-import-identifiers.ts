#!/usr/bin/env bun

import fs from 'fs';
import path from 'path';

function fixImportIdentifiers(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  let convertedContent = content;
  
  // Find all import statements and fix identifiers that start with numbers
  convertedContent = convertedContent.replace(
    /import\s+([0-9][a-zA-Z0-9_]*)\s+from\s+(['"]@assets\/[^'"]+['"];?)/g,
    'import img_$1 from $2'
  );
  
  // Also update the usage in Image components to match the new identifier names
  convertedContent = convertedContent.replace(
    /<Image\s+src=\{([0-9][a-zA-Z0-9_]*)\}\s+alt="([^"]*)"\s*\/>/g,
    '<Image src={img_$1} alt="$2" />'
  );
  
  return { converted: convertedContent, changed: convertedContent !== content };
}

function fixAllImportIdentifiers() {
  const blogDir = './src/content/blog';
  const files = fs.readdirSync(blogDir)
    .filter(file => file.endsWith('.mdx'));
  
  let convertedCount = 0;
  
  for (const file of files) {
    const filePath = path.join(blogDir, file);
    const { converted, changed } = fixImportIdentifiers(filePath);
    
    if (changed) {
      fs.writeFileSync(filePath, converted);
      console.log(`✅ Fixed import identifiers in: ${file}`);
      convertedCount++;
    } else {
      console.log(`⏭️  No identifiers to fix in: ${file}`);
    }
  }
  
  console.log(`\n🎉 Import identifier fixes complete! ${convertedCount} files updated.`);
}

// Run the fix
if (import.meta.main) {
  fixAllImportIdentifiers();
}