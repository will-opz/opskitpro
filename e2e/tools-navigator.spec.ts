import { expect, test } from '@playwright/test'

test.beforeEach(async ({ context, page }) => {
  await context.addCookies([
    {
      name: 'NEXT_LOCALE',
      value: 'en',
      domain: '127.0.0.1',
      path: '/',
    },
  ])

  await page.route('https://pagead2.googlesyndication.com/**', (route) => route.abort())
})

test('tools navigator searches default links', async ({ page }) => {
  await page.goto('/tools')

  await expect(page.getByRole('heading', { name: 'Tool Navigator' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sign in to edit' })).not.toBeVisible()
  await expect(page.getByRole('heading', { name: 'Website Check' })).toBeVisible()

  await page.getByRole('searchbox').fill('cloudflare')

  await expect(page.getByRole('searchbox')).toHaveValue('cloudflare')
  await expect(page.getByRole('heading', { name: 'Cloudflare Dashboard' })).toBeVisible()
})

test('single-user editor can add a custom local link', async ({ page }) => {
  await page.route('**/api/admin/session', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ authenticated: true }),
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ authenticated: false, configured: true }),
    })
  })

  await page.goto('/tools?admin=1')
  await page.waitForLoadState('networkidle')

  await page.getByRole('button', { name: 'Sign in to edit' }).click()
  await page.getByLabel('Admin password').fill('test-password')
  await page.locator('form').getByRole('button', { name: 'Sign in to edit' }).click()

  await expect(page.getByRole('button', { name: 'Add link' })).toBeVisible()
  await page.getByRole('button', { name: 'Add link' }).click()
  await page.getByLabel('Name').fill('Hermes Dashboard')
  await page.getByLabel('URL').fill('http://127.0.0.1:4173')
  await page.getByLabel('Description').fill('Local private operations dashboard')
  await page.getByLabel('Tags').fill('ops, dashboard')
  await page.getByRole('button', { name: 'Save' }).click()

  await expect(page.getByRole('heading', { name: 'Hermes Dashboard' })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Hermes Dashboard' })).toBeVisible()
})
