// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import alpinejs from "@astrojs/alpinejs";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";
import mcp from "astro-mcp";

// https://astro.build/config
export default defineConfig({
    site: "https://simonhartcher.com",
    integrations: [mdx(), alpinejs(), react(), sitemap(), mcp()],
    markdown: {
        shikiConfig: {
            theme: 'github-dark-dimmed',
            langs: ['javascript', 'typescript', 'jsx', 'tsx', 'css', 'html', 'astro', 'markdown', 'bash', 'json', 'yaml', 'python', 'rust', 'go', 'sql'],
            wrap: true,
        },
    },
    image: {
        remotePatterns: [{ protocol: "https" }],
    },
    build: {
        inlineStylesheets: "auto",
    },
    vite: {
        build: {
            rollupOptions: {
                external: [],
            },
        },
    },
});
