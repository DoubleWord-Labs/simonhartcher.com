# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is Simon Hartcher's personal blog built with Zine (a Zig-based static site generator) with local content management. The site combines Zig for the static site generation with TypeScript/JavaScript tooling for asset building and image processing.

## Architecture

### Core Components
- **Zine SSG**: The site is built using Zine, a static site generator written in Zig
- **Local Content Management**: Blog content is authored directly as `.smd` files (structured markdown)
- **Asset Processing**: Images are automatically processed and optimized in multiple sizes (thumbnail, small, medium, large, xlarge, original)
- **Alpine.js**: Used for lightweight frontend interactivity
- **Content Pipeline**: Local Images → Processing → WebP optimization → Static HTML generation

### Directory Structure
- `content/`: Contains `.smd` files (structured markdown with frontmatter) for pages and posts
- `layouts/`: Zine templates (`.shtml` files) for different page types
- `assets/`: Static assets including processed images and CSS/JS files
- `src/scripts/`: TypeScript utilities for Notion sync and asset processing
- `zig-out/`: Build output directory (generated)

### Key Files
- `build.zig`: Zine build configuration
- `assets.zig`: Auto-generated asset manifest for Zine
- `src/scripts/processImages.ts`: Main image processing script for local files
- `src/scripts/config.ts`: Configuration for local paths and image processing

## Development Commands

### Content Management
```bash
# Process local images and generate optimized variants
bun run process-images

# Clean build output before development
bun run predev

# Start development server with file watching on port 1990
bun run dev
```

### Building
```bash
# Build frontend assets (CSS/JS minification)
bun run prebuild

# Build the entire site using Zig/Zine
bun run build
# Equivalent to: zig build
```

### Dependencies
```bash
# Install Node.js dependencies
bun install
```

## Content Creation Workflow

### Creating New Posts
1. Create a new `.smd` file in `content/posts/` with naming format: `YYYY-MM-DD-post-title.smd`
2. Add frontmatter with title, date, description, tags, etc.
3. Place source images in `content/posts/images/` or `content/images/`
4. Reference images in markdown: `![alt text](images/filename.jpg)`
5. Run `bun run process-images` to generate optimized versions
6. Build with `bun run build`

### Image Directory Structure
```
content/
├── images/          # Global images
├── posts/
│   ├── images/      # Post-specific images
│   └── *.smd        # Post content files
└── pages/
    └── images/      # Page-specific images
```

## Content Workflow

1. Content is created/edited as `.smd` files in `content/`
2. Source images are placed in appropriate `images/` directories
3. Running `bun run process-images` processes images into multiple sizes and saves in `assets/`
4. `assets.zig` is regenerated with updated asset references
5. Zine builds the static site from the content files and templates

## Asset Processing

The image processing system in `src/scripts/lib/images.ts` automatically:
- Scans local directories for source images
- Generates multiple sizes (thumbnail: 300x200, small: 600x400, medium: 900x600, large: 1200x800, xlarge: 1800x1200, plus original)
- Converts to WebP format for optimization (80% quality, smart subsampling)
- Creates responsive HTML with `<picture>` elements and `srcset`
- Updates asset references in the generated `assets.zig` file
- Cleans up unused processed images

## Template System

Zine uses `.shtml` templates with a custom templating syntax:
- `layouts/base.shtml`: Main template with navigation and metadata
- `layouts/post.shtml`: Blog post layout
- `layouts/page.shtml`: Static page layout
- `layouts/index.shtml`: Homepage layout

## Build Process

1. `build.ts` processes images, then builds frontend assets (CSS/JS) using Bun
2. `build.zig` configures Zine with content/layout/asset paths
3. Zine generates the complete static site in `zig-out/`
4. Development server (`dev.ts`) watches for changes including image directories and rebuilds automatically
- Check your current working directory if commands fail