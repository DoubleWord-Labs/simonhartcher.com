# Migration Plan: Zine to Astro Static Site Generator

## Executive Summary

This document outlines the technical strategy for migrating Simon Hartcher's personal blog from Zine (a Zig-based static site generator) to Astro, a modern JavaScript-based static site generator. The migration aims to modernize the technology stack while preserving the existing functionality, visual styling, and content structure.

**Migration Complexity**: Medium-High  
**Estimated Timeline**: 2-3 weeks  
**Risk Level**: Medium  

## Current Architecture Analysis

### Technology Stack
- **SSG**: Zine (Zig-based) with custom `.shtml` templating
- **Content Format**: `.smd` files (structured markdown with custom frontmatter)
- **Styling**: Pico CSS framework with custom CSS overrides
- **Frontend**: Alpine.js for interactivity
- **Asset Processing**: Custom TypeScript pipeline using Sharp for image optimization
- **Build System**: Zig build system with Bun for asset processing

### Key Components

#### Templates (`layouts/`)
- `base.shtml`: Master template with navigation, metadata, and Alpine.js integration
- `post.shtml`: Blog post layout with Giscus comments integration
- `page.shtml`: Static page layout
- `index.shtml`: Homepage with featured posts and recent posts listing

#### Content Structure (`content/`)
- Posts in `/posts/` directory with date-prefixed filenames
- Custom frontmatter format using Ziggy syntax (`.title = "value"`)
- Pages (about, contact, subscribe) at content root
- Custom fields like `cover`, `preview`, `featured`, `aliases`

#### Asset Pipeline
- Custom image processing generating multiple WebP sizes (thumbnail, small, medium, large, xlarge, original)
- Responsive `<picture>` elements with `srcset` attributes
- Auto-generated `assets.zig` manifest file
- CSS/JS minification via Bun

#### Styling Approach
- Pico CSS as base framework (violet theme)
- Custom CSS overrides for blog-specific styling
- Responsive design with mobile-first approach
- Dark/light theme support via Pico

## Migration Strategy

### Phase 1: Foundation Setup (Week 1)

#### 1.1 Astro Project Initialization
```bash
bun create astro@latest simonhartcher-astro
cd simonhartcher-astro
bun install @astrojs/mdx @astrojs/sitemap @astrojs/rss @astrojs/alpinejs sharp
```

#### 1.2 Directory Structure Setup
```
src/
├── components/
│   ├── BaseLayout.astro
│   ├── BlogPost.astro
│   ├── Navigation.astro
│   └── ImageOptimized.astro
├── layouts/
│   ├── BaseLayout.astro
│   ├── BlogPostLayout.astro
│   └── PageLayout.astro
├── pages/
│   ├── index.astro
│   ├── about.md
│   ├── contact.md
│   ├── subscribe.md
│   └── posts/
├── content/
│   ├── config.ts
│   └── posts/
├── styles/
│   └── global.css
└── utils/
    └── imageProcessing.ts
```

#### 1.3 Content Collections Configuration
Create `src/content/config.ts`:
```typescript
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const postsCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().optional(),
    author: z.string().default("Simon Hartcher"),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    cover: z.string().optional(),
    preview: z.string().optional(),
    aliases: z.array(z.string()).optional(),
  }),
});

export const collections = {
  posts: postsCollection,
};
```

### Phase 2: Template Migration (Week 1-2)

#### 2.1 Base Layout Conversion
Convert `layouts/templates/base.shtml` to `src/layouts/BaseLayout.astro`:

**Key Changes**:
- Replace Zine template syntax (`$site.title`, `$page.title`) with Astro props
- Alpine.js integration works directly in Astro components (no client directives needed)
- Convert asset references to Astro's asset system with `<Image />` component
- Preserve existing meta tags and analytics integration

#### 2.2 Component Creation
Create reusable Astro components:

**Navigation Component** (`src/components/Navigation.astro`):
```astro
---
interface Props {
  currentPath: string;
}
const { currentPath } = Astro.props;
---
<div x-data="{ open: false }">
  <!-- Subscription modal and navigation -->
  <!-- Alpine.js directives work directly in Astro components -->
</div>
```

**Optimized Image Component** (`src/components/ImageOptimized.astro`):
```astro
---
import { Image, getImage } from 'astro:assets';
interface Props {
  src: ImageMetadata | string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

const { src, alt, width, height, className, ...attrs } = Astro.props;
---
<Image 
  src={src} 
  alt={alt} 
  width={width} 
  height={height} 
  class={className}
  {...attrs}
/>
```

