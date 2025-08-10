# Technical Migration Plan: Removing Notion Integration

## Executive Summary

The blog currently uses a sophisticated content pipeline that syncs from Notion CMS, processes images into multiple optimized formats, and generates static content. The goal is to eliminate the Notion dependency while maintaining the automated image processing system that creates responsive WebP images in multiple sizes.

## Current Architecture Analysis

### Key Components
- **Content Pipeline**: `/home/sh/Projects/simonhartcher.com/src/scripts/notion2md.ts` - Main sync script
- **Image Processing**: `/home/sh/Projects/simonhartcher.com/src/scripts/lib/images.ts` - Sophisticated image transformer
- **Configuration**: `/home/sh/Projects/simonhartcher.com/src/scripts/config.ts` - Notion-specific config
- **Build System**: Zine (Zig) + TypeScript tooling with Bun
- **Asset Management**: Auto-generated `assets.zig` manifest

### Valuable Image Processing Features to Preserve
- Multiple size generation (thumbnail: 300x200, small: 600x400, medium: 900x600, large: 1200x800, xlarge: 1800x1200, original)
- WebP conversion with quality optimization (80% quality, smart subsampling)
- Responsive HTML generation with `<picture>` elements and `srcset`
- Automatic asset manifest generation for Zig build system
- Intelligent size selection based on source dimensions
- File cleanup and unused asset removal

## Migration Strategy

### Phase 1: Dependency Analysis and Cleanup

#### Dependencies to Remove
```json
// From package.json
"@notionhq/client": "^2.2.15",
"notion-client": "^7.1.6", 
"notion-to-md": "^3.1.4",
"notion-utils": "^7.1.6"
```

#### Dependencies to Keep
```json
// Essential for image processing and build
"sharp": "^0.33.5",        // Core image processing
"moment": "^2.30.1",       // Date formatting
"ramda": "^0.30.1",        // Utility functions (used in file cleanup)
"alpinejs": "^3.14.8",     // Frontend functionality
"node-static": "^0.7.11",  // Dev server
"@types/node-static": "^0.7.11"
```

#### Scripts to Update
```json
// Remove Notion sync, keep build pipeline
{
  "scripts": {
    "process-images": "bun src/scripts/processImages.ts",  // New
    "prebuild": "bun build.ts",                           // Keep
    "build": "zig build",                                  // Keep  
    "dev": "bun dev.ts",                                   // Keep
    "predev": "npx rimraf zig-out"                         // Keep
  }
}
```

### Phase 2: New Image Processing Workflow

#### Create Standalone Image Processor
**File**: `/home/sh/Projects/simonhartcher.com/src/scripts/processImages.ts`

This will replace `notion2md.ts` with a local-first approach:

```typescript
import { ImageTransformer } from "./lib/images";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { difference } from "ramda";

interface ImageProcessingConfig {
  sourceDir: string;      // "content/images" 
  outputDir: string;      // "assets"
  postsDir: string;       // "content/posts"
  contentDir: string;     // "content"
}

// Scan content files for image references
// Process images found in designated directories  
// Generate responsive HTML
// Update asset manifest
// Clean up unused files
```

#### Enhanced Content Directory Structure
```
content/
├── posts/
│   ├── 2024-01-01-post-title.smd     (manually edited)
│   └── images/                        (new - source images)
│       ├── cover.jpg
│       ├── diagram.png
│       └── screenshot.webp
├── pages/
│   ├── about.smd                     (manually edited)
│   └── images/                       (new - page images)
│       └── profile.jpg
└── images/                           (new - global images)
    └── logo.svg
```

#### Modified Image Processing Workflow
1. **Source Discovery**: Scan content directories for images
2. **Reference Parsing**: Extract image references from `.smd` files  
3. **Processing**: Use existing `ImageTransformer` class
4. **HTML Generation**: Generate responsive `<picture>` elements
5. **Asset Manifest**: Update `assets.zig` with processed files
6. **Cleanup**: Remove unused processed images

### Phase 3: Content Authoring Workflow

#### New Manual Content Creation Process
1. **Create Post File**: Add new `.smd` file in `content/posts/`
2. **Add Images**: Place source images in `content/posts/images/` or `content/images/`
3. **Reference Images**: Use simple syntax in markdown: `![alt text](images/filename.jpg)`
4. **Process Images**: Run `bun process-images` to generate optimized versions
5. **Build**: Run `bun run build` as usual

#### Content File Format (Unchanged)
The existing `.smd` front matter format remains the same:
```yaml
---
.date = "2024-01-01",
.title = "Post Title", 
.description = "Description",
.tags = ["tag1", "tag2"],
.author = "Simon Hartcher",
.layout = "post.shtml",
.custom = {
  .cover = "<picture>...</picture>",
  .preview = "cover-small.webp",
  .featured = false,
},
---
```

