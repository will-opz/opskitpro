export const ACTIVE_LOCALES = ['en', 'zh'] as const
export const RETIRED_LOCALES = ['ja', 'tw'] as const
export const ALL_LOCALES = [...ACTIVE_LOCALES, ...RETIRED_LOCALES] as const

export type ActiveLocale = (typeof ACTIVE_LOCALES)[number]
export type RetiredLocale = (typeof RETIRED_LOCALES)[number]
export type Locale = ActiveLocale

export const DEFAULT_LOCALE: ActiveLocale = 'en'

export const RETIRED_LOCALE_REDIRECTS: Record<RetiredLocale, ActiveLocale> = {
  ja: 'en',
  tw: 'zh',
}

export const LOCALE_MAP: Record<ActiveLocale, string> = {
  en: 'en-US',
  zh: 'zh-CN',
}

export function isActiveLocale(value: string | undefined | null): value is ActiveLocale {
  return ACTIVE_LOCALES.includes(value as ActiveLocale)
}

export function isRetiredLocale(value: string | undefined | null): value is RetiredLocale {
  return RETIRED_LOCALES.includes(value as RetiredLocale)
}

export function getLocaleFromPathname(pathname: string) {
  return pathname.split('/')[1] || ''
}

export function getGeoDefaultLocale(country: string | undefined | null): ActiveLocale {
  if (country === 'CN' || country === 'TW' || country === 'HK' || country === 'MO') {
    return 'zh'
  }

  return DEFAULT_LOCALE
}
