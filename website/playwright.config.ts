import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests',use:{baseURL:'http://127.0.0.1:4321'},webServer:{command:'bun run dev',url:'http://127.0.0.1:4321',reuseExistingServer:!process.env.CI}});
