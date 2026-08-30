import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

const SITE_URL =
  process.env.SITE_URL ??
  (process.env.CONTEXT === 'production' ? process.env.URL : process.env.DEPLOY_PRIME_URL);

export default defineConfig({
  // e.g. https://newlands-cottages.com
  site: SITE_URL,

  base: process.env.BASE_URL ?? '/',

  vite: {
    plugins: [tailwindcss()],
  },
});
