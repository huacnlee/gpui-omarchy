import { defineConfig } from '@playwright/test';

const previewURL = process.env.PLAYWRIGHT_BASE_URL;
export default defineConfig({
  testDir: './tests',
  use: { baseURL: previewURL || 'http://127.0.0.1:4321' },
  webServer: previewURL ? undefined : {
    command: 'bun run dev',
    url: 'http://127.0.0.1:4321',
    reuseExistingServer: !process.env.CI,
  },
});
