#!/usr/bin/env bun

import fs from 'fs';
import path from 'path';

function fixAssetImports(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  let convertedContent = content;
  
  // Replace all import paths that use '../../../assets/' with '@assets/'
  convertedContent = convertedContent.replace(
    /import\s+([^']+)\s+from\s+['"]\.\.\/\.\.\/\.\.\/assets\/([^'"]+)['"];?/g,
    "import $1 from '@assets/$2';"
  );
  
  return { converted: convertedContent, changed: convertedContent !== content };
}

function fixAllAssetImports() {
  const blogDir = './src/content/blog';
  const files = fs.readdirSync(blogDir)
    .filter(file => file.endsWith('.mdx'));
  
  let convertedCount = 0;
  
  for (const file of files) {
    const filePath = path.join(blogDir, file);
    const { converted, changed } = fixAssetImports(filePath);
    
    if (changed) {
      fs.writeFileSync(filePath, converted);
      console.log(`✅ Fixed asset imports in: ${file}`);
      convertedCount++;
    } else {
      console.log(`⏭️  No imports to fix in: ${file}`);
    }
  }
  
  console.log(`\n🎉 Fixed imports complete! ${convertedCount} files updated.`);
}

// Run the fix
if (import.meta.main) {
  fixAllAssetImports();
}