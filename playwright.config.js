import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  webServer: {
    command: 'npx serve . -l 3939 --no-clipboard',
    port: 3939,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://localhost:3939',
  },
});
