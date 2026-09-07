import { defineConfig } from '@playwright/test';

const previewURL = process.env.PLAYWRIGHT_BASE_URL;
const production = process.env.PLAYWRIGHT_PRODUCTION === '1';
// Linux runners have no physical GPU. Route both ANGLE and WebGPU through
// software Vulkan; the macOS ANGLE flags alone can lose the Linux device.
const graphicsArgs = process.platform === 'linux'
  ? ['--enable-unsafe-webgpu', '--enable-features=Vulkan', '--use-angle=vulkan', '--use-vulkan=swiftshader', '--use-webgpu-adapter=swiftshader', '--disable-vulkan-surface']
  : ['--enable-unsafe-webgpu', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
const localURL = production ? 'http://127.0.0.1:4323/gpui-omarchy/' : 'http://127.0.0.1:4321';
export default defineConfig({
  testDir: './tests',
  use: { screenshot: 'only-on-failure', trace: 'retain-on-failure', baseURL: previewURL || localURL, launchOptions: { args: graphicsArgs } },
  webServer: previewURL ? undefined : {
    command: production ? 'BASE_PATH=/gpui-omarchy bun run preview --port 4323' : 'bun run dev',
    url: localURL,
    reuseExistingServer: !process.env.CI,
  },
});
