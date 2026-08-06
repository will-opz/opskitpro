const BLOG_TOOL_DESTINATIONS = {
  "ai-coding-playwright-smoke-test": "/tools/network-check",
  "api-v0-release": "/tools/api",
  "cloudflare-522": "/tools/website-check",
  "cloudflare-dual-stack": "/tools/network-check",
  "design-principles": "/tools",
  "diagnostic-tools-evidence-not-scores": "/tools/website-check",
  "diagnostic-tools-overview": "/tools/website-check",
  "ip-dns-module": "/tools/dns-lookup",
  "json-tool": "/tools/json",
  "network-doctor-upgrade": "/tools/network-check",
  "network-metric-observation-point": "/tools/network-check",
  "open-graph-social-preview-guide": "/tools/website-check",
  "passgen-tool": "/tools/passgen",
  "public-api-error-contract-for-diagnostic-tools": "/tools/api",
  "qrgen-tool": "/tools/qrgen",
  "retired-wrangler-kept-cloudflare-edge": "/tools/api",
  "services-deployment": "/tools",
  "single-node-rate-limiting-without-redis": "/tools/api",
  "ssrf-protection-public-diagnostic-apis": "/tools/api",
  "tls-health-vs-https": "/tools/website-check",
  "underestimating-git": "/tools",
  "vibe-coding-workflow": "/tools/prompt-builder",
  "website-check-module": "/tools/website-check",
  "website-diagnostic-report": "/tools/website-check",
  "websocket-tool": "/tools/websocket",
  "why-opskitpro": "/tools",
} as const;

export const retiredBlogSlugs = Object.keys(BLOG_TOOL_DESTINATIONS);

export function getRetiredBlogDestination(slug: string) {
  return BLOG_TOOL_DESTINATIONS[
    slug as keyof typeof BLOG_TOOL_DESTINATIONS
  ];
}
