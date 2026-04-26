import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://opskitpro.com'
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
    '/tools/time',
    '/tools/encode',
  ]

  const supportedLocales = ['en', 'zh', 'ja', 'tw']

  return routes.map((route) => {
    // Construct the canonical URL (naked or default locale)
    const url = `${baseUrl}${route}`
    
    return {
      url,
      lastModified: new Date(),
      changeFrequency: route === '' ? 'daily' : 'weekly',
      priority: route === '' ? 1.0 : 0.8,
      alternates: {
        languages: Object.fromEntries(
          supportedLocales.map((locale) => [
            locale,
            `${baseUrl}/${locale}${route === '' ? '' : route}`
          ])
        )
      }
    }
  })
}
