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

const ADMIN_COOKIE_NAME = "opskitpro_admin";
const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
const CLOUDFLARE_ACCESS_EMAIL_HEADER = "cf-access-authenticated-user-email";

function isLocaleNeutralPublicPath(pathname: string) {
  if (pathname === "/" || pathname === "/about" || pathname === "/services") {
    return true;
  }

  return ["/blog", "/errors", "/tools"].some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

async function sha256(value: string) {
  const input = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", input);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function getAllowedAdminEmails() {
  return (process.env.OPSKITPRO_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

async function attachCloudflareAccessAdminCookie(
  request: NextRequest,
  response: NextResponse,
) {
  const token = await getCloudflareAccessAdminToken(request);
  if (!token) return response;

  if (request.cookies.get(ADMIN_COOKIE_NAME)?.value === token) {
    return response;
  }

  response.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ADMIN_COOKIE_MAX_AGE,
    path: "/",
  });

  return response;
}

async function getCloudflareAccessAdminToken(request: NextRequest) {
  const secret =
    process.env.OPSKITPRO_ADMIN_SECRET ||
    process.env.OPSKITPRO_ADMIN_PASSWORD ||
    "";
  const accessEmail =
    request.headers.get(CLOUDFLARE_ACCESS_EMAIL_HEADER)?.trim().toLowerCase() ||
    "";
  const allowed = accessEmail && getAllowedAdminEmails().includes(accessEmail);

  if (!secret || !allowed) return "";
  return sha256(`cloudflare-access:${accessEmail}:${secret}`);
}

function injectCookie(headers: Headers, name: string, value: string) {
  const existingCookie = headers.get("cookie") || "";
  const withoutExisting = existingCookie
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part && !part.startsWith(`${name}=`))
    .join("; ");

  headers.set(
    "cookie",
    `${withoutExisting ? withoutExisting + "; " : ""}${name}=${value}`,
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
    return attachCloudflareAccessAdminCookie(
      request,
      NextResponse.redirect(url, 301),
    );
  }

  const pathLocale = getLocaleFromPathname(pathname);

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
    return attachCloudflareAccessAdminCookie(
      request,
      NextResponse.redirect(url, 301),
    );
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
    return attachCloudflareAccessAdminCookie(
      request,
      NextResponse.redirect(url, 301),
    );
  }

  // 1. Check if the pathname already has an active locale prefix
  const hasLocale = ACTIVE_LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  if (hasLocale || pathname.startsWith("/admin")) {
    // Already localized or is admin path. Let the Next.js page handle it natively.
    return attachCloudflareAccessAdminCookie(request, NextResponse.next());
  }

  // Unknown locale-neutral paths should reach the App Router directly so they
  // return one 404 response instead of a locale redirect followed by a 404.
  if (!isLocaleNeutralPublicPath(pathname)) {
    return attachCloudflareAccessAdminCookie(request, NextResponse.next());
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

  return attachCloudflareAccessAdminCookie(request, response);
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, api, static assets)
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
