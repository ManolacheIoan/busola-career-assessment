const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    reducedMotion: 'reduce',
    // locally use the installed Google Chrome; CI installs Playwright's Chromium
    channel: process.env.CI ? undefined : 'chrome',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'node scripts/serve.js',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
});
