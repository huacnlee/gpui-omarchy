import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({ site: process.env.SITE_URL, base: process.env.BASE_PATH || '/', devToolbar: { enabled: false }, integrations: [react()], vite: { plugins: [tailwindcss()] } });
