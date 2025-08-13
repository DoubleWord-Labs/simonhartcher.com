// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import alpinejs from '@astrojs/alpinejs';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://simonhartcher.com',
  integrations: [
    mdx(),
    alpinejs(),
    sitemap()
  ],
  image: {
    remotePatterns: [{ protocol: "https" }],
  },
  build: {
    inlineStylesheets: 'auto'
  },
  vite: {
    build: {
      rollupOptions: {
        external: []
      }
    }
  }
});
