import 'server-only'
import en from './dictionaries/en.json'
import zh from './dictionaries/zh.json'
import ja from './dictionaries/ja.json'
import tw from './dictionaries/tw.json'

const dictionaries: any = {
  en,
  zh,
  ja,
  tw,
}

export const getDictionary = async (locale: 'en' | 'zh' | 'ja' | 'tw') => {
  return dictionaries[locale] || dictionaries.zh
}
