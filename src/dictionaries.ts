import 'server-only'
import en from './dictionaries/en.json'
import zh from './dictionaries/zh.json'
import ja from './dictionaries/ja.json'
import tw from './dictionaries/tw.json'
import { type Locale } from '@/lib/i18n'

const dictionaries: any = {
  en,
  zh,
  ja,
  tw,
}

export const getDictionary = async (locale: Locale) => {
  return dictionaries[locale] || dictionaries.zh
}
