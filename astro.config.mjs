import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://cyberCharl.github.io',
  base: '/newlands-cottages-website',

  vite: {
    plugins: [tailwindcss()]
  }
});