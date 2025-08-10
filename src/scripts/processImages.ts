import { ImageTransformer } from "./lib/images";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { difference } from "ramda";

// Security constants
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB limit for content files
const MAX_IMAGE_SIZE = 100 * 1024 * 1024; // 100MB limit for images
const MAX_FILES = 1000; // Maximum number of files to process

// Security utility functions
const sanitizePath = (inputPath: string): string => {
  // Remove any directory traversal attempts and normalize
  const normalized = path.normalize(inputPath);
  // Remove leading ../ sequences
  return normalized.replace(/^(\.\.[/\\])+/, '');
};

const isPathSafe = (filePath: string, allowRelativeUp: boolean = false): boolean => {
  // Check for null bytes (always dangerous)
  if (filePath.includes('\0')) {
    return false;
  }
  
  // For existing HTML assets, we need to allow some relative paths
  if (allowRelativeUp) {
    // Still block dangerous patterns but allow legitimate ../posts/ paths
    if (filePath.includes('../../') || filePath.includes('..\\..\\')) {
      return false; // Block traversal beyond one level
    }
    // Block absolute paths
    if (path.isAbsolute(filePath)) {
      return false;
    }
    return true;
  }
  
  // For new file scanning, be strict
  if (filePath.includes('..') || path.isAbsolute(filePath)) {
    return false;
  }
  return true;
};

const validateFileSize = (filePath: string, maxSize: number): boolean => {
  try {
    const stats = fs.statSync(filePath);
    return stats.size <= maxSize;
  } catch {
    return false;
  }
};

const config = {
  contentDir: "content",
  postsDir: "content/posts",
  assetsDir: "assets/",
  defaultAuthor: "Simon Hartcher",
  sourceImageDirs: [
    "content/images",
    "content/posts/images", 
    "content/pages/images"
  ]
};

fs.mkdirSync(config.postsDir, { recursive: true });
fs.mkdirSync(config.assetsDir, { recursive: true });

// Track existing files for future cleanup (disabled for now)
const existingFiles = new Set<string>();
try {
  fs.readdirSync(config.assetsDir, { recursive: true, encoding: "utf8" }).forEach(
    (file) => {
      const fullPath = path.join(config.assetsDir, file);
      try {
        if (fs.statSync(fullPath).isFile()) {
          existingFiles.add(fullPath);
        }
      } catch {
        // Ignore files that can't be statted
      }
    }
  );
} catch (error) {
  console.warn("Could not read assets directory:", error);
}

// Track referenced files
const referencedFiles = new Set<string>();
referencedFiles.add(path.join(config.assetsDir, "styles.css"));
referencedFiles.add(path.join(config.assetsDir, "styles.min.css"));
referencedFiles.add(path.join(config.assetsDir, "pico.violet.min.css"));
referencedFiles.add(path.join(config.assetsDir, "main.min.js"));

console.log("Starting local image processing...");

// Find all source images in designated directories
const sourceImages = new Map<string, string>(); // imageName -> fullPath

config.sourceImageDirs.forEach(sourceDir => {
  if (fs.existsSync(sourceDir)) {
    console.log(`Scanning ${sourceDir} for images...`);
    
    try {
      const files = fs.readdirSync(sourceDir, { recursive: true, encoding: "utf8" });
      
      // Limit number of files processed for security
      if (files.length > MAX_FILES) {
        console.warn(`Warning: Directory ${sourceDir} contains ${files.length} files, processing first ${MAX_FILES}`);
        files.splice(MAX_FILES);
      }
      
      files.forEach(file => {
        // Security: Validate file path for directory traversal
        if (!isPathSafe(file)) {
          console.warn(`Skipping potentially unsafe path: ${file}`);
          return;
        }
        
        const sanitizedFile = sanitizePath(file);
        const fullPath = path.join(sourceDir, sanitizedFile);
        
        try {
          const stat = fs.statSync(fullPath);
          
          if (stat.isFile() && /\.(jpg|jpeg|png|webp|gif)$/i.test(sanitizedFile)) {
            // Security: Check image file size
            if (!validateFileSize(fullPath, MAX_IMAGE_SIZE)) {
              console.warn(`Skipping large image file: ${sanitizedFile} (>${MAX_IMAGE_SIZE / 1024 / 1024}MB)`);
              return;
            }
            
            const imageName = path.basename(sanitizedFile);
            sourceImages.set(imageName, fullPath);
            console.log(`Found image: ${imageName} at ${fullPath}`);
          }
        } catch (error) {
          console.warn(`Could not process file ${sanitizedFile}:`, error.message);
        }
      });
    } catch (error) {
      console.warn(`Could not read directory ${sourceDir}:`, error.message);
    }
  }
});