### Phase 4: Implementation Steps

#### Step 1: Create New Image Processing Script
- Extract image processing logic from `notion2md.ts`
- Create standalone `processImages.ts`
- Implement source directory scanning
- Add markdown image reference parsing

#### Step 2: Update Build Pipeline  
- Modify `build.ts` to call image processing first
- Update `dev.ts` to watch for image changes
- Ensure asset manifest generation continues working

#### Step 3: Update Configuration
- Remove Notion-specific config
- Add image processing paths configuration
- Maintain existing directory structure for processed assets

#### Step 4: Test Migration
- Process existing content with new system
- Verify all images are properly generated
- Confirm responsive HTML output matches
- Validate asset manifest accuracy

#### Step 5: Clean Dependencies
- Remove Notion packages from `package.json`
- Update lock files
- Remove unused imports and types

## Risk Assessment & Mitigation

### High Risk Areas
1. **Image Processing Logic Changes**: The existing `ImageTransformer` class is complex
   - **Mitigation**: Preserve the class entirely, only change how it's called
2. **Asset Manifest Generation**: Critical for Zig build system
   - **Mitigation**: Keep exact same output format and file paths
3. **Responsive HTML Output**: Complex picture/srcset generation
   - **Mitigation**: Preserve existing HTML generation logic

### Medium Risk Areas  
1. **File Path Changes**: Moving from Notion IDs to local paths
   - **Mitigation**: Maintain same output directory structure
2. **Build Pipeline Integration**: Changes to prebuild steps
   - **Mitigation**: Gradual integration with fallback options

### Low Risk Areas
1. **Content Format**: `.smd` files remain unchanged
2. **Development Server**: No changes needed
3. **Static Site Generation**: Zine build process unchanged

## Rollback Plan

### Immediate Rollback (< 1 hour)
1. Revert package.json changes
2. Restore notion2md.ts as primary script  
3. Re-run `bun sync` to restore Notion integration
4. Rebuild site with original pipeline

### Partial Rollback (1-4 hours)
1. Keep new image processing for manual content
2. Restore Notion sync for existing content
3. Run both systems in parallel during transition

### Data Backup Strategy
1. **Git Backup**: All content already in version control
2. **Asset Backup**: Copy entire `assets/` directory before migration
3. **Generated Files**: Backup `assets.zig` manifest
4. **Content Backup**: All `.smd` files are preserved

## Success Criteria

### Functional Requirements
- [ ] All existing images render correctly with same responsive behavior
- [ ] New images can be processed and integrated manually  
- [ ] Asset manifest generation continues working
- [ ] Build pipeline produces identical output
- [ ] Development server continues functioning

### Performance Requirements
- [ ] Image processing time remains under 30 seconds for full rebuild
- [ ] Generated WebP files maintain same quality/size ratios
- [ ] Build time does not increase significantly

### Quality Requirements
- [ ] No broken image links on existing content
- [ ] Responsive images work across all device sizes  
- [ ] SEO metadata preserved in generated HTML
- [ ] Accessibility attributes maintained

## Implementation Timeline

### Week 1: Preparation & Analysis
- Day 1-2: Detailed code analysis and testing current system
- Day 3-4: Create new `processImages.ts` script  
- Day 5: Build test environment and validate approach

### Week 2: Core Migration
- Day 1-2: Implement new image processing workflow
- Day 3-4: Update build pipeline integration
- Day 5: Testing and bug fixes

### Week 3: Validation & Cleanup  
- Day 1-2: End-to-end testing with existing content
- Day 3: Remove Notion dependencies
- Day 4-5: Documentation and final validation

## Technical Specifications

### New File Structure
```
src/scripts/
├── config.ts                 (updated - remove Notion config)
├── processImages.ts          (new - main image processor)
└── lib/
    ├── images.ts             (preserved - core image transformer)
    ├── transformers.ts       (preserved - markdown transformers)
    ├── types.ts             (updated - remove Notion types)
    └── fileScanner.ts       (new - content file scanning)
```

### Configuration Updates
```typescript
// src/scripts/config.ts
const config = {
  contentDir: "content",
  postsDir: "content/posts", 
  assetsDir: "assets/",
  sourceImageDirs: [
    "content/images",
    "content/posts/images", 
    "content/pages/images"
  ],
  defaultAuthor: "Simon Hartcher"
};
```

This migration plan preserves the valuable image processing system while eliminating the complexity of Notion integration, resulting in a simpler, more maintainable architecture that supports both automated workflows and manual content creation.