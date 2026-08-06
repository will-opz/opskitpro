import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ToolGuide } from "@/components/ToolGuide";
import { getDictionary } from "@/dictionaries";
import { buildPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const lang = ((await params).lang || "en") as "zh" | "en";

  const title = "Public JSON API for DNS, IP and HTTP Checks | OpsKitPro";
  const description =
    "Use OpsKitPro Public JSON API to run DNS lookup, IP lookup, and HTTP checks from curl, scripts, and automation workflows.";

  return buildPageMetadata(title, description, lang, "/tools/api");
}

export default async function ApiDocsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const lang = ((await params).lang || "en") as "zh" | "en";
  const dict = await getDictionary(lang);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <SiteHeader dict={dict} lang={lang} />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 sm:py-12 mt-16">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-12 prose prose-slate max-w-none prose-headings:font-semibold prose-a:text-emerald-600">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-4">
            OpsKitPro Public JSON API (v0)
          </h1>
          <p className="text-lg text-slate-600 mb-8">
            The OpsKitPro Public JSON API provides programmatic access to our
            core diagnostic tools. Integrate DNS lookups, IP intel, and HTTP
            checks directly into your CI/CD pipelines, shell scripts, or AI
            Agent workflows.
          </p>

          <hr className="border-slate-100 my-8" />

          <h2>1. Overview</h2>
          <p>
            All API endpoints return standard JSON responses and are optimized
            for <code>curl</code> and automation scripts. The current v0 API
            includes three core endpoints:
          </p>
          <ul>
            <li>
              <code>/api/tools/dns-lookup</code>
            </li>
            <li>
              <code>/api/tools/ip-lookup</code>
            </li>
            <li>
              <code>/api/tools/http-check</code>
            </li>
          </ul>

          <h2>2. Authentication</h2>
          <p>
            <strong>Not required for v0.</strong> The API is completely public
            and open for use without any API keys or registration.
          </p>

          <h2>3. Rate Limits</h2>
          <p>
            To prevent abuse while keeping lightweight automation usable,
            public endpoints use tiered per-IP limits based on probe cost:
          </p>
          <ul>
            <li>
              <strong>Low-cost lookups:</strong>{" "}
              <code>/api/tools/dns-lookup</code> and{" "}
              <code>/api/tools/ip-lookup</code> allow{" "}
              <strong>60 requests per minute</strong>.
            </li>
            <li>
              <strong>Medium-cost checks:</strong>{" "}
              <code>/api/tools/http-check</code> and <code>/api/trace</code>{" "}
              allow <strong>15 requests per minute</strong>.
            </li>
            <li>
              <strong>Full diagnostics:</strong> <code>/api/diagnostic</code>{" "}
              allows <strong>3 requests per minute</strong>.
            </li>
          </ul>
          <p>
            Rate-limited responses return <code>429 Too Many Requests</code>{" "}
            with <code>X-RateLimit-Limit</code>,{" "}
            <code>X-RateLimit-Remaining</code>,{" "}
            <code>X-RateLimit-Reset</code>, and <code>Retry-After</code>{" "}
            headers.
          </p>

          <h2>4. Common Response Format</h2>
          <p>
            Every successful API response follows this standard JSON envelope:
          </p>
          <pre className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <code className="text-sm text-slate-800">
              {`{
  "ok": true,
  "tool": "dns-lookup",
  "input": { ... },
  "result": { ... },
  "meta": {
    "durationMs": 142,
    "timestamp": "2026-06-23T00:00:00.000Z"
  }
}`}
            </code>
          </pre>

          <h2>5. Error Format</h2>
          <p>
            If a request fails (e.g., validation error, rate limit, or security
            block), the response will include an <code>error</code> object:
          </p>
          <pre className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <code className="text-sm text-slate-800">
              {`{
  "ok": false,
  "tool": "http-check",
  "input": { ... },
  "error": {
    "code": "SSRF_BLOCKED",
    "message": "Security Exception: Private IP addresses are not allowed."
  },
  "meta": { ... }
}`}
            </code>
          </pre>

          <hr className="border-slate-100 my-10" />

          <h2>6. DNS Lookup API</h2>
          <p>Fetch DNS records (A, AAAA, MX, TXT, CNAME, NS) for any domain.</p>
          <ul>
            <li>
              <strong>Endpoint:</strong>{" "}
              <code>GET https://opskitpro.com/api/tools/dns-lookup</code>
            </li>
            <li>
              <strong>Parameters:</strong> <code>domain</code> (required),{" "}
              <code>type</code> (optional, defaults to all)
            </li>
          </ul>
          <pre className="bg-slate-800 rounded-lg p-4 mb-4 overflow-x-auto">
            <code className="text-sm text-emerald-400">
              curl -s
              "https://opskitpro.com/api/tools/dns-lookup?domain=example.com" |
              jq
            </code>
          </pre>

          <h2>7. IP Lookup API</h2>
          <p>
            Retrieve geolocation, ASN, and network provider context for any IPv4
            or IPv6 address.
          </p>
          <ul>
            <li>
              <strong>Endpoint:</strong>{" "}
              <code>GET https://opskitpro.com/api/tools/ip-lookup</code>
            </li>
            <li>
              <strong>Parameters:</strong> <code>ip</code> (optional, defaults
              to requester's IP)
            </li>
          </ul>
          <pre className="bg-slate-800 rounded-lg p-4 mb-4 overflow-x-auto">
            <code className="text-sm text-emerald-400">
              curl -s "https://opskitpro.com/api/tools/ip-lookup?ip=8.8.8.8" |
              jq
            </code>
          </pre>

          <h2>8. HTTP Check API</h2>
          <p>
            Perform an HTTP GET request to check status codes, headers, and
            redirect chains.
          </p>
          <ul>
            <li>
              <strong>Endpoint:</strong>{" "}
              <code>GET https://opskitpro.com/api/tools/http-check</code>
            </li>
            <li>
              <strong>Parameters:</strong> <code>url</code> (required, must
              start with http:// or https://)
            </li>
          </ul>
          <pre className="bg-slate-800 rounded-lg p-4 mb-4 overflow-x-auto">
            <code className="text-sm text-emerald-400">
              curl -s
              "https://opskitpro.com/api/tools/http-check?url=https://example.com"
              | jq
            </code>
          </pre>

          <hr className="border-slate-100 my-10" />

          <h2>9. Security Restrictions (SSRF Protection)</h2>
          <p>
            The OpsKitPro backend is heavily fortified against Server-Side
            Request Forgery (SSRF) and DNS Rebinding attacks. The following
            restrictions apply to tools that make outbound network requests
            (like HTTP Check):
          </p>
          <ul>
            <li>
              Requests to private subnets (<code>10.x.x.x</code>,{" "}
              <code>192.168.x.x</code>, etc.) are blocked.
            </li>
            <li>
              Requests to loopback/link-local addresses (<code>127.0.0.1</code>,{" "}
              <code>localhost</code>, <code>169.254.x.x</code>) are blocked.
            </li>
            <li>
              Unusual ports are restricted; only <code>80</code>,{" "}
              <code>443</code>, <code>8080</code>, and <code>8443</code> are
              allowed.
            </li>
            <li>
              The HTTP Check API will manually follow redirects up to 5 times.
              It explicitly runs SSRF validation checks on the target of{" "}
              <strong>every</strong> redirect hop.
            </li>
          </ul>

          <h2>10. CORS Policy</h2>
          <p>
            The Public JSON API v0 is meant for public, read-only consumption.
            It currently responds with{" "}
            <code>Access-Control-Allow-Origin: *</code>. You can safely fetch
            these endpoints directly from client-side JavaScript in browsers.
          </p>
        </div>
      </main>

      <ToolGuide id="api" lang={lang} />

      <SiteFooter dict={dict} />
    </div>
  );
}
