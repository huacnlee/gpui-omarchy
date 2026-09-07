import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
  site: process.env.SITE_URL || 'https://huacnlee.github.io/gpui-omarchy/',
  base: process.env.BASE_PATH || '/',
  devToolbar: { enabled: false },
  integrations: [react()],
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'tokyo-night' },
      defaultColor: 'dark',
    },
  },
  vite: {
    plugins: [
      tailwindcss(),
      {
        name: 'separate-build-and-dev-cache',
        config: (_, { command }) => ({ cacheDir: `node_modules/.vite-${command}` }),
      },
    ],
  },
});
