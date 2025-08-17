#!/usr/bin/env bun

import fs from 'fs';
import path from 'path';

function fixCoverPaths(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  let convertedContent = content;
  
  // Replace /posts/ with /blog/ in frontmatter cover fields
  convertedContent = convertedContent.replace(
    /cover:\s*["']\/posts\/([^"']+)["']/g,
    'cover: "/blog/$1"'
  );
  
  return { converted: convertedContent, changed: convertedContent !== content };
}

function fixAllCoverPaths() {
  const blogDir = './src/content/blog';
  const files = fs.readdirSync(blogDir)
    .filter(file => file.endsWith('.mdx'));
  
  let convertedCount = 0;
  
  for (const file of files) {
    const filePath = path.join(blogDir, file);
    const { converted, changed } = fixCoverPaths(filePath);
    
    if (changed) {
      fs.writeFileSync(filePath, converted);
      console.log(`✅ Fixed cover paths in: ${file}`);
      convertedCount++;
    } else {
      console.log(`⏭️  No cover paths to fix in: ${file}`);
    }
  }
  
  console.log(`\n🎉 Cover path fixes complete! ${convertedCount} files updated.`);
}

// Run the fix
if (import.meta.main) {
  fixAllCoverPaths();
}