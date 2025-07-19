import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

const SITE_URL =
  process.env.SITE_URL ??
  (process.env.CONTEXT === 'production' ? process.env.URL : process.env.DEPLOY_PRIME_URL);

export default defineConfig({
  site: SITE_URL, // e.g. https://newlands-cottages.com
  base: process.env.BASE_URL ?? '/',

  vite: {
    plugins: [tailwindcss()],
  },
});
