import type { CollectionEntry } from "astro:content";
import type { ImageMetadata } from "astro";

// Type for cover image - either an imported image or a string path
export type ImageRef = ImageMetadata | string;

/**
 * Get the URL slug from a blog post ID
 * Handles both regular .mdx files and folder/index.mdx structure
 */
export function getPostSlug(postId: string): string {
  return postId.replace(".mdx", "").replace("/index", "");
}

/**
 * Get the full URL path for a blog post
 */
export function getPostUrl(post: CollectionEntry<"blog">): string {
  return `/posts/${getPostSlug(post.id)}`;
}

/**
 * Get cover image URL for meta tags and external use
 * Returns a string URL regardless of image type
 */
export function getCoverImageUrl(cover?: ImageRef): string | undefined {
  if (cover == null) return undefined;

  // If it's an imported image object (co-located with MDX)
  if (typeof cover === "object" && "src" in cover) {
    return cover.src;
  }

  // If it's a string path (legacy)
  if (typeof cover === "string") {
    return cover;
  }

  return undefined;
}

/**
 * Resolve cover image for use in Astro Image component
 * Handles dynamic imports for legacy string paths
 */
export async function resolveCoverImage(
  cover?: ImageRef,
): Promise<ImageMetadata | undefined> {
  console.log("cover", cover);

  if (cover == null) return undefined;

  // If it's already an imported image object, return it directly
  if (typeof cover === "object" && "src" in cover) {
    return cover;
  }

  // If it's a string path (legacy), try to import it dynamically
  if (typeof cover === "string") {
    try {
      const imagePath = cover.replace("/posts/", "../../assets/");
      const modules = import.meta.glob<{ default: ImageMetadata }>(
        "../../assets/**/*.{webp,jpg,jpeg,png}",
        { eager: true },
      );
      return modules[imagePath]?.default;
    } catch (error) {
      console.error("Failed to load cover image:", error);
      return undefined;
    }
  }

  return undefined;
}

/**
 * Synchronously resolve cover image (for use in components)
 * Note: This requires the glob to be defined in the component context
 */
export function resolveCoverImageSync(
  cover: ImageRef,
  modules: Record<string, { default: ImageMetadata }>,
): ImageMetadata | undefined {
  // If it's already an imported image object, return it directly
  if (typeof cover === "object" && "src" in cover) {
    return cover;
  }

  // If it's a string path (legacy), try to resolve from provided modules
  if (typeof cover === "string") {
    const imagePath = cover.replace("/posts/", "/src/assets/");
    return modules[imagePath]?.default;
  }

  return undefined;
}

/**
 * Generate image paths for responsive images
 * Used for picture elements with multiple sources
 */
export function getResponsiveImagePaths(post: CollectionEntry<"blog">) {
  const slug = getPostSlug(post.id);
  return {
    thumbnail: `/posts/${slug}/cover-thumbnail.webp`,
    small: `/posts/${slug}/cover-small.webp`,
    medium: `/posts/${slug}/cover-medium.webp`,
    large: `/posts/${slug}/cover-large.webp`,
    xlarge: `/posts/${slug}/cover-xlarge.webp`,
    default: getPostCoverImage(post)?.src,
  };
}

export function getPostCoverImage(
  post: CollectionEntry<"blog">,
): ImageMetadata | undefined {
  // Import MDX files to access their exports
  const mdxModules = import.meta.glob("src/content/blog/**/*.mdx", {
    eager: true,
  });

  const mdxModule = mdxModules[`/${post.filePath!}`] as Record<string, any>;

  // Try to get cover from MDX exports first, then fallback to frontmatter
  let coverImage = mdxModule?.cover || mdxModule?.preview;

  // If no export, handle cover image from frontmatter - supports both co-located images and legacy assets folder
  if (!coverImage && post.data.cover) {
    const modules = import.meta.glob("src/assets/**/*.{webp,jpg,jpeg,png}", {
      eager: true,
    }) as Record<string, { default: ImageMetadata }>;

    coverImage = resolveCoverImageSync(post.data.cover, modules);
  }

  return coverImage;
}
