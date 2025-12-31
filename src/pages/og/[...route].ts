import { OGImageRoute } from "astro-og-canvas";

interface BlogFrontmatter {
  title: string;
  description?: string;
}

interface BlogPage {
  file: string;
  frontmatter: BlogFrontmatter;
}

interface PageData {
  data: BlogFrontmatter;
}

// Get all blog posts for static generation
const pages = import.meta.glob<BlogPage>("/src/content/blog/**/*.mdx", {
  eager: true,
});

const entries = Object.values(pages).map((page) => {
  const slug =
    page.file.split("/").pop()?.replace(".mdx", "").replace("/index", "") ?? "";
  return [slug, { data: page.frontmatter }] as [string, PageData];
});

export const { getStaticPaths, GET } = OGImageRoute({
  // Use the slug as the param
  param: "route",

  // Pass in the pages as an object
  pages: Object.fromEntries(entries),

  // Define the OG image options
  getImageOptions: async (_path, page: PageData) => {
    return {
      title: page.data.title,
      description: page.data.description,
      bgGradient: [
        [76, 29, 149],
        [109, 40, 217],
      ], // Darker violet gradient
      border: { color: [109, 40, 217], width: 20 },
      font: {
        title: {
          size: 72,
          families: ["Inter", "sans-serif"],
          weight: "Bold",
        },
        description: {
          size: 38,
          lineHeight: 1.5,
          families: ["Inter", "sans-serif"],
          weight: "Normal",
        },
      },
      fonts: [
        "https://api.fontsource.org/v1/fonts/inter/latin-400-normal.ttf",
        "https://api.fontsource.org/v1/fonts/inter/latin-700-normal.ttf",
      ],
    };
  },
});
