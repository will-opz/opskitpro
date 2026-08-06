import { test, expect } from '@playwright/test'

test.describe('Cloudflare Error Encyclopedia', () => {
  test('should render the errors index page correctly', async ({ page }) => {
    await page.goto('/errors')
    
    // Check main title
    await expect(page.locator('h1')).toContainText('Cloudflare Error Encyclopedia')
    
    // Check if error cards are rendered
    const cards = page.locator('a[href^="/errors/"]')
    expect(await cards.count()).toBeGreaterThanOrEqual(10)
    
    // Check specific error code presence
    await expect(page.locator('text=Error 522')).toBeVisible()
    await expect(page.locator('text=Error 1020')).toBeVisible()
  })

  test('should render error details page with JSON-LD', async ({ page }) => {
    await page.goto('/errors/522')
    
    // Check title
    await expect(page.locator('h1')).toContainText('Connection timed out')
    await expect(page.locator('text=Cloudflare Error 522')).toBeVisible()
    
    // Check SRE Troubleshooting section
    await expect(page.locator('h2')).toContainText('Troubleshooting Guide')

    // Check JSON-LD
    const jsonLdScripts = await page.locator('script[type="application/ld+json"]').allInnerTexts()
    expect(jsonLdScripts.length).toBeGreaterThanOrEqual(3) // Breadcrumb, FAQ, Article
    
    const combinedJsonLd = jsonLdScripts.join('\n')
    expect(combinedJsonLd).toContain('BreadcrumbList')
    expect(combinedJsonLd).toContain('FAQPage')
    expect(combinedJsonLd).toContain('TechArticle')
    expect(combinedJsonLd).toContain('Cloudflare Error 522')
  })

  test('should support language switching', async ({ page }) => {
    // Navigate with zh cookie
    await page.context().addCookies([{ name: 'NEXT_LOCALE', value: 'zh', domain: '127.0.0.1', path: '/' }])
    await page.goto('/errors/522')
    
    await expect(page.locator('h1')).toContainText('Connection timed out')
    await expect(page.locator('h2')).toContainText('排障指南') // Should be translated
    
    const causesText = await page.locator('text=常见原因').innerText()
    expect(causesText).toBeTruthy()
  })
})
