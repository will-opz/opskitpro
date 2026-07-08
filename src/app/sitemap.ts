import { MetadataRoute } from "next";

import { getCloudflareErrors } from "@/content/cloudflare-errors";
import { getAllBlogPosts } from "@/lib/blog";
import { ACTIVE_LOCALES } from "@/lib/i18n";
import { buildLanguageAlternates, SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseRoutes = [
    "",
    "/services",
    "/blog",
    "/about",
    "/errors",
    "/tools/website-check",
    "/tools/network-check",
    "/tools/cloudflare-trace",
    "/tools/ip-lookup",
    "/tools/dns-lookup",
    "/tools/passgen",
    "/tools/qrgen",
    "/tools/json",
    "/tools/websocket",
    "/tools/time",
    "/tools/encode",
    "/tools/prompt-builder",
    "/tools/api",
  ];

  const errorRoutes = getCloudflareErrors().map((e) => `/errors/${e.code}`);

  // Fetch all blog posts
  const blogRoutes = getAllBlogPosts("en").map((post) => `/blog/${post.slug}`);

  const routes = [...baseRoutes, ...errorRoutes, ...blogRoutes];

  const lowPriorityTools = [
    "/tools/passgen",
    "/tools/qrgen",
    "/tools/json",
    "/tools/websocket",
    "/tools/time",
    "/tools/encode",
    "/tools/prompt-builder",
  ];

  const allEntries: MetadataRoute.Sitemap = [];

  routes.forEach((route) => {
    let priority = 0.7;
    if (route === "") priority = 1.0;
    else if (route.startsWith("/errors/")) priority = 0.8;
    else if (route.startsWith("/blog/")) priority = 0.8;
    else if (route.startsWith("/tools/")) {
      priority = lowPriorityTools.includes(route) ? 0.6 : 0.9;
    }

    const alternates = buildLanguageAlternates(route);

    ACTIVE_LOCALES.forEach((locale) => {
      // Construct the localized URL
      const url = `${SITE_URL}/${locale}${route}`;

      allEntries.push({
        url,
        lastModified: new Date(),
        changeFrequency: route === "" ? "daily" : "weekly",
        priority,
        alternates: {
          languages: alternates,
        },
      });
    });
  });

  return allEntries;
}
