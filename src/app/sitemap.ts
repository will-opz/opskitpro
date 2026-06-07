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

  const lowPriorityTools = [
    '/tools/passgen',
    '/tools/qrgen',
    '/tools/json',
    '/tools/websocket',
    '/tools/time',
    '/tools/encode',
    '/tools/prompt-builder',
  ]

  return routes.map((route) => {
    // Construct the canonical URL (naked or default locale)
    const url = `${baseUrl}${route}`
    
    let priority = 0.7
    if (route === '') priority = 1.0
    else if (route.startsWith('/errors/')) priority = 0.8
    else if (route.startsWith('/tools/')) {
      priority = lowPriorityTools.includes(route) ? 0.6 : 0.9
    }
    
    return {
      url,
      lastModified: new Date(),
      changeFrequency: route === '' ? 'daily' : 'weekly',
      priority,
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
