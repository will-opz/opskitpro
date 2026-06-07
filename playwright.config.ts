import { defineConfig, devices } from '@playwright/test'
import { existsSync } from 'node:fs'

const homebrewNode = '/opt/homebrew/bin/node'
const nodeBin = process.env.PLAYWRIGHT_NODE_PATH
  || (process.execPath.includes('/Codex.app/') && existsSync(homebrewNode) ? homebrewNode : process.execPath)

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `${JSON.stringify(nodeBin)} ./node_modules/next/dist/bin/next dev --hostname 127.0.0.1`,
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },
  ],
})
