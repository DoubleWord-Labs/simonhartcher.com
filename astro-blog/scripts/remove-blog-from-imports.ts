#!/usr/bin/env bun

import fs from 'fs';
import path from 'path';

function removeBlogFromImports(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  let convertedContent = content;
  
  // Replace '@assets/blog/' with '@assets/' in import statements
  convertedContent = convertedContent.replace(
    /import\s+([^']+)\s+from\s+['"]@assets\/blog\/([^'"]+)['"];?/g,
    "import $1 from '@assets/$2';"
  );
  
  return { converted: convertedContent, changed: convertedContent !== content };
}

function removeAllBlogFromImports() {
  const blogDir = './src/content/blog';
  const files = fs.readdirSync(blogDir)
    .filter(file => file.endsWith('.mdx'));
  
  let convertedCount = 0;
  
  for (const file of files) {
    const filePath = path.join(blogDir, file);
    const { converted, changed } = removeBlogFromImports(filePath);
    
    if (changed) {
      fs.writeFileSync(filePath, converted);
      console.log(`✅ Removed /blog/ from imports in: ${file}`);
      convertedCount++;
    } else {
      console.log(`⏭️  No blog paths to fix in: ${file}`);
    }
  }
  
  console.log(`\n🎉 Blog path removal complete! ${convertedCount} files updated.`);
}

// Run the fix
if (import.meta.main) {
  removeAllBlogFromImports();
}