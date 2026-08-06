import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://opskitpro.com";

  return {
    rules: [
      {
        userAgent: [
          "OAI-SearchBot",
          "PerplexityBot",
          "Claude-SearchBot",
          "Claude-User",
          "Googlebot",
          "Google-Extended",
        ],
        allow: "/",
      },
      {
        userAgent: ["GPTBot", "ClaudeBot"],
        disallow: "/",
      },
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
