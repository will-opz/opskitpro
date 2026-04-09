import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://opskitpro.com'
  const locales = ['', '/zh', '/en', '/ja', '/tw']
  const routes = [
    '',
    '/services',
    '/blog',
    '/about',
    '/tools/website-check',
    '/tools/ip-lookup',
    '/tools/dns-lookup',
    '/tools/passgen',
    '/tools/qrgen',
    '/tools/json',
    '/tools/websocket',
  ]

  const sitemapEntries: MetadataRoute.Sitemap = []

  // Generate entries for all route and locale combinations
  for (const locale of locales) {
    for (const route of routes) {
      // Don't double slash for root
      const fullPath = `${locale}${route}`
      sitemapEntries.push({
        url: `${baseUrl}${fullPath}`,
        lastModified: new Date(),
        changeFrequency: route === '' ? 'daily' : 'weekly',
        priority: route === '' ? 1.0 : 0.8,
      })
    }
  }

  return sitemapEntries
}