// Scan content files for image references
const contentFiles = [
  ...fs.readdirSync(config.postsDir).filter(f => f.endsWith('.smd')).map(f => path.join(config.postsDir, f)),
  path.join(config.contentDir, "about.smd"),
  path.join(config.contentDir, "contact.smd"),
  path.join(config.contentDir, "index.smd")
].filter(f => fs.existsSync(f));

console.log(`Processing ${contentFiles.length} content files...`);

const imageReferences = new Map<string, {
  filePath: string;
  imageName: string;
  altText: string;
  className?: string;
}>();

// Find both markdown images and existing HTML picture blocks
const markdownImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
const htmlImageRegex = /<picture[^>]*>.*?src=['"]\/?([^'"]*\.webp)['"].*?<\/picture>/g;
const htmlSrcRegex = /\.\/([^'"]*\.webp)/g;

contentFiles.forEach(filePath => {
  // Security: Validate file size before reading
  if (!validateFileSize(filePath, MAX_FILE_SIZE)) {
    console.warn(`Skipping large content file: ${path.basename(filePath)} (>${MAX_FILE_SIZE / 1024 / 1024}MB)`);
    return;
  }
  
  let content: string;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.warn(`Could not read content file ${path.basename(filePath)}:`, error.message);
    return;
  }
  
  // Find markdown image references
  let match;
  while ((match = markdownImageRegex.exec(content)) !== null) {
    const altText = match[1];
    const imagePath = match[2];
    
    // Extract just the filename from the path
    const imageName = path.basename(imagePath);
    
    // Skip if this is already a processed webp or external URL
    if (imagePath.startsWith('http') || imagePath.includes('-thumbnail') || imagePath.includes('-small')) {
      continue;
    }
    
    if (sourceImages.has(imageName)) {
      const key = `${filePath}:${imageName}`;
      imageReferences.set(key, {
        filePath,
        imageName,
        altText,
        className: imagePath.includes('cover') ? 'cover' : undefined
      });
      console.log(`Found markdown image reference: ${imageName} in ${path.basename(filePath)}`);
    }
  }
  
  // Find existing HTML picture blocks and mark their images as referenced
  const existingHtmlImages = new Set<string>();
  const pictureMatches = content.match(/<picture[^>]*>[\s\S]*?<\/picture>/g);
  if (pictureMatches) {
    pictureMatches.forEach(pictureBlock => {
      const srcMatches = pictureBlock.match(/['"]\/?([^'"]*posts[^'"]*\.webp)['"]/g);
      if (srcMatches) {
        srcMatches.forEach(srcMatch => {
          const cleanPath = srcMatch.replace(/['"]\/?/g, '').replace(/['"]/g, '');
          
          // Security: Validate path (allow single-level relative for existing HTML)
          if (!isPathSafe(cleanPath, true)) {
            console.warn(`Skipping potentially unsafe asset path: ${cleanPath}`);
            return;
          }
          
          const sanitizedPath = sanitizePath(cleanPath);
          const fullPath = path.join('assets', sanitizedPath);
          existingHtmlImages.add(fullPath);
          referencedFiles.add(fullPath);
        });
      }
    });
  }
  
  // Also check frontmatter cover images
  const coverMatch = content.match(/\.cover\s*=\s*["']([^"']*)["']/s);
  if (coverMatch) {
    const coverHtml = coverMatch[1];
    const srcMatches = coverHtml.match(/['"]\/?([^'"]*posts[^'"]*\.webp)['"]/g);
    if (srcMatches) {
      srcMatches.forEach(srcMatch => {
        const cleanPath = srcMatch.replace(/['"]\/?/g, '').replace(/['"]/g, '');
        
        // Security: Validate path (allow single-level relative for existing HTML)
        if (!isPathSafe(cleanPath, true)) {
          console.warn(`Skipping potentially unsafe cover path: ${cleanPath}`);
          return;
        }
        
        const sanitizedPath = sanitizePath(cleanPath);
        const fullPath = path.join('assets', sanitizedPath);
        existingHtmlImages.add(fullPath);
        referencedFiles.add(fullPath);
      });
    }
  }
  
  if (existingHtmlImages.size > 0) {
    console.log(`Found ${existingHtmlImages.size} existing processed images in ${path.basename(filePath)}`);
  }
});

console.log(`Found ${imageReferences.size} image references to process`);

// Process each unique image
const processedImages = new Map<string, any>();

for (const [key, ref] of imageReferences) {
  if (processedImages.has(ref.imageName)) {
    continue; // Already processed this image
  }
  
  console.log(`Processing image: ${ref.imageName}`);
  
  const sourceImagePath = sourceImages.get(ref.imageName);
  if (!sourceImagePath) {
    console.warn(`Source image not found: ${ref.imageName}`);
    continue;
  }
  
  // Determine output directory based on content file location
  let outputDir: string;
  if (ref.filePath.includes('/posts/')) {
    // Extract post slug from filename
    const postFile = path.basename(ref.filePath, '.smd');
    outputDir = path.join(config.assetsDir, "posts", postFile);
  } else if (ref.filePath.includes('about.smd')) {
    outputDir = path.join(config.assetsDir, "about");
  } else if (ref.filePath.includes('contact.smd')) {
    outputDir = path.join(config.assetsDir, "contact");
  } else {
    outputDir = path.join(config.assetsDir, "images");
  }
  
  const imageTransformer = new ImageTransformer(outputDir);
  
  try {
    // Read the source image
    const imageBuffer = fs.readFileSync(sourceImagePath);
    
    // Create a simple ID from the filename (remove extension)
    const imageId = path.parse(ref.imageName).name;
    
    const result = await imageTransformer.processImageBlock({
      id: imageId,
      image: {
        type: "file",
        file: {
          url: `file://${path.resolve(sourceImagePath)}`
        }
      }
    }, {
      className: ref.className
    });
    
    processedImages.set(ref.imageName, result);
    
    // Add all generated files to referenced set
    for (const file of imageTransformer.referencedFiles) {
      referencedFiles.add(file);
    }
    
    console.log(`Successfully processed ${ref.imageName}`);
    
  } catch (error) {
    console.error(`Error processing ${ref.imageName}:`, error);
  }
}

// Add directories to referenced files
const directories = new Set<string>();
for (const file of referencedFiles) {
  directories.add(path.dirname(file));
}
for (const dir of directories) {
  referencedFiles.add(dir);
}

// Note: File cleanup disabled during migration - existing Notion images are preserved
// TODO: Re-enable cleanup after all content is migrated to simple markdown image syntax
console.log(`Skipping cleanup - found ${existingFiles.size} existing files, referenced ${referencedFiles.size} files`);

// Generate assets.zig file
console.log("Generating assets.zig file...");

const assetFiles = Array.from(referencedFiles).filter(
  (file) => file.startsWith("assets") && fs.existsSync(file) && fs.statSync(file).isFile()
);

const writer = fs.createWriteStream("assets.zig", { flags: "w" });
writer.write("pub const assets = [_][]const u8{");

for (const file of assetFiles) {
  console.log(`Adding asset: ${file}`);
  const relativePath = path.relative("assets", file);
  writer.write(`${JSON.stringify(relativePath)},`);
}

writer.write("};");
writer.close();

console.log("Done processing images!");