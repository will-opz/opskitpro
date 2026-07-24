/** @type {import('next').NextConfig} */

// AdSense domains that Auto ads may use dynamically.
// This list covers the current known set; use Content-Security-Policy-Report-Only
// to detect any additional domains before tightening to nonce + strict-dynamic.
const ADSENSE_SCRIPT_DOMAINS = [
  'https://pagead2.googlesyndication.com',
  'https://securepubads.g.doubleclick.net',
  'https://cdn.jsdelivr.net',
].join(' ')

const ADSENSE_FRAME_DOMAINS = [
  'https://googleads.g.doubleclick.net',
  'https://tpc.googlesyndication.com',
  'https://*.googlesyndication.com',
  'https://*.doubleclick.net',
].join(' ')

const cspDirectives = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${ADSENSE_SCRIPT_DOMAINS}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https: wss: ws:",
  `frame-src 'self' ${ADSENSE_FRAME_DOMAINS}`,
  "worker-src 'self' blob:",
]

const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
  {
    key: 'Content-Security-Policy',
    value: cspDirectives.join('; '),
  },
  // Report-Only: same policy as above, violations are reported to DevTools
  // (Console → CSP) without blocking any resource. Use this to discover
  // additional AdSense domains before migrating to nonce + strict-dynamic.
  {
    key: 'Content-Security-Policy-Report-Only',
    value: cspDirectives.join('; '),
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), browsing-topics=()',
  },
]


const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/tools/ip',
        destination: '/tools/ip-lookup', // Middleware will handle the language prefix automatically
        permanent: true, // 301 redirect for SEO
      },
      {
        source: '/zh/tools/ip',
        destination: '/zh/tools/ip-lookup',
        permanent: true,
      },
      {
        source: '/en/tools/ip',
        destination: '/en/tools/ip-lookup',
        permanent: true,
      }
    ]
  },
  // Middleware handles the /zh and /en path mapping and locale cookies
};

export default nextConfig;
