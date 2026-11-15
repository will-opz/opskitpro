import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ACTIVE_LOCALES,
  RETIRED_LOCALE_REDIRECTS,
  getGeoDefaultLocale,
  getLocaleFromPathname,
  isActiveLocale,
  isRetiredLocale,
} from "@/lib/i18n";
import { getRetiredBlogDestination } from "@/lib/blog-retirement";

function isLocaleNeutralPublicPath(pathname: string) {
  if (pathname === "/" || pathname === "/about" || pathname === "/services") {
    return true;
  }

  return ["/blog", "/errors", "/tools"].some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function getForwardedHost(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-host") || request.headers.get("host") || ""
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const url = request.nextUrl.clone();

  // 0. Force HTTPS in production
  const proto = request.headers.get("x-forwarded-proto");
  if (process.env.NODE_ENV === "production" && proto === "http") {
    const forwardedHost = getForwardedHost(request);
    if (forwardedHost) {
      url.host = forwardedHost;
      if (!forwardedHost.includes(":")) {
        url.port = "";
      }
    }
    url.protocol = "https:";
    return NextResponse.redirect(url, 301);
  }

  const pathLocale = getLocaleFromPathname(pathname);

  if (isActiveLocale(pathLocale)) {
    const localizedBlogPath = pathname.match(/^\/(en|zh)\/blog(?:\/([^/]+))?$/);
    if (localizedBlogPath) {
      const slug = localizedBlogPath[2];
      const destination = slug
        ? getRetiredBlogDestination(slug)
        : "/tools";

      if (destination) {
        const forwardedHost = getForwardedHost(request);
        if (forwardedHost) {
          url.host = forwardedHost;
          if (!forwardedHost.includes(":")) {
            url.port = "";
          }
        }
        url.pathname = `/${pathLocale}${destination}`;
        return NextResponse.redirect(url, 301);
      }
    }
  }

  if (
    (isActiveLocale(pathLocale) || isRetiredLocale(pathLocale)) &&
    (pathname === `/${pathLocale}/admin` ||
      pathname.startsWith(`/${pathLocale}/admin/`))
  ) {
    const forwardedHost = getForwardedHost(request);
    if (forwardedHost) {
      url.host = forwardedHost;
      if (!forwardedHost.includes(":")) {
        url.port = "";
      }
    }
    url.pathname = pathname.replace(`/${pathLocale}/admin`, "/admin");
    return NextResponse.redirect(url, 301);
  }

  if (isRetiredLocale(pathLocale)) {
    const targetLocale = RETIRED_LOCALE_REDIRECTS[pathLocale];
    const forwardedHost = getForwardedHost(request);
    if (forwardedHost) {
      url.host = forwardedHost;
      if (!forwardedHost.includes(":")) {
        url.port = "";
      }
    }
    url.pathname = pathname.replace(`/${pathLocale}`, `/${targetLocale}`);
    return NextResponse.redirect(url, 301);
  }

  // 1. Check if the pathname already has an active locale prefix
  const hasLocale = ACTIVE_LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  if (hasLocale || pathname.startsWith("/admin")) {
    // Already localized or is admin path. Let the Next.js page handle it natively.
    return NextResponse.next();
  }

  // Unknown locale-neutral paths should reach the App Router directly so they
  // return one 404 response instead of a locale redirect followed by a 404.
  if (!isLocaleNeutralPublicPath(pathname)) {
    return NextResponse.next();
  }

  // 2. If no locale, we REDIRECT to a localized path.
  const currentCookie = request.cookies.get("NEXT_LOCALE")?.value;

  const country = request.headers.get("cf-ipcountry") || "";
  const defaultLocale = getGeoDefaultLocale(country);

  const locale = isActiveLocale(currentCookie) ? currentCookie : defaultLocale;

  const forwardedHost = getForwardedHost(request);
  if (forwardedHost) {
    url.host = forwardedHost;
    if (!forwardedHost.includes(":")) {
      url.port = "";
    }
  }

  url.pathname = `/${locale}${pathname}`;
  const response = NextResponse.redirect(url, 307);

  // Set cookie ONLY on the redirect response to avoid busting cache on static HTML (200 OK)
  if (currentCookie !== locale) {
    response.cookies.set("NEXT_LOCALE", locale, {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, api, static assets)
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
