import { isActiveLocale } from "@/lib/i18n";

export function resolveLocalizedHref(
  lang: string,
  href?: string,
  fallback = "#",
) {
  const normalized = href?.trim();
  if (!normalized) return fallback;

  if (/^https?:\/\//i.test(normalized) || normalized.startsWith("#")) {
    return normalized;
  }

  const path = normalized.startsWith("/") ? normalized : `/${normalized}`;
  const pathLocale = path.split("/")[1];
  if (isActiveLocale(pathLocale)) return path;

  return `/${lang}${path}`;
}
