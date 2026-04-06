import 'server-only'
import en from './dictionaries/en.json'
import zh from './dictionaries/zh.json'

const dictionaries: any = {
  en,
  zh,
}

export const getDictionary = async (locale: 'en' | 'zh') => {
  return dictionaries[locale] || dictionaries.zh
}