#### 2.3 Layout Templates
- **BaseLayout.astro**: Master layout with navigation and footer
- **BlogPostLayout.astro**: Blog post wrapper with metadata and comments
- **PageLayout.astro**: Simple page wrapper

### Phase 3: Content Migration (Week 2)

#### 3.1 Content Format Conversion
Convert `.smd` files to `.mdx` or `.md` format:

**Before (Zine .smd)**:
```yaml
---
.title = "Adventures in Game Development",
.date = "2025-03-27",
.description = "Reverse engineering, game jams, challenges, learnings",
.tags = ["Game Development", "Godot"],
.author = "Simon Hartcher",
.layout = "post.shtml",
.custom = {
  .cover = "<picture>...</picture>",
  .featured = true,
},
---
```

**After (Astro .mdx)**:
```yaml
---
title: "Adventures in Game Development"
date: 2025-03-27
description: "Reverse engineering, game jams, challenges, learnings"
tags: ["Game Development", "Godot"]
author: "Simon Hartcher"
featured: true
cover: "./images/cover.jpg"
---
```

#### 3.2 Image Reference Migration
- Convert custom HTML `<picture>` blocks to Astro's `<Image />` and `<Picture />` components
- Maintain responsive image generation with automatic format optimization (WebP, AVIF)
- Update image paths to use ESM imports: `import myImage from '../assets/image.jpg'`
- Use Astro's `getImage()` function for programmatic image optimization

#### 3.3 Content Migration Script
Create automated migration script:
```typescript
// scripts/migrate-content.ts
import fs from 'fs';
import path from 'path';

// Convert .smd frontmatter to YAML
// Update image references to use Astro's Image component
// Preserve content structure
// Process all files in content/posts directory
```

### Phase 4: Asset Pipeline Migration (Week 2-3)

#### 4.1 Image Processing Integration
Replace custom Sharp-based processing with Astro's built-in image optimization:

```typescript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import alpinejs from '@astrojs/alpinejs';

export default defineConfig({
  integrations: [mdx(), alpinejs()],
  image: {
    domains: ['simonhartcher.com'],
    remotePatterns: [{ protocol: "https" }],
  },
});
```

#### 4.2 Asset Organization
- Move processed images to `src/assets/` directory for optimization or `public/` for static assets
- Update asset references in content files to use Astro's Image component
- Implement responsive image generation using Astro's built-in `<Image />` component with automatic WebP/AVIF conversion

#### 4.3 CSS Migration
- Import Pico CSS framework
- Port custom CSS styles
- Ensure responsive design compatibility
- Maintain dark/light theme support

### Phase 5: Feature Preservation (Week 3)

#### 5.1 RSS Feed
```typescript
// src/pages/rss.xml.js
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = await getCollection('posts');
  return rss({
    title: "Simon Hartcher's Blog",
    description: 'Technical blog by Simon Hartcher',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      link: `/posts/${post.slug}/`,
    })),
  });
}
```

#### 5.2 Sitemap Generation
```typescript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://simonhartcher.com', // Required for sitemap generation
  integrations: [sitemap()],
});
```

#### 5.3 Alpine.js Integration
```bash
bun add @astrojs/alpinejs
# or via Astro CLI
bun x astro add alpinejs
```

```typescript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import alpinejs from '@astrojs/alpinejs';

export default defineConfig({
  integrations: [alpinejs()],
});
```

Alpine.js works directly in Astro components without client-side directives:
```astro
---
// No special imports needed
---
<div x-data="{ isOpen: false }">
  <button @click="isOpen = !isOpen">Toggle</button>
  <div x-show="isOpen" x-transition>
    Content here
  </div>
</div>
```

#### 5.4 Comments Integration
Preserve Giscus comments integration in blog post layout

#### 5.5 Analytics Migration
Maintain Google Analytics and PostHog integration

### Phase 6: Build System Migration (Week 3)

#### 6.1 Development Workflow
Replace custom build scripts with Astro's development server:
```bash
bun run dev     # astro dev (hot reload, file watching)
bun run build   # astro build (production build)
bun run preview # astro preview (preview production build locally)
```

Update `package.json` scripts:
```json
{
  "scripts": {
    "dev": "astro dev",
    "start": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  }
}
```

#### 6.2 Deployment Configuration
Update deployment scripts for Astro's output structure

## Risk Assessment & Mitigation

### High Risks
1. **Image Processing Complexity**
   - **Risk**: Loss of optimized responsive images
   - **Mitigation**: Test Astro's Image component thoroughly, create fallback processing script

2. **Content Format Migration**
   - **Risk**: Frontmatter parsing errors or data loss
   - **Mitigation**: Automated migration script with validation, manual review of complex posts

