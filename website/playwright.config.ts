import { defineConfig } from '@playwright/test';

const previewURL = process.env.PLAYWRIGHT_BASE_URL;
const production = process.env.PLAYWRIGHT_PRODUCTION === '1';
const localURL = production ? 'http://127.0.0.1:4323/gpui-omarchy/' : 'http://127.0.0.1:4321';
export default defineConfig({
  testDir: './tests',
  use: { screenshot: 'only-on-failure', trace: 'retain-on-failure', baseURL: previewURL || localURL, launchOptions: { args: ['--enable-unsafe-webgpu', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } },
  webServer: previewURL ? undefined : {
    command: production ? 'BASE_PATH=/gpui-omarchy bun run preview --port 4323' : 'bun run dev',
    url: localURL,
    reuseExistingServer: !process.env.CI,
  },
});
