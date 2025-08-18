# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is Simon Hartcher's personal blog built with Astro, a modern static site generator. The site uses Astro's content collections, React components for interactivity, and optimized asset handling.

## Architecture

### Core Components
- **Astro SSG**: The site is built using Astro with server-side rendering and static generation
- **Content Collections**: Blog content is authored as `.mdx` files with type-safe frontmatter
- **Asset Processing**: Images are handled by Astro's built-in image optimization
- **React Components**: Used for interactive elements like comments (Giscus)
- **Pico CSS**: Lightweight CSS framework for styling (violet theme)

### Directory Structure
- `src/content/`: Contains `.mdx` files organized in collections (blog, pages)
- `src/layouts/`: Astro layout components
- `src/components/`: React and Astro components
- `src/assets/`: Static assets including optimized images
- `src/pages/`: Astro page routes and API endpoints
- `public/`: Static files served directly
- `dist/`: Build output directory (generated)

### Key Files
- `astro.config.mjs`: Astro configuration with integrations
- `src/content/config.ts`: Content collection schemas
- `src/components/Comments.tsx`: Giscus comments React component
- `src/layouts/Base.astro`: Main layout template

## Development Commands

### Content Management
```bash
# Start development server
bun run dev

# Build the site
bun run build

# Preview the built site
bun run preview
```

### Building
```bash
# Build the entire site
bun run build

# Preview production build
bun run preview
```

### Dependencies
```bash
# Install Node.js dependencies
bun install
```

## Content Creation Workflow

### Creating New Posts
1. Create a new `.mdx` file in `src/content/blog/` with naming format: `YYYY-MM-DD-post-title.mdx`
2. Add frontmatter with title, date, description, tags, etc.
3. Place optimized images in `src/assets/` in appropriate directories
4. Reference images in markdown: `![alt text](../../assets/image.webp)`
5. Build with `bun run build`

### Image Directory Structure
```
src/assets/
├── about/           # About page images
├── contact/         # Contact page images
└── YYYY-MM-DD-*/    # Post-specific image directories
```

## Content Workflow

1. Content is created/edited as `.mdx` files in `src/content/`
2. Images are placed in `src/assets/` in organized directories
3. Astro handles image optimization automatically during build
4. Build generates the static site in `dist/`

## Template System

Astro uses `.astro` components with a familiar HTML-like syntax:
- `src/layouts/Base.astro`: Main template with navigation and metadata
- `src/pages/posts/[...slug].astro`: Blog post layout
- `src/pages/about.astro`: About page layout
- `src/pages/contact.astro`: Contact page layout
- `src/pages/subscribe.astro`: Subscribe page layout
- `src/pages/index.astro`: Homepage layout

## Build Process

1. Astro processes content collections and generates type-safe schemas
2. Images are optimized and converted to modern formats (WebP, AVIF)
3. React components are rendered server-side and hydrated client-side as needed
4. Static site is generated in `dist/` directory
5. RSS feed and sitemap are generated automatically

## Key Features

- **Giscus Comments**: GitHub Discussions-based commenting system
- **SEO Aliases**: Backwards compatibility redirects for old URLs
- **RSS Feed**: Automatically generated at `/rss.xml`
- **Sitemap**: Auto-generated sitemap at `/sitemap-index.xml`
- **Type Safety**: Full TypeScript support with content collection schemas
- **Performance**: Optimized images, minimal JavaScript, fast loading

## Environment Variables

```bash
PUBLIC_GISCUS_REPO=owner/repository
PUBLIC_GISCUS_REPO_ID=R_kgDOHxxxxx
PUBLIC_GISCUS_CATEGORY=Comments
PUBLIC_GISCUS_CATEGORY_ID=DIC_kwDOHxxxxx
```

Check your current working directory if commands fail.