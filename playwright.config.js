import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45000,
  reporter: [['line'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:15174',
    viewport: { width: 1440, height: 1050 },
    browserName: 'chromium',
    video: 'on',
    trace: 'on',
    screenshot: 'on',
    launchOptions: process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } : {}
  },
  webServer: {
    command: 'pnpm dev --port 15174 --strictPort',
    url: 'http://127.0.0.1:15174',
    env: { VITE_USE_EMULATORS: 'true' },
    reuseExistingServer: false
  }
});
