#!/usr/bin/env bun

import fs from 'fs';
import path from 'path';

function convertImages(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  let needsImageImport = false;
  let convertedContent = content;
  
  // Check if Image import already exists
  const hasImageImport = /import.*Image.*from.*astro:assets/.test(content);
  
  // Convert HTML code blocks with picture elements to Astro Image components
  convertedContent = convertedContent.replace(/```html\n(<picture>.*?<\/picture>)\n```/g, (match, pictureHtml) => {
    // Extract the main image src from the picture element
    const imgMatch = pictureHtml.match(/<img src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/);
    if (imgMatch) {
      const [, src, alt] = imgMatch;
      
      // Convert the src path to the correct format
      const cleanSrc = src.replace('/..', '').replace('/posts/', '/blog/');
      needsImageImport = true;
      
      // Return Astro Image component with dimensions
      // Most images in the blog are xlarge (1800x1200) but we'll use reasonable defaults
      return `<Image src="${cleanSrc}" alt="${alt}" width={800} height={533} />`;
    }
    
    // If we can't parse it, return as-is
    return match;
  });
  
  // Add Image import at the top if needed and not already present
  if (needsImageImport && !hasImageImport) {
    // Find where frontmatter ends
    const frontmatterMatch = convertedContent.match(/^---\n.*?\n---\n/s);
    if (frontmatterMatch) {
      const frontmatterEnd = frontmatterMatch.index! + frontmatterMatch[0].length;
      convertedContent = convertedContent.slice(0, frontmatterEnd) + 
        '\nimport { Image } from \'astro:assets\';\n' +
        convertedContent.slice(frontmatterEnd);
    }
  }
  
  return { converted: convertedContent, changed: needsImageImport };
}

function convertAllImages() {
  const blogDir = './src/content/blog';
  const files = fs.readdirSync(blogDir)
    .filter(file => file.endsWith('.mdx'));
  
  let convertedCount = 0;
  
  for (const file of files) {
    const filePath = path.join(blogDir, file);
    const { converted, changed } = convertImages(filePath);
    
    if (changed) {
      fs.writeFileSync(filePath, converted);
      console.log(`✅ Converted images in: ${file}`);
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