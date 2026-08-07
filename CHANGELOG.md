# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Embedded a compact, browser-local password generator on the English and
  Simplified Chinese homepages.
- Added password presets, ambiguous/custom character exclusions, and 4–8 word
  passphrase generation.
- Added evidence-led local strength analysis.
- Published answer-ready bilingual tool guidance, consistent tool structured
  data, a typed `/api/tools` manifest, and `/llms.txt`.

### Changed
- Repositioned OpsKitPro as a practical tool collection with Website Check as
  the professional diagnostic anchor.
- Retired the public Blog module and mapped known valuable legacy URLs to
  relevant tools.
- Reduced the public language surface to maintained English and Simplified
  Chinese while preserving redirects for retired locales.
- Standardized the Product runtime on Next.js 16 standalone Node.js on AWS
  Lightsail behind Cloudflare; Cloudflare Workers/KV are no longer Product
  runtime dependencies.
- Consolidated the password page into a focused generator workbench with
  low-frequency settings and current-page history collapsed by default.

### Removed
- Removed the HIBP breach lookup and browser-local encrypted vault after
  narrowing the password product to generation, adjustment, strength feedback,
  and copy. OpsKitPro no longer accepts long-term credential responsibility.

### Security
- Password generation and strength analysis stay in the browser.
- Generated history is limited to the current page session and is not written
  to localStorage, IndexedDB, a server, or a third-party breach service.

### Testing
- The focused password workbench passed application/test type checks,
  production builds, standalone packaging, browser checks, and independently
  successful production releases.

## [0.2.0] - 2026-06-07 - Diagnostics Hub Release

### Added
- **Cloudflare Error Encyclopedia**: Introduced `/errors/[code]` dynamic routes documenting Cloudflare HTTP edge errors (e.g., 522, 1020).
- **DNS Security Audit**: Added `SPF`, `DMARC`, and `CAA` security checks to the DNS Lookup tool with a holistic grading system (A/B/C/F).
- **Markdown Export**: Users can now instantly generate and download Markdown-formatted DNS Security Audit reports.
- **Cloudflare Trace**: New edge connection diagnostics tool to detect Ray ID, Colo, HTTP version, and proxy properties.
- **Diagnostic Linkage**: Implemented contextual discovery banners in `Website Check` to proactively recommend `Cloudflare Trace` or `DNS Security Audit`.
- **Related Tools component**: UI card component cleanly suggesting alternative diagnostics routes.

### Improved
- **Architecture**: Transitioned product positioning from a generic Developer Toolbox to a focused "Diagnostics Hub".
- **Website Check Component**: Decoupled monolithic diagnostic blocks into independent components that do not cause UI short-circuiting when multiple anomalies exist simultaneously.
- **SEO & Structured Data**: Injected `WebApplication`, `FAQPage`, and `BreadcrumbList` JSON-LD schemas across core tools for better SERP presentation.
- **Sitemap Generation**: Enhanced `sitemap.ts` to programmatically include the new `/errors/[code]` routes for Google Search Console ingestion.

### Fixed
- **DNS Iterator Crash**: Fixed a severe structural logic bug where DNS records were assumed to be an array but were actually grouped objects, preventing runtime crashes.
- **Banner Display Collision**: Addressed issues where Website Check conditional logic prematurely exited, hiding critical security warnings behind Cloudflare error alerts.
- **SSR Re-hydration issues**: Refined language and localization placeholders in initial render.

### Testing
- **E2E Stability**: Fully transitioned to exact match and regex multi-language locators to eliminate test flakiness.
- **Closed-loop Test Suite**: Added a dedicated `diagnostics-hub.spec.ts` test verifying the full diagnostic graph (JSON-LD, Banners, CTAs, Sitemaps). Total coverage reached 49 passing Playwright tests.