3. **Alpine.js Integration**
   - **Risk**: Interactive components breaking
   - **Mitigation**: Alpine.js works directly in Astro components without islands - just include the @astrojs/alpinejs integration and use directives normally

### Medium Risks
1. **SEO Impact**
   - **Risk**: URL structure changes affecting search rankings
   - **Mitigation**: Implement redirects for changed URLs, maintain existing slug structure

2. **Performance Regression**
   - **Risk**: Slower build times or larger bundle sizes
   - **Mitigation**: Performance benchmarking, optimize bundle configuration

3. **Styling Inconsistencies**
   - **Risk**: Visual differences from current site
   - **Mitigation**: Side-by-side comparison testing, CSS audit

### Low Risks
1. **Analytics Tracking**
   - **Risk**: Temporary analytics gaps
   - **Mitigation**: Parallel tracking during migration

## Success Criteria

### Functional Requirements
- ✅ All blog posts render correctly with proper formatting
- ✅ Responsive images work across all device sizes
- ✅ Search engine optimization maintained (meta tags, sitemap, RSS)
- ✅ Comments system (Giscus) functional on blog posts
- ✅ Navigation and subscription modal work correctly
- ✅ Analytics tracking operational

### Performance Requirements
- ✅ Build time ≤ current build time (under 2 minutes)
- ✅ Page load speed ≥ current performance
- ✅ Lighthouse scores maintained or improved
- ✅ Image optimization maintains quality and compression

### Content Requirements
- ✅ All existing content migrated without data loss
- ✅ Image quality and responsive behavior preserved
- ✅ URL structure compatibility (with redirects where necessary)
- ✅ Frontmatter data integrity maintained

### Development Experience
- ✅ Hot reload development server
- ✅ TypeScript integration working
- ✅ Content authoring workflow simplified
- ✅ Build process reliability improved

## Implementation Timeline

### Week 1: Foundation (5 days)
- Day 1: Astro project setup and configuration
- Day 2-3: Base layout and component creation
- Day 4-5: Content collection setup and migration planning

### Week 2: Content & Templates (5 days)  
- Day 1-2: Template conversion (base, post, page layouts) with Alpine.js integration
- Day 3-4: Content migration script development and execution
- Day 5: Image processing pipeline migration to Astro's Image component

### Week 3: Integration & Testing (5 days)
- Day 1-2: Feature integration (RSS, sitemap, Alpine.js, comments, analytics)
- Day 3-4: Comprehensive testing and visual comparison
- Day 5: Performance optimization and deployment preparation

## Post-Migration Tasks

### Immediate (Week 4)
- Deploy to staging environment for final testing
- Update deployment pipeline (ensure `bun` is used instead of `npm`)
- Monitor for any issues in production
- Update documentation and development guidelines

### Short-term (Weeks 5-6)
- Performance monitoring and optimization
- SEO audit and improvements
- User feedback collection and iteration
- Content authoring workflow documentation

### Long-term (Months 1-3)
- Consider advanced Astro features (View Transitions, Islands Architecture)
- Evaluate additional optimizations and integrations
- Plan for future content management improvements
- Monitor analytics for migration impact

## Conclusion

This migration from Zine to Astro represents a strategic modernization that will:
- **Improve Developer Experience**: Better tooling, TypeScript support, and modern development workflow
- **Enhance Performance**: Optimized builds, modern image processing, and efficient asset handling  
- **Future-proof the Stack**: Active ecosystem, regular updates, and extensive community support
- **Maintain Quality**: Preserve all existing functionality while improving maintainability

The phased approach minimizes risk while ensuring thorough testing at each stage. With proper execution, this migration will result in a more maintainable, performant, and developer-friendly blog platform while preserving the high-quality user experience of the current site.

## Updated Migration Notes (Based on Latest Astro Documentation)

### Package Manager
All commands have been updated to use `bun` instead of `npm` for consistency with the current development environment.

### Alpine.js Integration
**Corrected Approach**: Alpine.js works directly in Astro components through the `@astrojs/alpinejs` integration. No client-side directives or islands are needed - Alpine.js directives (`x-data`, `@click`, etc.) can be used directly in Astro component templates.

### Content Collections
Updated to use the new Content Layer API with `glob` loaders for better file system integration and performance.

### Image Optimization
Astro's built-in `<Image />` component provides automatic optimization with WebP/AVIF conversion, responsive image generation, and proper loading attributes - eliminating the need for custom Sharp processing pipelines.

### Build Commands
All build commands updated to use `bun` consistently:
- Development: `bun run dev`
- Production build: `bun run build`
- Preview: `bun run preview`