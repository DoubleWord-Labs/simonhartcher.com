#!/usr/bin/env bun

import fs from 'fs';
import path from 'path';

function convertToAssetImports(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  const imageImports = new Set<string>();
  let convertedContent = content;
  
  // Check if Image import already exists
  const hasImageImport = /import.*Image.*from.*astro:assets/.test(content);
  
  // Find all Image components using /blog/ paths
  const imageRegex = /<Image\s+src="\/blog\/([^"]+)"\s+alt="([^"]*)"\s*(?:width=\{[^}]+\}\s*)?(?:height=\{[^}]+\}\s*)?\/>/g;
  
  let match;
  while ((match = imageRegex.exec(content)) !== null) {
    const [fullMatch, imagePath, altText] = match;
    
    // Generate import name from image path
    const fileName = path.basename(imagePath);
    const baseName = fileName.replace(/\.(webp|jpg|jpeg|png|gif)$/i, '');
    const importName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
    
    // Add to imports
    imageImports.add(`import ${importName} from '../../../assets/${imagePath}';`);
    
    // Replace the Image component
    convertedContent = convertedContent.replace(fullMatch, `<Image src={${importName}} alt="${altText}" />`);
  }
  
  if (imageImports.size > 0) {
    // Find where frontmatter ends
    const frontmatterMatch = convertedContent.match(/^---\n.*?\n---\n/s);
    if (frontmatterMatch) {
      const frontmatterEnd = frontmatterMatch.index! + frontmatterMatch[0].length;
      
      // Add Image import if not present
      let importsToAdd = '';
      if (!hasImageImport) {
        importsToAdd += '\nimport { Image } from \'astro:assets\';\n';
      }
      
      // Add asset imports
      importsToAdd += [...imageImports].join('\n') + '\n';
      
      convertedContent = convertedContent.slice(0, frontmatterEnd) + 
        importsToAdd +
        convertedContent.slice(frontmatterEnd);
    }
  }
  
  return { converted: convertedContent, changed: imageImports.size > 0 };
}

function convertAllImages() {
  const blogDir = './src/content/blog';
  const files = fs.readdirSync(blogDir)
    .filter(file => file.endsWith('.mdx'));
  
  let convertedCount = 0;
  
  for (const file of files) {
    const filePath = path.join(blogDir, file);
    const { converted, changed } = convertToAssetImports(filePath);
    
    if (changed) {
      fs.writeFileSync(filePath, converted);
      console.log(`✅ Converted to asset imports in: ${file}`);
      convertedCount++;
    } else {
      console.log(`⏭️  No images to convert in: ${file}`);
    }
  }
  
  console.log(`\n🎉 Conversion complete! ${convertedCount} files updated.`);
}

// Run the conversion
if (import.meta.main) {
  convertAllImages();
}