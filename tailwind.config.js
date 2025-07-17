export default {
  content: [
    './src/**/*.{astro,html,js,ts,jsx,tsx,vue,svelte}',
    './node_modules/flowbite/**/*.js',
  ],
  theme: { extend: {} },
  plugins: [require('flowbite/plugin'), require('tailwindcss/typography')],
};
