import { defineConfig, devices } from '@playwright/test'
import { existsSync } from 'node:fs'

const homebrewNode = '/opt/homebrew/bin/node'
const nodeBin = process.env.PLAYWRIGHT_NODE_PATH
  || (process.execPath.includes('/Codex.app/') && existsSync(homebrewNode) ? homebrewNode : process.execPath)
const testPort = process.env.PLAYWRIGHT_PORT || '3000'
const testBaseUrl = `http://127.0.0.1:${testPort}`

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
    baseURL: testBaseUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `${JSON.stringify(nodeBin)} ./node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port ${testPort}`,
    url: testBaseUrl,
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
