import { Metadata } from 'next'

export type Lang = 'zh' | 'en' | 'ja' | 'tw'

export const SITE_URL = 'https://opskitpro.com'

export const LOCALE_MAP: Record<Lang, string> = {
  en: 'en-US',
  zh: 'zh-CN',
  ja: 'ja-JP',
  tw: 'zh-TW',
}

/**
 * Builds language alternates for a given path.
 * @param path - The path without language prefix, e.g., '/blog/json-tool' or '' for home
 * @returns The alternates.languages object
 */
export function buildLanguageAlternates(path: string) {
  // Ensure path starts with a slash if it's not empty
  const safePath = path && !path.startsWith('/') ? `/${path}` : path
  
  return {
    'en-US': `${SITE_URL}/en${safePath}`,
    'zh-CN': `${SITE_URL}/zh${safePath}`,
    'ja-JP': `${SITE_URL}/ja${safePath}`,
    'zh-TW': `${SITE_URL}/tw${safePath}`,
    'x-default': `${SITE_URL}/en${safePath}`,
  }
}

/**
 * Builds the canonical URL for a given language and path.
 * @param path - The path without language prefix, e.g., '/blog/json-tool' or ''
 * @param lang - The current language
 * @returns The full canonical URL
 */
export function buildCanonicalUrl(path: string, lang: Lang) {
  const safePath = path && !path.startsWith('/') ? `/${path}` : path
  return `${SITE_URL}/${lang}${safePath}`
}

/**
 * Builds common page metadata including canonical and hreflang alternates.
 */
export function buildPageMetadata(
  title: string,
  description: string,
  lang: Lang,
  path: string,
  extraMetadata?: Partial<Metadata>
): Metadata {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: buildCanonicalUrl(path, lang),
      siteName: 'OpsKitPro',
      locale: LOCALE_MAP[lang],
      type: 'website',
      ...(extraMetadata?.openGraph || {}),
    },
    alternates: {
      canonical: buildCanonicalUrl(path, lang),
      languages: buildLanguageAlternates(path),
    },
    ...extraMetadata,
  }
}

/**
 * Generates JSON-LD for technical blog articles.
 */
export function buildTechArticleJsonLd(params: {
  headline: string
  description: string
  datePublished: string
  authorName?: string
  imageUrl?: string
  url: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: params.headline,
    description: params.description,
    datePublished: params.datePublished,
    author: {
      '@type': 'Person',
      name: params.authorName || 'OpsKitPro Team',
    },
    publisher: {
      '@type': 'Organization',
      name: 'OpsKitPro',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.svg`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': params.url,
    },
    ...(params.imageUrl ? { image: [`${SITE_URL}${params.imageUrl}`] } : {}),
  }
}

/**
 * Generates JSON-LD for Web Application / Tools.
 */
export function buildToolJsonLd(params: {
  name: string
  description: string
  url: string
  applicationCategory?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: params.name,
    description: params.description,
    url: params.url,
    applicationCategory: params.applicationCategory || 'DeveloperApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  }
}
