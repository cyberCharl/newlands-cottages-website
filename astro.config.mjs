import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: process.env.SITE_URL || 'https://cyberCharl.github.io',
  base: process.env.BASE_URL || '/newlands-cottages-website',

  vite: {
    plugins: [tailwindcss()],
  },
});