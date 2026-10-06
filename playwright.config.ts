import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'iphone',
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'android-tablet',
      use: { ...devices['Galaxy Tab S4'] },
    }
  ],
  webServer: {
    command: 'npx serve public -p 3000',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
