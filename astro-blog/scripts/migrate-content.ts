#!/usr/bin/env bun

import fs from 'fs';
import path from 'path';

interface ZineFrontmatter {
  date: string;
  title: string;
  description?: string;
  tags: string[];
  author: string;
  layout: string;
  draft?: boolean;
  aliases?: string[];
  custom?: {
    cover?: string;
    preview?: string;
    featured?: boolean;
  };
}

interface AstroFrontmatter {
  title: string;
  description: string;
  date: Date;
  author: string;
  tags: string[];
  cover?: string;
  preview?: string;
  featured?: boolean;
  draft?: boolean;
}

function parseZineFrontmatter(content: string): { frontmatter: ZineFrontmatter; body: string } {
  // Try with double newline first, then single newline
  let match = content.match(/^---\n([\s\S]*?)\n---\n\n([\s\S]*)$/);
  if (!match) {
    match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  }
  if (!match) {
    throw new Error('Invalid frontmatter format');
  }

  const [, frontmatterText, body] = match;
  
  // Parse Zine's custom frontmatter format
  const frontmatter: any = {};
  
  // Simple parser for Zine's .key = value format
  const lines = frontmatterText.split('\n').filter(line => line.trim());
  let currentObject = frontmatter;
  let objectStack: any[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('.') && trimmed.includes(' = ')) {
      const [key, ...valueParts] = trimmed.split(' = ');
      const cleanKey = key.substring(1); // remove leading dot
      const value = valueParts.join(' = ');
      
      if (value === '{') {
        // Start of nested object
        currentObject[cleanKey] = {};
        objectStack.push(currentObject);
        currentObject = currentObject[cleanKey];
      } else if (value.startsWith('"') && value.endsWith('",') || value.startsWith('"') && value.endsWith('"')) {
        // String value
        currentObject[cleanKey] = value.replace(/^"|",$|"$/g, '');
      } else if (value.startsWith('[') && value.endsWith('],') || value.startsWith('[') && value.endsWith(']')) {
        // Array value
        const arrayContent = value.replace(/^\[|\],$|\]$/g, '');
        currentObject[cleanKey] = arrayContent.split(',').map(item => item.trim().replace(/^"|"$/g, ''));
      } else if (value === 'true,' || value === 'true') {
        currentObject[cleanKey] = true;
      } else if (value === 'false,' || value === 'false') {
        currentObject[cleanKey] = false;
      } else {
        // Default to string, removing trailing comma
        currentObject[cleanKey] = value.replace(/,$/, '');
      }
    } else if (trimmed === '},') {
      // End of nested object
      currentObject = objectStack.pop() || frontmatter;
    }
  }
  
  return { frontmatter, body };
}

function convertToAstroFrontmatter(zineFm: ZineFrontmatter): AstroFrontmatter {
  return {
    title: zineFm.title,
    description: zineFm.description || '',
    date: new Date(zineFm.date),
    author: zineFm.author || 'Simon Hartcher',
    tags: zineFm.tags || [],
    cover: zineFm.custom?.cover?.match(/src='([^']*)'/)?.at(1)?.replace('/..', ''),
    preview: zineFm.custom?.preview,
    featured: zineFm.custom?.featured || false,
    draft: zineFm.draft || false,
  };
}

function processImages(content: string): string {
  // Convert HTML picture elements from code blocks to Astro Image components
  let processedContent = content;
  
  // Extract image imports that will be needed
  const imageImports = new Set<string>();
  let needsImageImport = false;
  
  // Find HTML code blocks with picture elements (these were Zine's =html blocks)
  processedContent = processedContent.replace(/```html\n(<picture>.*?<\/picture>)\n```/g, (match, pictureHtml) => {
    // Extract the main image src from the picture element
    const imgMatch = pictureHtml.match(/<img src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/);
    if (imgMatch) {
      const [, src, alt] = imgMatch;
      
      // Convert the src path to the correct format
      const cleanSrc = src.replace('/..', '').replace('/posts/', '/blog/');
      needsImageImport = true;
      
      // Return Astro Image component
      return `<Image src="${cleanSrc}" alt="${alt}" />`;
    }
    
    // If we can't parse it, return as-is
    return match;
  });
  
  // Fix code block language issues
  processedContent = processedContent
    // Replace =html with html for remaining code blocks
    .replace(/```=html/g, '```html')
    // Replace c-sharp with csharp
    .replace(/```c-sharp/g, '```csharp')
    // Fix any unclosed HTML tags in code blocks by converting them to code blocks
    .replace(/<head>/g, '`<head>`')
    .replace(/<\/head>/g, '`</head>`')
    // Fix any other problematic HTML tags
    .replace(/<meta([^>]*)>/g, '`<meta$1>`')
    .replace(/<link([^>]*)>/g, '`<link$1>`')
    .replace(/<script([^>]*)>/g, '`<script$1>`')
    .replace(/<\/script>/g, '`</script>`');
  
  // Add Image import at the top if needed
  if (needsImageImport) {
    processedContent = `import { Image } from 'astro:assets';\n\n${processedContent}`;
  }
    
  return processedContent;
}

function convertToMDX(smdPath: string, outputDir: string): void {
  const content = fs.readFileSync(smdPath, 'utf-8');
  const { frontmatter: zineFm, body } = parseZineFrontmatter(content);
  const astroFm = convertToAstroFrontmatter(zineFm);
  
  // Convert body content
  const processedBody = processImages(body);
  
  // Generate YAML frontmatter
  const yamlFrontmatter = [
    '---',
    `title: "${astroFm.title}"`,
    `description: "${astroFm.description}"`,
    `date: ${astroFm.date.toISOString()}`,
    `author: "${astroFm.author}"`,
    `tags: [${astroFm.tags.map(tag => `"${tag}"`).join(', ')}]`,
    astroFm.cover ? `cover: "${astroFm.cover}"` : '',
    astroFm.preview ? `preview: "${astroFm.preview}"` : '',
    `featured: ${astroFm.featured}`,
    `draft: ${astroFm.draft}`,
    '---',
    '',
    processedBody
  ].filter(Boolean).join('\n');
  
  // Generate output filename
  const basename = path.basename(smdPath, '.smd');
  const outputPath = path.join(outputDir, `${basename}.mdx`);
  
  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true });
  
  // Write the converted file
  fs.writeFileSync(outputPath, yamlFrontmatter);
  console.log(`Converted: ${smdPath} → ${outputPath}`);
}

function migrateContent() {
  const sourceDir = '../content/posts';
  const outputDir = './src/content/blog';
  const pagesSourceDir = '../content';
  const pagesOutputDir = './src/content/pages';
  
  // Migrate blog posts
  const postFiles = fs.readdirSync(sourceDir)
    .filter(file => file.endsWith('.smd')); // Migrate all posts
  
  console.log('Migrating blog posts...');
  for (const file of postFiles) {
    const fullPath = path.join(sourceDir, file);
    convertToMDX(fullPath, outputDir);
  }
  
  // Migrate pages (about, contact, etc.)
  const pageFiles = ['about.smd', 'contact.smd', 'subscribe.smd']
    .filter(file => fs.existsSync(path.join(pagesSourceDir, file)));
  
  console.log('Migrating pages...');
  for (const file of pageFiles) {
    const fullPath = path.join(pagesSourceDir, file);
    convertToMDX(fullPath, pagesOutputDir);
  }
  
  console.log('Migration complete!');
}

// Run the migration
if (import.meta.main) {
  migrateContent();
}

export { convertToMDX, migrateContent };