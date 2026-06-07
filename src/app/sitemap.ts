import { MetadataRoute } from 'next'

import { getCloudflareErrors } from '@/content/cloudflare-errors'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://opskitpro.com'
  const baseRoutes = [
    '',
    '/services',
    '/blog',
    '/about',
    '/errors',
    '/tools/website-check',
    '/tools/network-check',
    '/tools/cloudflare-trace',
    '/tools/ip-lookup',
    '/tools/dns-lookup',
    '/tools/passgen',
    '/tools/qrgen',
    '/tools/json',
    '/tools/websocket',
    '/tools/time',
    '/tools/encode',
    '/tools/prompt-builder',
  ]

  const errorRoutes = getCloudflareErrors().map(e => `/errors/${e.code}`)
  const routes = [...baseRoutes, ...errorRoutes]

  const supportedLocales = ['en', 'zh', 'ja', 'tw']

  return routes.map((route) => {
    // Construct the canonical URL (naked or default locale)
    const url = `${baseUrl}${route}`
    
    return {
      url,
      lastModified: new Date(),
      changeFrequency: route === '' ? 'daily' : 'weekly',
      priority: route === '' ? 1.0 : route.startsWith('/tools/') ? 0.9 : route.startsWith('/errors/') ? 0.8 : 0.7,
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
