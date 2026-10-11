import { defineConfig, devices } from '@playwright/test';

const chromiumArgs = [
  '--use-fake-ui-for-media-stream',
  '--use-fake-device-for-media-stream',
  '--enable-unsafe-webgpu'
];

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
    permissions: ['camera'],
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: { args: chromiumArgs }
      },
    },
    {
      name: 'iphone',
      use: {
        ...devices['iPhone 13']
      },
    },
    {
      name: 'android-tablet',
      use: {
        ...devices['Galaxy Tab S4'],
        launchOptions: { args: chromiumArgs }
      },
    }
  ],
  webServer: {
    command: 'npx serve public -p 3000',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
