# OpsKitPro Product Roadmap

OpsKitPro is evolving from a diagnostics-led site into a focused tool collection.
Website Check remains the professional anchor, while frequent, browser-first
utilities broaden everyday usefulness. AI is an enhancement inside specific
tasks, not a separate general chat product.

This public roadmap describes product direction only. Dates, private analytics,
promotion experiments, infrastructure operations, and internal decision logs
remain in the private Control Plane.

## Completed Foundations

- ✅ Next.js 16 standalone Node.js deployment on AWS Lightsail behind Cloudflare.
- ✅ English and Simplified Chinese public routes with SSG where practical.
- ✅ Website Check with DNS, HTTP, TLS, CDN, redirect, security-header, and
  multi-observation evidence.
- ✅ Network Doctor, DNS Security, IP Lookup, Cloudflare Trace, JSON, WebSocket,
  QR, encoding, time, and Prompt Builder tools.
- ✅ Tool-first homepage and catalog; public Blog module retired with controlled
  redirects for known legacy URLs.
- ✅ Answer-ready bilingual tool guidance, consistent structured data,
  `/api/tools`, and `/llms.txt` discovery surfaces.
- ✅ Privacy-minimal tool funnel and AI-referral classification boundaries.

## Password Generator — Focused Roadmap

The password product is an instant, browser-local generator. It does not manage,
store, synchronize, or check passwords against breach datasets.

### Completed foundation

- ✅ Compact secure generator on the homepage.
- ✅ Focused desktop/mobile workbench on the full tool page.
- ✅ Web Crypto generation with rejection sampling and enabled-set guarantees.
- ✅ Account, Wi-Fi, database/API, and easy-to-type presets.
- ✅ Random passwords, UUID, PIN, and 4–8 word passphrases.
- ✅ Length shortcuts, ambiguous/custom character exclusions, copy feedback,
  and local evidence-led strength findings.
- ✅ Current-page history limited to five entries and cleared on refresh/close.

### P0: Reliability and clarity

- Keep presets aligned with common website and Wi-Fi password policies without
  claiming universal compatibility.
- Improve mobile result wrapping, copy feedback, keyboard handling, and
  accessible strength/status announcements.
- Add focused tests for enabled character sets, exclusions, Unicode input,
  maximum length, and preset transitions.
- Keep the first useful password visible without requiring a setup click.

### P1: Better generation choices

- Improve passphrase word quality and separator controls while keeping all
  generation local and explaining that memorability is not a security promise.
- Consider a pronounceable-password mode only if it can preserve clear entropy
  guidance and avoid language/cultural bias.
- Provide compact, site-policy-oriented presets only when a real compatibility
  problem is observed; avoid accumulating niche switches.

### P2: Distribution and reuse

- Improve homepage-to-full-tool handoff and WeChat/mobile sharing guidance
  without including generated secrets in URLs or analytics.
- Consider installable/offline use only if repeat usage justifies the additional
  maintenance and update responsibility.
- Keep related-tool recommendations minimal and never auto-transfer generated
  passwords to another server-assisted tool.

### Explicitly out of scope

- Password vaults, password management, long-term storage, accounts, recovery,
  cloud or cross-device synchronization.
- Breach/password exposure lookup, including HIBP integration.
- Autofill, browser extensions, sharing, TOTP, passkey management, or enterprise
  credential administration.
- Claims that a generated password, strength indicator, or preset guarantees
  safety or compatibility.

Future password work must improve the generate → adjust → copy workflow. Any
proposal that introduces storage, identity, external password transmission, or
ongoing credential responsibility requires a new product and security review;
it is not an extension of the current generator roadmap.

## Current Focus

### Make Website Check exceptional

- Improve explanations, remediation, mobile ergonomics, report quality, and
  browser/edge/origin comparison.
- Add AI-crawler visibility evidence and AI-search readiness checks only when
  they reuse the diagnostic core and remain understandable without a score.
- Prefer in-context modes and remediation entry points over more global
  navigation items.

### Improve the small-tool experience

- Keep the homepage and global navigation concise.
- Prioritize browser-local, no-login tools that work well on phones and average
  networks.
- Evaluate practical Chinese-user scenarios such as image compression and
  conversion, OCR/text extraction, PDF/document handling, QR workflows, and
  date/unit/text conversion.
- Promote a tool only after real usage shows repeat demand.

### Task-specific AI assistance

Near-term candidates must have bounded inputs and outputs:

- AI crawler policy checker and remediation snippets.
- AI search readiness evidence.
- `llms.txt` generation and validation.
- Page-scoped metadata/schema assistance.
- Chinese scenarios such as WeChat titles/summaries, merchant copy, OCR
  structuring, and image-alt assistance.

General AI chat, AI detectors, humanizers, and generic article generators are
out of scope because they dilute the tool position and create avoidable accuracy,
cost, and compliance risks.

## Distribution and China Readiness

- Chinese education and promotion move toward WeChat Official Account tool
  demonstrations, before/after examples, short checklists, and direct tool links.
- Product pages should remain mobile-first, low-friction, and understandable to
  users outside specialist engineering roles without reducing capability.
- A separate China site is discovery-only until domain, hosting/CDN, ICP,
  privacy, data residency, compliant AI providers, content labeling, operations,
  and support responsibilities are explicitly approved.

## Investment Gates

Before adding major navigation items, server costs, or model-backed features:

1. Observe opens, runs, success/error, and repeat use without collecting secret
   content.
2. Confirm the feature fits an existing user task and can explain its limits.
3. Define processing location, external requests, quotas, and rollback.
4. Prefer local/deterministic processing before adding a model dependency.
5. Release security-sensitive stages independently with tests and production
   smoke checks.
